# ICG implementation contracts

Status: superseded by the user-approved backend-plan.md on 2026-11-17. The route inventory below remains useful; provisional rules are retained as historical context, not current requirements.
Source: `CLAUDE.md`, `design/PAGES.md`, legacy behavior as reference only.
The inaccessible external artifact has not been reproduced or approved here.

## Shared conventions

Use UUID application identifiers, UTC instants, and Asia/Manila display as the
proposed defaults. Public article URLs use unique slugs. Names established by
the local notes include `articles.excerpt`, `articles.event_starts_at`, and
`categories.name`; other exact columns/types remain to be specified before the
corresponding migration. Do not derive new API field names from legacy columns.

Use validated server actions for app forms, server queries for page data, and
route handlers when an HTTP consumer exists (exports, jobs). Expected validation
failures return field-safe errors. Unexpected failures do not expose raw database
messages, secrets, or stack traces. Lists have bounded pagination and a stable
tie-breaker. No fixed numeric limits are silently invented as client requirements.

## Proposed data boundaries

| Area | Proposed responsibilities; not final table declarations |
| --- | --- |
| Identity | Auth identity, public profile projection, server-controlled roles/active state |
| Articles | Owner, title, excerpt, type, slug, content revision and editorial state |
| Publication | Approved revision, publication schedule, actual publication and withdrawal |
| Taxonomy | Categories, tags and article associations |
| Events | Event start/end, venue and constrained map URL; distinct from publication time |
| Media | Owner/article reference, object path, MIME/size, alt text and gallery order |
| Reviews | Revision-scoped invitations, assignments, decisions and comments |
| Notifications | Recipient-scoped workflow events, read state and retry deduplication |
| Contact | Private sender/message data, reply/delivery status |
| Settings | Explicit public projection; provider secrets live outside editable settings |
| Audit | Server-attributed append-only actions; no secrets or full message bodies |

## Confirmed access rules

The user confirmed on 2026-11-14: one role per account initially (Writer,
Reviewer or Admin); Admins may manage every article but must obtain reviewer
approval before publication; deactivation immediately removes authenticated
access while retaining the account's articles, attribution and audit history.
Apply deactivation checks to existing sessions as well as new sign-ins. It does
not itself alter the publication state of preserved articles.

## Permission matrix

| Actor | Intended access | Must be denied |
| --- | --- | --- |
| Anonymous | Eligible published content, approved public settings, contact submission | Drafts, private media, users, comments, messages, audit, privileged writes |
| Writer | Own drafts and editorial workflow; eligible reviewer invitations | Another writer's private material, role assignment, self-approval bypass |
| Reviewer | Accepted assigned revisions, review discussion and decisions | Unassigned private content, editing article bodies, administrative data |
| Admin | Manage every article; user/site administration, private messages and audit | Forging audit history or publishing without reviewer approval |
| Inactive account | Public access available to anonymous visitors; articles and history retained | Dashboard access or authenticated operations, including through an old session/token |

One-role membership, admin article-management scope and the prohibition on an
admin review bypass are confirmed. Reviewer eligibility, self-review, reviewer
quorum and last-admin safeguards still need explicit agreement before their
affected implementation. Other matrix entries retain their existing proposed
scope until the corresponding contract review.
Role checks use authoritative server-controlled data, never user-editable metadata.

## Editorial state proposal

`draft -> in_review -> approved -> published -> archived` follows the states in
PAGES.md. Scheduling is a publication time/transition concern; it is not silently
added as a new status badge. Requesting changes returns the revision to an agreed
editable state. Invitations have their own pending/accepted/declined/cancelled
lifecycle. Invitation state is not approval.

Proposed safeguards: reviews bind to a revision; edited content cannot inherit
stale approval; a writer editing a published article works on a new draft while
the last approved revision remains public; zero reviewers never accidentally
approve an article. The quorum and exact re-review behavior remain pending.
Admins are subject to reviewer approval before publication under the confirmed
access rules; this does not decide the quorum or self-review policy.
Concurrent transitions must check the expected revision/state atomically.

