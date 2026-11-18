import { addDays, dayStart, manilaDay } from "./dates";
import { pageNumber } from "./records";
export function auditFilters(params: Record<string, string | undefined>) {
  const from = params.from || addDays(manilaDay(), -30),
    to = params.to || manilaDay(),
    start = dayStart(from),
    end = dayStart(addDays(to, 1));
  if (end <= start || end.getTime() - start.getTime() > 366 * 86400000)
    throw new Error("Choose a date range of at most one year.");
  return {
    from,
    to,
    start: start.toISOString(),
    end: end.toISOString(),
    area: (params.area ?? "").slice(0, 40),
    action: (params.action ?? "").slice(0, 80),
    page: pageNumber(params.page),
  };
}
export function csvCell(value: unknown): string {
  let text =
    value === null || value === undefined
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  if (/^(?:\s*[=+\-@]|[\t\r\n])/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
