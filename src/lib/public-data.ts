import "server-only";
import { z } from "zod";
import { publicClient } from "./data";
import { publicArticleSchema } from "./records";
import { checkDatabase } from "./actions";
import { dayStart, addDays, manilaDay } from "./dates";
export const siteDetailsSchema = z.object({
  office_address: z.string().default(""),
  office_hours: z.string().default(""),
  office_hours_note: z.string().default(""),
  contact_email: z.string().default(""),
  events_email: z.string().default(""),
  phone: z.string().default(""),
  reply_within_school_days: z.coerce.number().default(2),
  facebook_url: z.string().default(""),
  instagram_url: z.string().default(""),
  youtube_url: z.string().default(""),
  tiktok_url: z.string().default(""),
});
export async function siteDetails() {
  const { data, error } = await publicClient()
    .from("site_settings")
    .select("public_details")
    .single();
  checkDatabase(error);
  return siteDetailsSchema.parse(data?.public_details);
}
export async function eventRecords(
  from: string,
  to: string,
  category?: string,
  page = 1,
  size = 20,
  activeOnly = false,
) {
  const begin = dayStart(from).toISOString(),
    end = dayStart(addDays(to, 1)).toISOString();
  let query = publicClient()
    .from("public_articles")
    .select("*", { count: "exact" })
    .eq("type", "event")
    .lt("event_starts_at", end)
    .or(
      `event_ends_at.gt.${begin},and(event_ends_at.is.null,event_starts_at.gte.${begin})`,
    );
  if (category) query = query.eq("category_slug", category);
  if (activeOnly) query = query.eq("visibility", "public");
  const result = await query
    .order("event_starts_at")
    .order("id")
    .range((page - 1) * size, page * size - 1);
  checkDatabase(result.error);
  return {
    items: (result.data ?? []).map((row) => publicArticleSchema.parse(row)),
    count: result.count ?? 0,
  };
}
export async function activeAnnouncements(limit = 5) {
  const { data, error } = await publicClient()
    .from("public_articles")
    .select("*")
    .eq("type", "announcement")
    .eq("visibility", "public")
    .or(`display_until.is.null,display_until.gt.${new Date().toISOString()}`)
    .order("published_at", { ascending: false })
    .order("id")
    .limit(limit);
  checkDatabase(error);
  return (data ?? []).map((row) => publicArticleSchema.parse(row));
}
export async function homeRecords() {
  const client = publicClient(),
    today = manilaDay();
  const [selection, recent, news, upcoming, notices, week] = await Promise.all([
    client.from("featured_stories").select("*").order("position"),
    client
      .from("public_articles")
      .select("*")
      .eq("visibility", "public")
      .or(`display_until.is.null,display_until.gt.${new Date().toISOString()}`)
      .order("published_at", { ascending: false })
      .order("id")
      .limit(6),
    client
      .from("public_articles")
      .select("*")
      .eq("type", "news")
      .eq("visibility", "public")
      .order("published_at", { ascending: false })
      .order("id")
      .limit(3),
    client
      .from("public_articles")
      .select("*")
      .eq("type", "event")
      .eq("visibility", "public")
      .gte("event_starts_at", new Date().toISOString())
      .order("event_starts_at")
      .order("id")
      .limit(3),
    activeAnnouncements(5),
    client.rpc("calendar_counts", { p_from: today, p_to: addDays(today, 6) }),
  ]);
  for (const result of [selection, recent, news, upcoming, week])
    checkDatabase(result.error);
  const selectedIds = (selection.data ?? []).flatMap((row) =>
    row.article_id ? [row.article_id] : [],
  );
  const selected = selectedIds.length
    ? await client
        .from("public_articles")
        .select("*")
        .in("id", selectedIds)
        .eq("visibility", "public")
    : null;
  if (selected) checkDatabase(selected.error);
  const selectedRows = (selected?.data ?? []).map((row) =>
    publicArticleSchema.parse(row),
  );
  const pool = (recent.data ?? []).map((row) => publicArticleSchema.parse(row)),
    used = new Set<string>();
  const featured = [];
  for (let position = 1; position <= 3; position++) {
    const id = selection.data?.find(
      (row) => row.position === position,
    )?.article_id;
    const chosen =
      selectedRows.find(
        (row) =>
          row.id === id &&
          !used.has(row.id) &&
          (!row.display_until || new Date(row.display_until) > new Date()),
      ) ?? pool.find((row) => !used.has(row.id));
    if (chosen) {
      used.add(chosen.id);
      featured.push(chosen);
    }
  }
  const history = await client.rpc("public_anniversaries", { p_day: today });
  checkDatabase(history.error);
  const historical = (history.data ?? []).map((row) =>
    publicArticleSchema.parse(row),
  );
  return {
    featured,
    news: (news.data ?? []).map((row) => publicArticleSchema.parse(row)),
    upcoming: (upcoming.data ?? []).map((row) =>
      publicArticleSchema.parse(row),
    ),
    notices,
    week: week.data ?? [],
    historical,
    today,
  };
}
