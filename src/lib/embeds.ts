import { z } from "zod";
export const widgetConfigSchema = z.object({
  kind: z.enum(["events", "announcements"]),
  view: z.enum(["list", "calendar"]),
  layout: z.enum(["column", "row"]),
  startdate: z.iso
    .date()
    .refine(
      (value) => value >= "2000-01-01" && value <= "2099-12-31",
      "Choose a date from 2000 through 2099.",
    ),
  limit: z.coerce.number().int().min(1).max(10),
  height: z.coerce.number().int().min(240).max(1600),
});
export type WidgetConfig = z.infer<typeof widgetConfigSchema>;
export function embedCode(input: unknown, origin: string) {
  const config = widgetConfigSchema.parse(input),
    base = new URL(origin);
  if (
    !["https:", "http:"].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.pathname !== "/" ||
    base.search ||
    base.hash
  )
    throw new Error("Use a site origin.");
  if (
    base.protocol === "http:" &&
    !["localhost", "127.0.0.1"].includes(base.hostname)
  )
    throw new Error("Use HTTPS for public embeds.");
  const url = new URL(`/embed/${config.kind}`, base),
    title =
      config.kind === "events"
        ? "ICG campus events"
        : "ICG campus announcements";
  if (config.kind === "events") {
    url.searchParams.set("view", config.view);
    url.searchParams.set("startdate", config.startdate);
    if (config.view === "list")
      url.searchParams.set("limit", String(config.limit));
  } else {
    url.searchParams.set("layout", config.layout);
    url.searchParams.set("limit", String(config.limit));
  }
  const encoded = url.href.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  return {
    url: url.href,
    title,
    code: `<iframe src="${encoded}" title="${title}" width="100%" height="${config.height}" style="border:0;" loading="lazy"></iframe>`,
  };
}
