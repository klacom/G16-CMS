export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export function imageMime(
  bytes: Uint8Array,
): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b))
    return "image/png";
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}
export async function limitedFormData(request: Request): Promise<FormData> {
  const max = MAX_UPLOAD_BYTES + 64 * 1024;
  if (Number(request.headers.get("content-length") ?? 0) > max)
    throw new Error("Upload an image up to 4 MB.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Choose an image.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > max) {
      await reader.cancel();
      throw new Error("Upload an image up to 4 MB.");
    }
    chunks.push(value);
  }
  return new Response(Buffer.concat(chunks), {
    headers: { "content-type": request.headers.get("content-type") ?? "" },
  }).formData();
}
