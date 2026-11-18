# Handoff — Site settings (admin)

Prototype: `design/prototypes/dashboard-settings.html` (+ `desk.css`, `desk.js`, `public-data.js` for sample stories)
Route: `/dashboard/settings` (PAGES #25), one section at a time with `?section=featured|categories|about|contact|email`;
in `npm run dev` it shows at that route. Admin only. The embed builder (#26) is its own page at
`/dashboard/settings/embeds`, linked from the section menu.
Designed 2026-11-16 as a single direction. Replaces `admin-settings.php` (highlighted articles, mail
configuration with an app password, social links, site info, About banner and sections).
Rules: DESIGN.md › Dashboard › "Site settings (admin)".

## Embed builder connection — D08 (November 17, 2026)

Embed widgets now opens `dashboard-embeds.html` with admin, current section and the
`mail=on` demo flag when applicable. Its return link restores that section. The
existing Leave without saving dialog protects the link: Cancel stays, Discard clears
the section's unsaved work before navigation. The link no longer uses a later-round
notice. Builder options and local/production origin boundaries are specified in
`design/handoff/dashboard-embeds.md`. Settings persistence, mail delivery and
publication semantics are unchanged.

## Components
| `data-component` | Notes |
| --- | --- |
| `SettingsNav` | Section menu: column on desktop, sideways pills on phones; dot for unsaved changes. |
| `SettingsSection` / `SaveRow` | Ruled section; the save row appears only when something changed. |
| `FeaturedList` / `FeaturedSlot` / `EmptySlot` | Up to 3 home slides, ordered with up/down buttons; empty places fall back to the newest story. |
| `AddFeatured` / `StoryPick` | Search published stories; Add is disabled when all 3 places are taken. |
| `AddCategory` / `CategoryList` / `CategoryRow` / `RenameCategory` | Applies at once. Archive confirms; delete (unused only) and rename offer Undo. |
| `AboutSections` / `AboutSectionRow` / `AboutItem` | Order with a save row; content edited in the side sheet and saved from it. |
| `VisitFields` / `WriteFields` / `SocialFields` / `ErrorSummary` | Contact form with summary + inline errors, re-checked as you fix them. |
| `MailFacts` / `TestFailed` | Read only. `?mail=on` shows a connected service and a successful test. |
| `ConfirmDialog`, `SideSheet` | Leave without saving; archive a category; About section editor. |

## Data
- `site_settings` (one row, public projection only): `office_address`, `office_hours`, `office_hours_note`,
  `contact_email`, `events_email`, `phone`, `reply_within_school_days` (1, 2, 3 or 5; used by the Contact
  page copy and by Messages' "Reply by"), `facebook_url`, `instagram_url`, `youtube_url`, `tiktok_url`.
  Validate social links server-side: https and the network's own domain (T43: "reject an unsafe URL").
- `featured_stories`: `position` (1–3), `article_id`. Only published, not archived, not future-scheduled
  articles are eligible (T46); when one stops being eligible, its place falls back to the newest published story.
- `categories`: `id`, `name` (unique, case-insensitive), `slug` (stable: set on create, unchanged on rename,
  so links keep working), `archived_at`. Delete only when no article references it; otherwise archive (T45).
- `about_sections`: `key`, `position`, `heading`, `body`/`note`, `items` (jsonb `[{title, text}]`).
  Introduction is always first and the call-to-action band always last; a section whose items are all empty
  is hidden. Plain text only in the prototype (T44 asks for "safe rich content": decide the format with the editor's).
- Mail service credentials stay in server environment/provider config, never in `site_settings` (T43). The page
  only reads whether the service is connected and can send a test to the signed-in admin.
- Every save, category change and test email writes an audit entry (area `settings`) with before/after values;
  long text is logged as "edited" without the text.

## Open questions
- Is three the right number of featured places? The home carousel was designed for three.
- Which social networks does ICG actually use? The public footer currently omits them until confirmed.
- About page photo and the About lead image: should admins change them here? (Not in this prototype.)
- Rich text in About sections: plain paragraphs, or links and bold too?
- Can the "Shown as" sender name be edited here, or is it fixed with the mail setup?
