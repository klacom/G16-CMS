# Foundation execution evidence

Date: 2026-11-14 (Asia/Manila). Branch: `codex/icg-foundation`.
Authorized scope: T01-T05. No hosted Supabase project or production deployment.
Code save point: `51b5b28` (local commit; no remote push).

## Delivered

| Task | Result |
| --- | --- |
| T01 | Draft contracts and decision register delivered, including all 28 route mappings. Final business-rule reconciliation remains pending. |
| T02 | Exact dependency pins, lockfile, Node/npm requirements and strict TypeScript configuration. Clean lockfile installation verified with install scripts disabled. |
| T03 | Production-buildable Next.js App Router shell, ICG metadata, shared token import and basic response headers. No legacy files copied into public assets. |
| T04 | Working unit/browser/database entry points; temporary assertion failures correctly returned failure and were removed. |
| T05 | Pinned CLI, isolated local stack, configuration validation, browser/server factories, ignored local public environment file, and live fixture checks. |

The foundation was split into the execution steps recorded in decisions.md.
No permanent domain tables, application migrations, or business fixtures were
created. SQL probe tables roll back. Live Auth fixtures are deleted after checks.

## Final checks

| Check | Observed result |
| --- | --- |
| `npm ci --ignore-scripts --offline --cache .cache/npm` | Passed; lockfile replayed without lifecycle scripts |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run test:unit` | 15 tests passed in 2 files |
| `npm run test:db` | 4 pgTAP assertions passed against the ICG local database |
| `npm run test:local` | 3 live client integration tests passed; synthetic user cleanup succeeded |
| `npm run build` | Passed; root route statically generated |
| `npm run test:e2e` | 4 checks passed across 390 px and 1440 px Chromium projects |
| `npm ls --all` | No invalid peer relationships |
| `npm audit` | 0 reported vulnerabilities |
| Negative runner probes | Unit and SQL assertion failures both produced nonzero results |
| Git ignore and source scan | Local environment/cache/build/dependency files ignored; no credential-shaped values found in new source/docs |

Browser checks observed no page/console errors or warnings, no horizontal
overflow, the expected heading/title and headers, and 404 responses for legacy
PHP paths and direct design source URLs. Both screenshots were visually reviewed.
Images are local ignored artifacts at `test-results/shell-mobile.png` and
`test-results/shell-desktop.png`. No Chrome DevTools MCP was available; isolated
Playwright provided the actual browser/console/network verification.

## Review observations

- Correctness: factories read a real local synthetic Auth identity; an invalid
  token is rejected. These are connectivity checks, not completed login flows.
- Security: public key format is validated; privileged credentials stay in test
  provisioning memory; server-only imports protect the server factory. SQL test
  selectors reject paths/remote flags and cannot silently pass with zero files.
- Architecture: no domain schema was guessed. Data/API/auth policy remains gated
  by T01 and T06-T10. The scaffold imports Claude's current design tokens unchanged.
- Readability/performance: small client factories and tooling scripts; a static
  shell has no database dependency, so missing local configuration does not break
  the home route or production compilation.
- Dependency compatibility: TypeScript 6/ESLint 9 satisfy the actual lint plugin
  peers. A scoped minimatch 11.0.1 override fixes the transitive advisory; lint,
  dependency-tree and audit checks passed after the patch and clean install.

## Environment notes and remaining limits

- Docker was initially stopped and was started. The default DB port was already
  occupied; ICG moved to 55320-55329 without changing the existing service.
- The local DB/Auth/API/mail stack remains running for development. The temporary
  browser-test server stopped when Playwright finished. Start the app with
  `npm run dev`; complete instructions are in setup.md.
- Managed sandbox restrictions blocked Next's worker spawn and Docker access on
  initial attempts. The same checks passed with authorized process/Docker access.
- CLI credential-bearing startup/status output stays in ignored local storage
  or memory and is not included in this document or committed source.
- Node-only test-process output included FORCE_COLOR/NO_COLOR environment
  warnings; browser page consoles were clean.
- The external migration artifact remains inaccessible. Quorum, archive/expiry,
  onboarding and other business decisions are still pending as recorded in
  decisions.md. Do not infer their approval from successful foundation tests.
- Server session refresh/proxy, role authorization and audit writes remain later
  tasks. No deployment or production security-readiness claim is made here.
- Claude's design inputs are being developed concurrently. The current tokens
  now declare Midnight & Marigold / Anton + Public Sans; older Mock Design 6 and
  provisional-color references in the original plan are historical context.
