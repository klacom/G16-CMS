import { z } from "zod";
import { currentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { auditFilters, csvCell } from "@/lib/audit";
export async function GET(request: Request) {
  const profile = await currentProfile();
  if (!profile)
    return Response.json({ error: "Sign in first." }, { status: 401 });
  if (profile.role !== "admin")
    return Response.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  let filters: ReturnType<typeof auditFilters>;
  try {
    filters = auditFilters(
      Object.fromEntries(new URL(request.url).searchParams),
    );
  } catch {
    return Response.json(
      { error: "Choose a date range of at most one year." },
      { status: 422 },
    );
  }
  const client = await createSupabaseServerClient();
  const snapshot = await client.rpc("export_audit", {
    p_from: filters.start,
    p_to: filters.end,
    p_area: filters.area,
    p_action: filters.action,
  });
  if (snapshot.error)
    return Response.json(
      {
        error:
          snapshot.error.code === "23514"
            ? "Narrow the export to 10,000 entries or fewer."
            : "The audit export could not be loaded.",
      },
      { status: snapshot.error.code === "23514" ? 422 : 503 },
    );
  const rows = z
    .array(
      z.object({
        id: z.union([z.string(), z.number().int()]).transform(String),
        created_at: z.string(),
        actor_id: z.string().nullable(),
        actor_role: z.string().nullable(),
        area: z.string(),
        action: z.string(),
        target_id: z.string().nullable(),
        target_label: z.string().nullable(),
        changes: z.unknown(),
      }),
    )
    .parse(snapshot.data);
  const lines = [
    [
      "Entry",
      "UTC date/time",
      "Person",
      "Role",
      "Area",
      "Action",
      "Target",
      "Label",
      "Changes",
    ]
      .map(csvCell)
      .join(","),
    ...rows.map((row) =>
      [
        row.id,
        row.created_at,
        row.actor_id ?? "Desk",
        row.actor_role,
        row.area,
        row.action,
        row.target_id,
        row.target_label,
        row.changes,
      ]
        .map(csvCell)
        .join(","),
    ),
  ];
  return new Response("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="icg-audit-${filters.from}-${filters.to}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