## Public visibility proposal

All read paths must agree on published revision, due publication time, and the
agreed archive/expiry behavior. This includes direct API reads, joins, related
stories, search, feeds, calendar, widgets, media and caches. A service key is not
a shortcut for public queries. Draft media stays private.

Do not implement archival visibility until the client chooses whether archived
articles are historical public records or withdrawn material. Legacy archive
flags and widget expiry are inconsistent; they are evidence, not a policy.
Restoration, expiration, cache retention and published-media revocation need
the same explicit contract before T35.

## Route inventory and handoff map

| # | Route/screen | Data/behavior contract | Tasks |
| --- | --- | --- | --- |
| 1 | `/` | Featured/latest eligible content, announcements, events | T13/T19/T46 |
| 2 | `/news/[slug]` | Eligible revision, taxonomy, related stories, media, event block | T11/T24/T27-T28/T33 |
| 3 | `/archive` | Search, category/tag/date filters, stable pagination | T14-T15 |
| 4 | `/calendar` | Event-time month and upcoming queries | T16/T28 |
| 5 | `/about` | Public structured site sections | T17/T44 |
| 6 | `/contact` | Public office information, validated private submission | T17-T18/T39-T40 |
| 7 | `/team` | Conditional approved public profiles | T50 |
| 8 | Not found/error | Branded recovery, no diagnostics disclosure | T19 |
| 9 | `/login` | Password sign-in, server-validated session | T07 |
| 10 | `/forgot-password` | Enumeration-safe recovery request | T08 |
| 11 | `/reset-password` | Valid recovery context and new password | T08 |
| 12 | `/auth/invite` | Conditional onboarding with controlled role | T37 |
| 13 | `/dashboard/*` layout | Role-aware navigation and server authorization | T22 |
| 14 | `/dashboard` | Bounded role-scoped overview | T22 |
| 15 | `/dashboard/inbox` | Recipient-only workflow/mention events | T29-T30/T36 |
| 16 | `/dashboard/account` | Own name/email/avatar/password | T20-T21 |
| 17 | `/dashboard/articles` | Permitted list and status/search filters | T23/T35 |
| 18 | `/dashboard/articles/[id]/edit` | Owned revision editing and guarded transitions | T23-T29/T33-T35 |
| 19 | `?status=archived` | Archived writer filter; optional separate screen undecided | T35 |
| 20 | `/dashboard/reviews` | Assigned reviewer queue | T30 |
| 21 | `/dashboard/reviews/[id]` | Assigned read-only revision, comments, decisions | T30-T32 |
| 22 | `/dashboard/users` | Admin invitations, roles and active state | T37-T38 |
| 23 | `/dashboard/messages` | Admin private inbox, replies/delivery status | T39-T40 |
| 24 | `/dashboard/audit` | Admin bounded filters and safe CSV export | T10/T41-T42 |
| 25 | `/dashboard/settings` | Admin public settings, sections, taxonomy and curation | T43-T46 |
| 26 | `/dashboard/settings/embeds` | Allowed options, exact preview and escaped code | T49 |
| 27 | `/embed/events` | Public eligible events, bounded compact views | T47 |
| 28 | `/embed/announcements` | Public eligible announcements, row/column layout | T48 |

Claude supplies `design/handoff/<page>.md` and prototype states. Codex supplies
React routes, data access, validation and runtime verification. Missing handoffs
block visual acceptance, not foundation work. Keep current tokens in place.

## Foundation acceptance boundary

T01 can provide this contract draft and identify all gates. It cannot claim the
business rules are reconciled with the unavailable external plan. T02-T05 may
proceed because they introduce no domain schema or publishing/auth policy.
Live local client tests use disposable synthetic Auth identities and public
configuration; they do not enable production registration or select a hosted app.
