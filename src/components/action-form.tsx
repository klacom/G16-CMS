"use client";
import { useActionState, useState } from "react";
import { useUnsavedChanges } from "./unsaved-changes";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/actions";

export function ActionForm({
  action,
  children,
  className,
  id,
  guard = false,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  id?: string;
  guard?: boolean;
}) {
  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(guard && dirty);
  const [state, submit] = useActionState(
    async (previous: ActionState, form: FormData) => {
      const result = await action(previous, form);
      if (result.ok) setDirty(false);
      return result;
    },
    { ok: false, message: "" },
  );
  return (
    <form
      id={id}
      action={submit}
      className={className}
      onInput={() => {
        if (guard) setDirty(true);
      }}
      onChange={() => {
        if (guard) setDirty(true);
      }}
    >
      {children}
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={state.ok ? "form-success" : "form-error"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
export function SubmitButton({
  children,
  pendingText = "Saving…",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className ?? "button"}>
      {pending ? pendingText : children}
    </button>
  );
}
