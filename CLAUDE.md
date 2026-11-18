# G16-CMS → ICG

This repo holds the legacy Lundayan CMS (plain PHP + MySQL + jQuery). It is being
rebuilt and rebranded as **ICG — Integrated Communications Group** on Next.js,
Supabase and Vercel. The old MySQL database is lost; there is no data to migrate.

## Claude's role here: design prototyping only

- **For now, prototype in HTML** (user decision, after the Figma MCP cap): static
  HTML + Tailwind CDN pages in `design/prototypes/`, using `design/tokens.css` and
  `design/tailwind.config.js`, previewed with the `design` server in
  `.claude/launch.json` and checked at 390 px and 1440 px. `home.html` is the current
  Home prototype. Figma (file `H8cLeaupZB7AHxFpNalfeA`) stays the place for the
  team's variants when they return to it.
- Figma MCP calls are capped (Starter plan, can't upgrade), so designs are delivered
  as Plugin API scripts in `design/figma-scripts/` that the user runs with Scripter.
- **`DESIGN.md` (repo root) is the design system and the source of truth** for the
  look: colors, type, layout, components and the named rules ("The Campus Marquee").
  Read it before designing any page. If a page needs something it doesn't cover,
  extend DESIGN.md and `design/tokens.css` together; never invent a one-off value.
  `.impeccable/design.json` is its generated sidecar.
- Token values (`design/tokens.css`, `design/tailwind.config.js`) must match the
  DESIGN.md frontmatter exactly. Handoff notes live in `design/handoff/`.
- The Next.js app, Supabase schema, auth and all backend work are done by another
  tool (ChatGPT). Do not write that code here unless explicitly asked.
- The legacy PHP app (pages, `php-backend/`, `scripts/`, styles, fonts and uploaded
  photos) lives in `legacy/`. Treat it as a feature reference. Do not modify or "fix" it; its
  security holes (missing auth checks, SQL injection) are documented in the plan.

## References

- Migration plan (features, new data model, phases): https://claude.ai/artifact/XLxYzwpGB6jzqUBMgaRGBL
- Concept: PLP's news and events record with the calendar as the main way in (Manila Bulletin as a concept reference only, not its look).
- Figma: https://www.figma.com/design/H8cLeaupZB7AHxFpNalfeA/ICG-Rebranding
- Design system: `DESIGN.md`; tokens: `design/tokens.css` + `design/tailwind.config.js`
- Prototypes so far: home, calendar, article, archive, about, contact, login, reset password, accept invite, desk overview (month desk), my articles (proof sheet), article editor, reviews (review inbox), inbox, account, users, messages, audit log, site settings (all in `design/prototypes/`); page list in `design/PAGES.md`
- Product context: `PRODUCT.md` (users, roles, invite-only accounts)
- **Picking up the work? Read `design/HANDOFF.md` first**: status, workflow, tools (`design/tools/`), and the next task.

## Conventions

- Mobile first: every prototype checked at 390 px and 1440 px.
- Name data fields after the new data model in the plan (e.g. `articles.excerpt`,
  `articles.event_starts_at`), not the old PHP column names.
- No Lundayan branding, no lorem ipsum.
