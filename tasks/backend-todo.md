# ICG approved implementation execution

Each slice includes focused tests, authorization checks, type regeneration where applicable and verification evidence in backend-evidence.md. T02-T05 foundation completion and design-todo.md remain preserved. Split large slices into bounded implementation steps; do not claim a module complete from schema alone.

- [x] B00: Record approved replacement contract and module map.
- [x] B01: Prove active session/role RLS and first-admin bootstrap; login/logout shell.
- [x] B02: Invitation/recovery/account/users lifecycle and invalidation.
- [x] B03: Create/save/submit/accept/approve/publish/read News end to end.
- [x] B04: Fix requests, second-read diff, schedules, archive, withdrawal and replacement drafts.
- [x] B05: Tiptap, private image uploads/galleries, events and notices.
- [x] B06: Public Home, archive/search, calendar/ICS, About and site management.
- [x] B07: Notifications, Resend outbox, public Contact, admin replies and webhook delivery.
- [x] B08: Audit/export, retention/jobs, embeds/builder and role Overviews.
- [x] B09: Browser acceptance, production build, security review and deployment documentation.
- [ ] B10: Dedicated hosted ICG setup, sender/domain configuration and hosted acceptance.

Acceptance: each item delivers the corresponding behavior in backend-plan.md, passes relevant automated checks and records actual evidence. B10 database/configuration work is complete; its remaining launch work depends on the domain and verified mail sender.

Local implementation and acceptance completed November 17, 2026. B10 remains pending external configuration; see deployment.md and backend-evidence.md. Local completion does not claim hosted email delivery or public launch.

Cloud progress November 18:
- [x] B10a: Verify ICG organization/project and empty target; apply 14 migrations with matching history.
- [x] B10b: Configure invite-only hosted Auth, public-only Data API and private Storage/jobs; switch app environment securely.
- [x] B10c: Regenerate cloud types; pass 33 live API checks and 26 cloud-backed browser checks without cloud fixtures.
- [ ] B10d: Configure verified Resend SMTP/API/webhooks, install Auth templates, verify first-admin email and real deliveries.
- [ ] B10e: Canonical domain/Vercel/HTTPS worker origin, monitoring destinations, approved public content/assets and launch acceptance.
