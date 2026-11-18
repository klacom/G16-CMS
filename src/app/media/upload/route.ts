import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { currentProfile, siteOrigin } from "@/lib/auth";
import { limitedFormData, imageMime, MAX_UPLOAD_BYTES } from "@/lib/uploads";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== siteOrigin())
    return Response.json(
      { error: "Upload from the ICG desk." },
      { status: 403 },
    );
  const profile = await currentProfile();
  if (!profile)
    return Response.json(
      { error: "Sign in again before uploading." },
      { status: 401 },
    );
  let form: FormData;
  try {
    form = await limitedFormData(request);
  } catch {
    return Response.json(
      { error: "Choose a JPG, PNG or WebP image up to 4 MB." },
      { status: 413 },
    );
  }
  const file = form.get("file"),
    purpose = form.get("purpose");
  if (
    !(file instanceof File) ||
    !file.size ||
    file.size > MAX_UPLOAD_BYTES ||
    !["article", "avatar", "about"].includes(String(purpose))
  )
    return Response.json(
      { error: "Choose an image up to 4 MB." },
      { status: 422 },
    );
  const bytes = new Uint8Array(await file.arrayBuffer()),
    mime = imageMime(bytes);
  if (!mime || mime !== file.type)
    return Response.json(
      { error: "The file must be a real JPG, PNG or WebP image." },
      { status: 422 },
    );
  const article =
    purpose === "article" ? z.uuid().safeParse(form.get("article")) : null;
  if (purpose === "article" && !article?.success)
    return Response.json(
      { error: "Choose an article first." },
      { status: 422 },
    );
  const client = await createSupabaseServerClient(true);
  const reserved = await client
    .rpc("reserve_media", {
      p_type: mime,
      p_bytes: file.size,
      p_purpose: String(purpose),
      ...(article?.success ? { p_article: article.data } : {}),
    })
    .single();
  if (reserved.error || !reserved.data)
    return Response.json(
      { error: "This account cannot upload to this article." },
      { status: 403 },
    );
  const upload = await client.storage
    .from("icg-media")
    .upload(reserved.data.object_path, bytes, {
      contentType: mime,
      upsert: false,
      cacheControl: "0",
    });
  if (upload.error)
    return Response.json(
      { error: "The image could not be stored. Please try again." },
      { status: 502 },
    );
  const completed = await client.rpc("complete_media", {
    p_id: reserved.data.id,
  });
  if (completed.error)
    return Response.json(
      { error: "The stored image could not be verified. Please try again." },
      { status: 422 },
    );
  return Response.json(
    { id: reserved.data.id, url: `/media/${reserved.data.id}` },
    { headers: { "Cache-Control": "no-store" } },
  );
}
