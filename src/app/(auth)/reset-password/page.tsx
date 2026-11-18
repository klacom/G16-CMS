import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { resetPassword } from "../actions";
export default function ResetPasswordPage() {
  return (
    <>
      <p className="kicker">Secure your account</p>
      <h1>A new password.</h1>
      <p>Use at least 12 characters. Your other sessions will be signed out.</p>
      <ActionForm action={resetPassword} className="form-stack">
        <label>
          New password
          <input
            type="password"
            name="password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            name="confirm"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
        <SubmitButton>Change password</SubmitButton>
      </ActionForm>
      <Link href="/login">Back to sign in</Link>
    </>
  );
}
