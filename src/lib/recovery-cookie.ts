import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function signature(value: string): string {
  const key = process.env.ICG_AUTH_COOKIE_SECRET;
  if (!key || key.length < 32)
    throw new Error("ICG_AUTH_COOKIE_SECRET must be configured.");
  return createHmac("sha256", key).update(value).digest("base64url");
}
export function recoveryCookie(userId: string): string {
  const value = `${userId}.${Math.floor(Date.now() / 1000) + 600}`;
  return `${value}.${signature(value)}`;
}
export function validRecoveryCookie(
  cookie: string | undefined,
  userId: string,
): boolean {
  if (!cookie) return false;
  const [id, expiry, mac, ...extra] = cookie.split(".");
  if (
    extra.length ||
    id !== userId ||
    !/^\d+$/.test(expiry ?? "") ||
    Number(expiry) < Date.now() / 1000 ||
    Number(expiry) > Date.now() / 1000 + 601 ||
    !mac
  )
    return false;
  const expected = Buffer.from(signature(`${id}.${expiry}`));
  const received = Buffer.from(mac);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}
