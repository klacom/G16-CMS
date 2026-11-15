/*
 * Shared pieces for the article editor concepts: the sample draft (Lea's code camp,
 * sent back by Paolo with changes requested), the editor bar, the formatting
 * toolbar and the autosave line. Prototype only: nothing is saved.
 * The rich-text format is still undecided; the toolbar is a stand-in.
 */
(function () {
  const { $, esc, icon, badge } = window.Desk;

  const DRAFT = {
    id: 'a2', status: 'draft', type: 'Event', category: 'Academic',
    title: 'Code camp for senior high students',
    excerpt: 'Forty senior high students from Pasig will build their first website with the Computer Society on Saturday, December 5.',
    tags: ['code camp', 'senior high', 'Computer Society'],
    event: { date: '2026-12-05', start: '09:00', end: '12:00', venue: '' },
    reviewer: 'Paolo Cruz',
    cover: null,
    body: `<p>The Computer Society is opening its first code camp for senior high school students from Pasig on Saturday, December 5. Forty students will spend the morning building a simple website with help from computer studies majors.</p>
<h2>What students will do</h2>
<p>The camp runs in three short sessions: an introduction to HTML and CSS, a guided build of a one-page portfolio, and a show-and-tell where each team presents what they made. Laptops are provided; students only need to bring their school ID.</p>
<h2>Who can join</h2>
<p>The camp is open to Grade 11 and 12 students from public senior high schools in Pasig. Each school can send up to five students. Teachers are welcome to sit in.</p>`,
  };

  const THREAD = [
    { who: 'Paolo Cruz', role: 'Reviewer', when: 'November 14, 6:02 PM', text: 'Add the venue and the sign-up deadline before this goes out. Also, the five-students-per-school limit is in the story but not in the event details; readers skim those first.', asks: ['venue', 'deadline'] },
  ];

  const CATEGORIES = ['Academic', 'Campus', 'Careers', 'Community', 'Culture', 'Sports', 'Student life'];
  const TYPES = ['News', 'Event', 'Announcement'];

  /* Editor bar: back, title, status, autosave line, actions. */
  function bar({ sendLabel = 'Send for review', sendId = 'send', status = 'draft' } = {}) {
    return `<div class="editbar" data-component="EditorBar">
      <a href="dashboard-articles.html" class="back">${icon('chevron', 18, 'style="transform:rotate(180deg)"')}My articles</a>
      <h1 class="t-h2 sr-only sm:not-sr-only">Edit draft</h1>
      <span id="bar-badge">${badge(status)}</span>
      <span class="saved" id="saved" role="status" aria-live="polite">Saved at 10:04 AM</span>
      <div class="acts"><a href="article.html" class="btn btn-day" data-later="The preview">Preview</a><button type="button" class="btn btn-primary !h-11" id="${sendId}">${sendLabel}</button></div>
    </div>`;
  }
  function mobileActs(sendId = 'send-m') {
    return `<div class="mobile-acts"><a href="article.html" class="btn btn-day" data-later="The preview">Preview</a><button type="button" class="btn btn-primary !h-11" id="${sendId}">Send for review</button></div>`;
  }

  /* Autosave: any edit shows "Saving…" then "Saved at …". */
  let saveT;
  function touched() {
    const s = $('saved'); if (!s) return;
    s.textContent = 'Saving…';
    clearTimeout(saveT);
    saveT = setTimeout(() => { s.textContent = 'Saved at 10:06 AM'; }, 700);
  }

  /* Formatting toolbar for a contenteditable body (stand-in for the real editor). */
  const TOOLS = [
    ['bold', '<b>B</b>', 'Bold'], ['italic', '<i style="font-family:Georgia,serif">I</i>', 'Italic'], ['sep'],
    ['h2', 'H2', 'Subheading'], ['ul', icon('list', 18), 'Bulleted list'], ['link', icon('external', 18), 'Link'],
  ];
  function toolbar(target) {
    return `<div class="rte-tools" role="toolbar" aria-label="Formatting" aria-controls="${target}">${TOOLS.map(([k, html, label]) => k === 'sep' ? '<span class="sep" aria-hidden="true"></span>' : `<button type="button" data-cmd="${k}" aria-label="${label}" title="${label}">${html}</button>`).join('')}</div>`;
  }
  document.addEventListener('mousedown', e => { if (e.target.closest('[data-cmd]')) e.preventDefault(); });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-cmd]'); if (!b) return;
    const c = b.dataset.cmd;
    if (c === 'h2') document.execCommand('formatBlock', false, 'h2');
    else if (c === 'ul') document.execCommand('insertUnorderedList');
    else if (c === 'link') { const u = prompt('Link address'); if (u) document.execCommand('createLink', false, u); }
    else document.execCommand(c);
    touched();
  });

  /* Tags: Enter or comma adds, × removes. */
  function tagbox(id, tags) {
    return `<div class="tagbox" id="${id}" data-component="TagInput">${tags.map(t => `<span class="tag">${esc(t)}<button type="button" aria-label="Remove tag ${esc(t)}">${icon('close', 14)}</button></span>`).join('')}<input aria-label="Add a tag" placeholder="Add a tag, like hackathon"></div>`;
  }
  document.addEventListener('keydown', e => {
    const input = e.target.closest('.tagbox input'); if (!input) return;
    if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
      e.preventDefault();
      const t = document.createElement('span'); t.className = 'tag';
      t.innerHTML = `${esc(input.value.trim())}<button type="button" aria-label="Remove tag ${esc(input.value.trim())}">${icon('close', 14)}</button>`;
      input.before(t); input.value = ''; touched();
    }
  });
  document.addEventListener('click', e => { const x = e.target.closest('.tag button'); if (x) { const box = x.closest('.tagbox'); x.closest('.tag').remove(); box.querySelector('input').focus(); touched(); } });
  document.addEventListener('input', e => { if (e.target.closest('input, textarea, select, [contenteditable]')) touched(); });

  window.Editor = { DRAFT, THREAD, CATEGORIES, TYPES, bar, mobileActs, toolbar, tagbox, touched };
})();
