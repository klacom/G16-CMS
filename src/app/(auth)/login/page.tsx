import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { login } from "../actions";

export const metadata: Metadata = { title: "Log in · ICG" };

export default function LoginPage() {
  return (
    <>
      <p className="kicker">The campus desk</p>
      <h1>Welcome back.</h1>
      <p>Sign in to write, review and keep campus life on the record.</p>
      <ActionForm action={login} className="form-stack">
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
          />
        </label>
        <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      </ActionForm>
      <Link href="/forgot-password">Forgot your password?</Link>
      <p className="muted">
        Accounts are by invitation. Ask an ICG admin to join the desk.
      </p>
    </>
  );
}
