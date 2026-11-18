import "server-only";
import { z } from "zod";
export type ActionState = {
  ok: boolean;
  message: string;
  fields?: Record<string, string>;
};
export const initialAction: ActionState = { ok: false, message: "" };
export class ActionError extends Error {}
export function checkDatabase(
  error: { code?: string; message?: string } | null,
): void {
  if (!error) return;
  const messages: Record<string, string> = {
    P0001: "Too many requests. Please wait before trying again.",
    "42501":
      "Your session cannot perform this action. Sign in again or ask an admin.",
    "23505": "That value is already in use. Refresh and try again.",
    "40001":
      "Someone changed this record. Reload it before saving your changes.",
    P0002: "This record is no longer available.",
    "23514":
      "Check the required fields and the current status before trying again.",
  };
  if (messages[error.code ?? ""]) throw new ActionError(messages[error.code!]);
  console.error("ICG database operation failed", {
    code: error.code ?? "unknown",
  });
  throw new ActionError(
    "The desk could not save this change. Please try again.",
  );
}
export async function actionResult(
  work: () => Promise<string | void>,
): Promise<ActionState> {
  try {
    const message = await work();
    return { ok: true, message: message ?? "Saved." };
  } catch (error) {
    if (error instanceof z.ZodError)
      return {
        ok: false,
        message: error.issues[0]?.message ?? "Check your entries.",
        fields: Object.fromEntries(
          error.issues.map((i) => [i.path.join("."), i.message]),
        ),
      };
    if (error instanceof ActionError)
      return { ok: false, message: error.message };
    console.error("ICG action failed", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return {
      ok: false,
      message: "The desk could not complete this request. Please try again.",
    };
  }
}
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use no more than 128 characters.");
export const emailSchema = z.email("Enter a valid email address.").max(254);
