# ICG public-site walkthrough

The public prototypes are connected as one browsable design preview. Start here:

**http://127.0.0.1:4321/design/prototypes/**

The folder entry opens Home. The shared navigation connects Home, Calendar,
Archive, About, and Contact. Story and event cards open matching detail
pages. The Log in link opens the Campus Desk concept as an optional design stop;
no private dashboard is included.

## Start the preview again

From `C:\dev\G16-CMS`, run:

```powershell
python -m http.server 4321 --bind 127.0.0.1
```

Keep that terminal running, then open the URL above in your browser. If the
preview is already running on port 4321, just open the link. Internet access is
currently needed for the existing Tailwind CDN and Google Fonts imports.

## Suggested recording route

Use a desktop browser at 100% zoom, ideally about 1440px wide. Let the first page
finish loading its fonts and photographs before starting the recording.

1. **Home:** show the cinematic hero, advance the featured story carousel, then
   scroll to the week strip. Select a date and show the day's programme.
2. **Event details:** return to the first hero slide and choose “See event details.”
   The assembly opens with its own title, photograph, date, time, and place.
3. **Calendar:** choose “See this day on the calendar.” The selected day matches
   the event. Show another day, a category filter, and the Month/Agenda switch.
4. **Agenda:** use the Calendar's Agenda switch to show the monthly event programme.
   Event entries lead to their corresponding details.
5. **Campus stories:** open a story from Home or use the Archive's News filter.
   The ICG summit story retains the longer article
   layout, pull quote, and photo gallery.
6. **Archive:** search for “scholarship,” then open a result. Return to the archive
   to show year/month browsing and content-type filters.
7. **About:** show the publication's purpose, process, and contributor roles.
8. **Contact:** choose a topic, show the form, and optionally submit sample values
   to demonstrate validation and the confirmation state.
9. **Optional login design:** open Log in to show the Campus Desk illustration,
   then use “Back to the site” to return to Home.

For a short recording, skip downloads and form submission. They work as local
demonstrations, but the main tour is clearer without browser download panels.

## What is connected

- A consistent header/footer and active navigation on every public page.
- A keyboard-accessible mobile menu, Escape-to-close, and focus restoration.
- Search entry points, content/category filters, archive pagination, and dates.
- Matching story/event details with stable URLs that survive refresh.
- Date links that select the corresponding calendar day.
- Previous/next week, featured slides, calendar months, and agenda controls.
- Calendar files for individual events or the sample calendar, using Philippine
  Time (`Asia/Manila`). “Download calendar” exports a snapshot; it is not a live
  subscription.
- Contact and account-request topics, plus the existing simulated form states.

## Content and implementation boundaries

This is a local design presentation, using sample dates and campus copy. It is
not the deployed ICG application. Stories, historical archive entries, schedules,
contact details, bylines, captions, and publishing promises need editorial
confirmation before launch. The old database remains unavailable; the sample
archive does not imply recovered historical records.

Authentication and contact submission are simulated. No messages are sent or
accounts created. Social destinations have not been invented; unconfirmed social
buttons are omitted from the connected walkthrough. Existing campus photographs
are used for design review and still need launch clearance and any required
watermark replacements.

The local URL works on this computer. For the client, send your screen recording.

## Files and checks

- `design/prototypes/public-data.js`: shared sample stories/events and repeatable
  historical archive fixtures. Edit sample content here.
- `design/prototypes/public-site.js`: shared navigation, link wiring, matching
  details, and calendar downloads.
- `design/prototypes/public-site.css`: shared header, mobile menu, and narrow-screen
  filter behavior. It uses existing design tokens.
- News browsing uses the Archive's News filter; event browsing uses the Calendar.
  Separate News and Events listing pages were removed at the user's request.
- `index.html`: the public folder's entry point.

Run `python -I design/tools/check_public_demo.py` with the server running. It
checks all six public screens at desktop and phone sizes, intermediate widths,
navigation, search, detail matching, calendar date links, refresh/back behavior,
and a calendar download. Screenshots are in `design/tools/out/public-demo/`.

The static files still contain the original page-specific interactions and some
fallback navigation markup; the shared script installs the connected navigation
at runtime. Include both shared scripts and the shared CSS whenever copying the
prototype folder. These are design artifacts, not production application code.
