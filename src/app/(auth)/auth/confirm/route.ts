import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeReturnPath } from "@/lib/auth";
import { recoveryCookie } from "@/lib/recovery-cookie";

export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const code = request.nextUrl.searchParams.get("code");
  const client = await createSupabaseServerClient(true);
  let valid = false;
  if (code) valid = !(await client.auth.exchangeCodeForSession(code)).error;
  else if (
    token_hash &&
    ["invite", "recovery", "email_change"].includes(type ?? "")
  ) {
    const result = await client.auth.verifyOtp({
      token_hash,
      type: type as "invite" | "recovery" | "email_change",
    });
    valid = !result.error;
    if (valid && type === "recovery" && result.data.user) {
      const { cookies } = await import("next/headers");
      (await cookies()).set(
        "icg-recovery",
        recoveryCookie(result.data.user.id),
        {
          httpOnly: true,
          secure: request.nextUrl.protocol === "https:",
          sameSite: "lax",
          maxAge: 600,
          path: "/",
        },
      );
    }
  }
  const next = valid
    ? safeReturnPath(request.nextUrl.searchParams.get("next"))
    : "/login?link=invalid";
  return NextResponse.redirect(new URL(next, request.url), {
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}
