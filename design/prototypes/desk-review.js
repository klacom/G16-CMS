/*
 * Shared pieces for the reviewer concepts: Paolo Cruz's review queue, the article
 * as the reviewer reads it (optionally with the writer's changes marked), and the
 * decision controls (approve, ask for changes, step down). Prototype only.
 */
(function () {
  const { $, esc, icon, badge, plainDate, toast, DAYS, parse } = window.Desk;

  /* Code camp, as Lea resent it: venue and deadline added (marked with <ins>). */
  const CAMP_BODY = `<p>The Computer Society is opening its first code camp for senior high school students from Pasig on Saturday, December 5. Forty students will spend the morning building a simple website with help from computer studies majors.</p>
<h2>What students will do</h2>
<p>The camp runs in three short sessions: an introduction to HTML and CSS, a guided build of a one-page portfolio, and a show-and-tell where each team presents what they made. Laptops are provided; students only need to bring their school ID.</p>
<h2>Who can join</h2>
<p>The camp is open to Grade 11 and 12 students from public senior high schools in Pasig. Each school can send up to five students. Teachers are welcome to sit in.<ins> Sign-ups close on November 28; schools register through the Computer Society's page.</ins></p>`;

  const REVIEWS = [
    { id: 'r1', state: 'accepted', round: 2, title: 'Code camp for senior high students', type: 'Event', category: 'Academic', writer: 'Lea Mendoza',
      sent: '2026-11-15', sentTime: '9:58 AM', neededBy: '2026-11-26', why: 'Sign-ups close November 28',
      excerpt: 'Forty senior high students from Pasig will build their first website with the Computer Society on Saturday, December 5.',
      event: { date: '2026-12-05', time: '9:00 AM to 12:00 NN', venue: 'Computer Lab 3, Main building', venueAdded: true },
      body: CAMP_BODY, note: 'Added the venue and the deadline. Thanks!',
      requests: [
        { text: 'Add the venue', fix: 'Venue: Computer Lab 3, Main building', target: 'venue' },
        { text: 'Add the sign-up deadline', fix: '“Sign-ups close on November 28; schools register through the Computer Society’s page.”', target: 'ins' },
      ] },
    { id: 'r2', state: 'accepted', round: 1, title: 'Hackathon rules and team sign-up', type: 'Announcement', category: 'Academic', writer: 'Lea Mendoza',
      sent: '2026-11-14', sentTime: '11:20 AM', neededBy: '2026-11-17', why: 'The kickoff is on November 18',
      excerpt: 'Teams of three can sign up until Monday. Here are the rules for the Computer Studies hackathon.',
      body: `<p>The Computer Studies hackathon kicks off on Wednesday, November 18, in Computer Lab 3. Teams of three have 48 hours to build an app that helps a Pasig barangay.</p><h2>Rules</h2><p>Every team needs at least one first-year student. Code must be written during the event. Judges score usefulness, design and the final demo.</p>`,
      requests: [] },
    { id: 'r3', state: 'invited', round: 1, title: 'Glee club opens auditions for the Christmas concert choir', type: 'News', category: 'Student life', writer: 'Carla Dizon',
      sent: '2026-11-14', sentTime: '4:40 PM', neededBy: '2026-11-19', why: 'Auditions start November 20',
      excerpt: 'Auditions run November 20 to 22 in the music room. No experience needed.', body: '', requests: [] },
    { id: 'r4', state: 'invited', round: 1, title: 'Nursing students to hold a free health check day in Barangay Rosario', type: 'Event', category: 'Community', writer: 'Jo Ramos',
      sent: '2026-11-15', sentTime: '8:15 AM', neededBy: null, why: '',
      excerpt: 'Blood pressure and blood sugar checks for residents, run by fourth-year nursing students.', body: '', requests: [] },
  ];
  const DECIDED = [
    { title: 'Computer Society joins the city’s digital literacy week', writer: 'Lea Mendoza', what: 'You approved', on: '2026-11-13', status: 'approved' },
    { title: 'Code camp for senior high students', writer: 'Lea Mendoza', what: 'You asked for changes', on: '2026-11-14', status: 'draft' },
    { title: 'Computer Studies hackathon kickoff', writer: 'Lea Mendoza', what: 'You approved', on: '2026-11-09', status: 'published' },
  ];

  const KIND = r => r.state === 'invited' ? 'New request' : r.round > 1 ? `Sent back to you, round ${r.round}` : 'In your queue';
  const neededLine = r => r.neededBy ? `Needed by ${DAYS[parse(r.neededBy).getDay()]}, ${plainDate(r.neededBy)}` : 'No date';

  /* The article as the reviewer reads it. diff: mark the writer's additions. */
  function articleHTML(r, { diff = false } = {}) {
    const body = diff ? r.body : r.body.replace(/<\/?ins>/g, '');
    const ev = r.event ? `<section class="rv-event" aria-label="When it happens">
        <p class="t-h2">When it happens</p>
        <p class="mt-2 text-[16px]">${DAYS[parse(r.event.date).getDay()]}, ${plainDate(r.event.date)}<span class="dot-sep"></span>${r.event.time}</p>
        <p class="mt-1 text-[16px]">${diff && r.event.venueAdded ? `<ins id="venue-ins">${esc(r.event.venue)}</ins>` : esc(r.event.venue)}</p></section>` : '';
    return `<article class="rv-doc" data-component="ReviewArticle">
      <p class="meta"><span class="type">${r.type}</span><span class="dot-sep"></span>${esc(r.category)}</p>
      <h2 class="rv-title">${esc(r.title)}</h2>
      <p class="rv-excerpt">${esc(r.excerpt)}</p>
      ${ev}
      <div class="rv-cover">${icon('articles', 22)}<span>No cover photo yet</span></div>
      <div class="rv-body">${body || '<p class="text-ink-muted">Accept the request to read the story.</p>'}</div>
    </article>`;
  }

  /* Decision: approve, or ask for changes as separate requests. */
  function decisionHTML(r) {
    return `<div class="decide" data-component="ReviewDecision">
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn btn-primary" data-approve>Approve</button>
        <button type="button" class="btn btn-day !h-12" data-ask>Ask for changes</button>
      </div>
      <form class="ask-form hidden mt-5" data-askform>
        <p class="field-label" id="asks-l">What should ${esc(r.writer.split(' ')[0])} change?</p>
        <ol class="asks space-y-2" aria-labelledby="asks-l"></ol>
        <div class="flex gap-2 mt-2"><label class="sr-only" for="ask-in-${r.id}">New request</label><input class="field" id="ask-in-${r.id}" placeholder="Add a photo credit"><button type="submit" class="btn btn-day !h-12 shrink-0">Add</button></div>
        <label class="field-label mt-4" for="ask-note-${r.id}">Note <span class="opt">(optional)</span></label>
        <textarea class="field" id="ask-note-${r.id}" placeholder="Almost there. Just these two things."></textarea>
        <button type="button" class="btn btn-day mt-4" data-sendback>Send back to ${esc(r.writer.split(' ')[0])}</button>
      </form>
      <button type="button" class="link text-[14px] mt-5" data-stepdown>Step down from this review</button>
    </div>`;
  }
  const ASK_CSS = `
    .rv-doc { background: var(--color-card); border-radius: var(--radius-sm); padding: 24px 16px 40px; }
    @media (min-width: 768px) { .rv-doc { padding: 40px 48px 56px; } }
    .rv-title { margin-top: 10px; font-size: 24px; line-height: 1.2; font-weight: 700; }
    @media (min-width: 768px) { .rv-title { font-size: 32px; line-height: 1.15; } }
    .rv-excerpt { margin-top: 12px; font-size: 18px; line-height: 1.5; color: var(--color-ink-muted); }
    .rv-event { margin-top: 24px; padding: 16px 20px; background: var(--color-paper); border-radius: var(--radius-sm); }
    .rv-cover { margin-top: 24px; aspect-ratio: 21 / 9; display: grid; place-content: center; justify-items: center; gap: 6px; border-radius: var(--radius-sm); background: var(--color-paper); color: var(--color-ink-muted); font-size: 13px; }
    .rv-body { margin-top: 28px; font-size: 18px; line-height: 1.5; max-width: 680px; }
    .rv-body p + p, .rv-body h2 + p, .rv-body p + h2 { margin-top: 1.25em; }
    .rv-body h2 { font-size: 22px; line-height: 1.2; font-weight: 700; margin-top: 1.6em; }
    ins { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 4px; background: rgba(245, 179, 53, .45); border-radius: 4px; padding: 0 2px; }
    .asks li { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 4px 0 14px; background: var(--color-paper); border-radius: var(--radius-sm); font-size: 15px; }
    .asks li button { margin-left: auto; }
  `;

  /* Wire a decision block for review r inside root. onDone(state) after approve/send back/step down.
     confirm(r), when given, returns a promise that must resolve true before stepping down. */
  function wireDecision(root, r, onDone, confirm) {
    const form = root.querySelector('[data-askform]'), list = root.querySelector('.asks');
    const renderAsks = () => { list.innerHTML = (r.asks || []).map((a, i) => `<li>${esc(a)}<button type="button" class="icon-btn on-day" aria-label="Remove request: ${esc(a)}" data-rm="${i}">${icon('close', 18)}</button></li>`).join(''); };
    root.addEventListener('click', e => {
      if (e.target.closest('[data-approve]')) { onDone('approved'); toast(`Approved. ${r.writer.split(' ')[0]} is told, and it goes live as scheduled.`); }
      if (e.target.closest('[data-ask]')) { form.classList.remove('hidden'); form.querySelector('input').focus(); }
      const rm = e.target.closest('[data-rm]'); if (rm) { r.asks.splice(+rm.dataset.rm, 1); renderAsks(); }
      if (e.target.closest('[data-sendback]')) {
        if (!(r.asks || []).length) { toast('Add at least one request first.'); form.querySelector('input').focus(); return; }
        onDone('changes'); toast(`Sent back to ${r.writer.split(' ')[0]} with ${r.asks.length} ${r.asks.length === 1 ? 'request' : 'requests'}.`);
      }
      if (e.target.closest('[data-stepdown]')) {
        Promise.resolve(confirm ? confirm(r) : true).then(ok => {
          if (ok) { onDone('stepped'); toast(`You stepped down. ${r.writer.split(' ')[0]} will choose another reviewer.`); }
        });
      }
    });
    form.addEventListener('submit', e => {
      e.preventDefault(); const inp = form.querySelector('input'); const v = inp.value.trim(); if (!v) return;
      (r.asks = r.asks || []).push(v); inp.value = ''; renderAsks(); inp.focus();
    });
  }

  window.Review = { REVIEWS, DECIDED, KIND, neededLine, articleHTML, decisionHTML, wireDecision, ASK_CSS };
})();
