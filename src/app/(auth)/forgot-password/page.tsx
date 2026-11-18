import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { requestRecovery } from "../actions";
export default function ForgotPasswordPage() {
  return (
    <>
      <p className="kicker">Back to the desk</p>
      <h1>Reset your password.</h1>
      <p>
        Enter the email you use at the ICG desk. We’ll send a reset link if it
        has an account.
      </p>
      <ActionForm action={requestRecovery} className="form-stack">
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <SubmitButton pendingText="Requesting link…">
          Send reset link
        </SubmitButton>
      </ActionForm>
      <Link href="/login">Back to sign in</Link>
    </>
  );
}
