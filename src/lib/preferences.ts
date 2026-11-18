import type { Role } from "./auth";
export function preferenceKinds(role: Role) {
  return role === "reviewer"
    ? ["review_requested", "resubmitted", "published"]
    : role === "admin"
      ? [
          "invite_accepted",
          "invite_expired",
          "contact_messages",
          "reviewer_stepped_down",
        ]
      : [
          "review_accepted",
          "changes_requested",
          "approved",
          "published",
          "goes_live_soon",
        ];
}
