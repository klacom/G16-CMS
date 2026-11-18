import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = z.uuid().safeParse((await params).id);
  const headers = {
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    Vary: "Cookie",
  };
  if (!id.success) return new Response("Not found", { status: 404, headers });
  // Authorization always uses the caller's identity. The narrow byte-delivery
  // adapter is privileged so clients cannot mint persistent Storage signed URLs.
  const client = await createSupabaseServerClient();
  const location = await client
    .rpc("media_location", { p_id: id.data })
    .maybeSingle();
  if (location.error || !location.data)
    return new Response("Not found", { status: 404, headers });
  const downloaded = await createSupabaseAdminClient()
    .storage.from("icg-media")
    .download(location.data.object_path);
  if (downloaded.error || !downloaded.data)
    return new Response("Image unavailable", { status: 503, headers });
  return new Response(downloaded.data, {
    headers: {
      ...headers,
      "Content-Type": location.data.content_type,
      "Content-Disposition": `inline; filename="${id.data}"`,
    },
  });
}
