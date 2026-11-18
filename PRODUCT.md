# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Readers (public site):** PLP students first, then faculty, staff, organizers, alumni
  and visitors. They want to know what is happening this week, find the details of an
  event, and look back at what happened.
- **Writers (dashboard):** ICG student staff, plus invited student organization officers
  and offices who post their own stories and events now and then. Officers are occasional
  users who may not remember how the desk works between posts.
- **Reviewers (dashboard):** ICG student editors (section editors, editor-in-chief). They
  read assigned drafts, comment, and approve or request changes.
- **Admins (dashboard):** ICG staff who invite people, set roles, answer contact
  messages, keep the audit trail and edit site settings.

Writers and reviewers work on both computers and phones about evenly: drafting mostly on
laptops or campus lab computers, checking status and approving on phones between classes.

## Product Purpose

ICG (Integrated Communications Group) is Pamantasan ng Lungsod ng Pasig's news and
events record. It brings stories, events and announcements into one shared campus record
so people can see what's happening, find the details, and look back. The private desk
exists so contributors can get accurate, reviewed stories and events onto that record.

Success for the desk: a writer can submit a story or event for review without help,
always knows where it stands, and a reviewer can clear their queue quickly and fairly.

## Positioning

The calendar is the main way in: every story and event is tied to its date, and the
archive is a dated record of campus life ("Campus life, on the record."). Publication
always passes through a reviewer, so what appears is something ICG stands behind.

## Operating Context

- One account, one role: Writer, Reviewer or Admin (confirmed 2026-11-14).
- **Accounts are invite only** (user decision, 2026-11-15): an admin invites by email and
  the link opens the accept-invite page. There is no public sign-up.
- Editorial states: draft, in review, approved, published, archived.
- Admins can manage every article but still need reviewer approval to publish.
- Deactivated accounts lose access at once, including existing sessions; their articles,
  authorship and audit history stay.
- Shared and lab computers are common, so sign-in must not assume a private device.
- Rebuilt as Next.js + Supabase + Vercel by a separate tool; this repo's design work is
  static HTML prototypes in `design/prototypes/`.

## Capabilities and Constraints

- Public: home, calendar, article, archive, about, contact. Private: overview, inbox,
  account settings, my articles, article editor, review queue and review page, admin
  users, contact messages, audit log, site settings, embed widget builder. Embeddable
  events and announcements widgets for other sites. Full list: `design/PAGES.md`.
- Field names follow the new data model (`articles.excerpt`, `articles.event_starts_at`,
  `categories.name`), not legacy PHP columns.
- The old database is lost; there is no content to migrate.
- **Undecided:** reviewer quorum and self-review, whether archived articles stay public,
  rich-text format and video support, the Team page, mail provider, Google sign-in
  (deferred until PLP's Google Workspace use is confirmed).

## Brand Commitments

- Name: ICG — Integrated Communications Group, at PLP. Signature line
  "Campus life, on the record." Identity and voice: `IDENTITY.md`.
- No Lundayan branding anywhere. Manila Bulletin is a concept reference only.
- Plain, welcoming language; separate confirmed details from pending ones.

## Evidence on Hand

- Real PLP photographs in `legacy/gallery/` (many carry an old watermark; landscape originals
  over 2400px are still needed for heroes).
- All article, event, contact and archive copy in the prototypes is placeholder for ICG
  to confirm. Contact addresses and turnaround times are placeholders. Do not present
  any of it as real records, testimonials or statistics.

## Product Principles

1. The date is the spine: every item shows its day and links back to the calendar.
2. Reviewed before published: the workflow makes review visible, never skippable.
3. Always say where things stand: every article shows its status and the next step.
4. Built for the occasional contributor: an org officer who posts twice a semester can
   finish without training.
5. Works on the phone between classes as well as on the lab computer.

## Accessibility & Inclusion

Text contrast at least 4.5:1 (large text 3:1), 44px tap targets, visible focus, real
labels, reduced-motion support, every page checked at 390px and 1440px.
