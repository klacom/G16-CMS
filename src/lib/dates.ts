export const SITE_TIME_ZONE = "Asia/Manila";
export function manilaDay(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SITE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type)?.value)
    .join("-");
}
export function dayStart(day: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("Choose a valid date.");
  const date = new Date(`${day}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime()) || manilaDay(date) !== day)
    throw new Error("Choose a valid date.");
  return date;
}
export function addDays(day: string, amount: number): string {
  return manilaDay(new Date(dayStart(day).getTime() + amount * 86_400_000));
}
export function eventOverlapsDay(
  start: string,
  end: string | null,
  day: string,
): boolean {
  const from = dayStart(day).getTime(),
    starts = new Date(start).getTime();
  return (
    starts < from + 86_400_000 &&
    (end ? new Date(end).getTime() : starts + 1) > from
  );
}
export function businessDeadline(created: string, days: number): string {
  let day = manilaDay(new Date(created)),
    remaining = Math.max(0, Math.min(30, Math.trunc(days)));
  while (remaining > 0) {
    day = addDays(day, 1);
    const weekday = new Date(`${day}T12:00:00+08:00`).getUTCDay();
    if (weekday !== 0 && weekday !== 6) remaining--;
  }
  return day;
}
export function formatDate(value: string, time = false): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: SITE_TIME_ZONE,
    dateStyle: "medium",
    ...(time ? { timeStyle: "short" as const } : {}),
  }).format(new Date(value));
}
export function localInput(value: string | null): string {
  return value
    ? new Date(new Date(value).getTime() + 8 * 3_600_000)
        .toISOString()
        .slice(0, 16)
    : "";
}
export function fromManilaInput(value: string): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("Choose a valid date and time.");
  const parsed = new Date(`${value}:00+08:00`);
  if (
    Number.isNaN(parsed.getTime()) ||
    localInput(parsed.toISOString()) !== value
  )
    throw new Error("Choose a valid date and time.");
  return parsed.toISOString();
}
type CalendarEvent = {
  id: string;
  title: string;
  slug: string;
  event_starts_at: string | null;
  event_ends_at: string | null;
  venue: string | null;
  updated_at: string;
};
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}
function icsDate(text: string): string {
  return new Date(text)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}
function fold(line: string): string {
  const lines: string[] = [];
  let current = "";
  for (const char of line) {
    if (Buffer.byteLength(current + char, "utf8") > 75) {
      lines.push(current);
      current = " ";
    }
    current += char;
  }
  lines.push(current);
  return lines.join("\r\n");
}
export function calendarFeed(events: CalendarEvent[], origin: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ICG//Campus Record//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:ICG campus events",
    "X-WR-TIMEZONE:Asia/Manila",
  ];
  for (const event of events) {
    if (!event.event_starts_at) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${icsEscape(event.id)}@icg`,
      `DTSTAMP:${icsDate(event.updated_at)}`,
      `DTSTART:${icsDate(event.event_starts_at)}`,
    );
    if (event.event_ends_at)
      lines.push(`DTEND:${icsDate(event.event_ends_at)}`);
    lines.push(
      `SUMMARY:${icsEscape(event.title)}`,
      `LOCATION:${icsEscape(event.venue ?? "")}`,
      `URL:${new URL(`/news/${encodeURIComponent(event.slug)}`, origin).href}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
