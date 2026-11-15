/*
 * The ICG desk prototype: sample records, the role-based shell (sidebar + mobile
 * drawer), status badges and toasts. Prototype only: nothing is saved.
 * Demo switches: ?role=writer | reviewer | admin
 */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* Prototype "today" so screenshots stay stable. */
  const TODAY = new Date(2026, 10, 15); // Sunday, November 15, 2026

  /* Icons: 24px grid, 2px stroke, round caps and joins, no fills (DESIGN.md: Iconography). */
  const P = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    articles: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5M9 13h6M9 17h6M9 9h2"/>',
    reviews: '<path d="M9 11l2.5 2.5L16 9"/><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/>',
    inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    // Status icons
    draft: '<circle cx="12" cy="12" r="8" stroke-dasharray="3 3.3"/>',
    in_review: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor"/>',
    approved: '<circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    published: '<circle cx="12" cy="12" r="8" fill="currentColor"/>',
    archived: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>',
  };
  const icon = (name, size = 20, extra = '') =>
    `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${P[name]}</svg>`;

  const STATUS = {
    draft: 'Draft', in_review: 'In review', approved: 'Approved', published: 'Published', archived: 'Archived',
  };
  const badge = status => `<span class="badge" data-status="${status}" data-component="StatusBadge">${icon(status, 14)}${STATUS[status]}</span>`;

  /* Dates: The Plain Date Rule. */
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const plainDate = (s, withYear) => { const d = parse(s); return `${MONTHS[d.getMonth()]} ${d.getDate()}${withYear || d.getFullYear() !== TODAY.getFullYear() ? ', ' + d.getFullYear() : ''}`; };
  const edited = (s, time) => {
    const d = parse(s), days = Math.round((TODAY - d) / 864e5);
    if (days === 0) return `today, ${time}`;
    if (days === 1) return `yesterday, ${time}`;
    return plainDate(s);
  };

  /*
   * Sample desk records for the writer Lea Mendoza (Computer Society).
   * Field names follow the new data model; published titles match public-data.js.
   */
  const ME = { writer: ['Lea Mendoza', 'Writer · Computer Society'], reviewer: ['Paolo Cruz', 'Reviewer · Section editor'], admin: ['Maria Santos', 'Admin · ICG'] };
  const ARTICLES = [
    { id: 'a1', title: 'What we learned running a bootcamp for 120 students', type: 'News', category: 'Student life', status: 'draft', updated_at: '2026-11-15', time: '9:40 AM', reviewer: null },
    { id: 'a2', title: 'Code camp for senior high students', type: 'Event', category: 'Academic', status: 'draft', updated_at: '2026-11-14', time: '6:15 PM', reviewer: 'Paolo Cruz', event_starts_at: '2026-12-05', event_time: '9:00 AM', event_end: '12:00 NN', changes: { by: 'Paolo Cruz', on: '2026-11-14', note: 'Add the venue and the sign-up deadline before this goes out.' } },
    { id: 'a3', title: 'Hackathon rules and team sign-up', type: 'Announcement', category: 'Academic', status: 'in_review', updated_at: '2026-11-14', time: '11:20 AM', reviewer: 'Paolo Cruz', sent: '2026-11-14' },
    { id: 'a4', title: 'Computer Society joins the city’s digital literacy week', type: 'News', category: 'Community', status: 'approved', updated_at: '2026-11-13', time: '4:05 PM', reviewer: 'Paolo Cruz', publish_at: 'November 16, 8:00 AM' },
    { id: 'a5', title: 'Computer Studies hackathon kickoff', type: 'Event', category: 'Academic', status: 'published', updated_at: '2026-11-10', time: '2:30 PM', reviewer: 'Paolo Cruz', event_starts_at: '2026-11-18', event_time: '1:00 PM', event_end: '5:00 PM', place: 'Computer Lab 3', slug: 'computer-studies-hackathon-kickoff' },
    { id: 'a6', title: 'Computer Society general assembly', type: 'Event', category: 'Student life', status: 'published', updated_at: '2026-11-06', time: '10:00 AM', reviewer: 'Bea Villanueva', event_starts_at: '2026-11-14', event_time: '3:30 PM', place: 'Computer Lab 3', slug: 'computer-society-general-assembly' },
    { id: 'a7', title: 'Web development workshop series opens for sign-ups', type: 'Announcement', category: 'Academic', status: 'published', updated_at: '2026-10-21', time: '1:10 PM', reviewer: 'Paolo Cruz' },
    { id: 'a8', title: 'Call for Computer Society volunteers', type: 'Announcement', category: 'Student life', status: 'published', updated_at: '2026-10-02', time: '8:45 AM', reviewer: 'Bea Villanueva' },
    { id: 'a9', title: 'Computer Society places second at the regional programming contest', type: 'News', category: 'Academic', status: 'published', updated_at: '2026-09-18', time: '5:20 PM', reviewer: 'Paolo Cruz' },
    { id: 'a10', title: 'Freshmen orientation for computer studies students', type: 'Event', category: 'Student life', status: 'published', updated_at: '2026-08-10', time: '9:00 AM', reviewer: 'Bea Villanueva', event_starts_at: '2026-08-17', event_time: '8:00 AM' },
    { id: 'a11', title: 'Computer Society officers for 2025 to 2026', type: 'Announcement', category: 'Student life', status: 'archived', updated_at: '2026-08-01', time: '3:00 PM', reviewer: 'Paolo Cruz' },
  ];

  /* Cover photos (articles.cover), real PLP photos from /gallery; null = no cover yet. */
  const COVERS = {
    a1: '499682957_1127395329404790_7535707343553598684_n.jpg', a2: null, a3: null,
    a4: '499231701_1127395856071404_2821192826251073541_n.jpg', a5: '497581098_1122183726592617_702004212603911751_n.jpg',
    a6: '497462541_1122183953259261_8696477054724547342_n.jpg', a7: '497925340_1123740813103575_2729152394313884247_n.jpg',
    a8: '494850561_1113454817465508_1040277523513428949_n.jpg', a9: '500224508_1127395446071445_3922075466479369094_n.jpg',
    a10: '494972831_1113454740798849_3302452030579944142_n.jpg', a11: null,
  };
  ARTICLES.forEach(a => { a.cover = COVERS[a.id] ? '../../gallery/' + COVERS[a.id] : null; });

  const params = new URLSearchParams(location.search);
  // A page can set window.DESK_ROLE before loading desk.js to pick its default person.
  const role = ME[params.get('role')] ? params.get('role') : (ME[window.DESK_ROLE] ? window.DESK_ROLE : 'writer');
  const withRole = href => role === 'writer' ? href : `${href}${href.includes('?') ? '&' : '?'}role=${role}`;

  /* Role-based nav: only what the role can use (DESIGN.md: Role-based nav). */
  const NAV = {
    writer: [['overview', 'Overview', 'home', 'dashboard.html'], ['articles', 'My articles', 'articles', 'dashboard-articles.html'], ['inbox', 'Inbox', 'inbox', '#', 2], ['account', 'Account', 'user', '#']],
    reviewer: [['overview', 'Overview', 'home', 'dashboard.html'], ['reviews', 'Reviews', 'reviews', 'dashboard-reviews.html', 4], ['inbox', 'Inbox', 'inbox', '#', 1], ['account', 'Account', 'user', '#']],
    admin: [['overview', 'Overview', 'home', 'dashboard.html'], ['articles', 'Articles', 'articles', 'dashboard-articles.html'], ['users', 'Users', 'users', '#'], ['messages', 'Messages', 'mail', '#', 4], ['audit', 'Audit log', 'list', '#'], ['settings', 'Site settings', 'settings', '#'], ['inbox', 'Inbox', 'inbox', '#'], ['account', 'Account', 'user', '#']],
  };

  function sidebar(current) {
    const items = NAV[role].map(([key, label, ic, href, count]) => {
      const cur = key === current ? ' aria-current="page"' : '';
      const c = count ? `<span class="nav-count" aria-hidden="true">${count}</span><span class="sr-only">, ${count} new</span>` : '';
      const h = href === '#' ? `#${key}` : withRole(href);
      return `<li><a class="nav-item" href="${h}"${cur}${href === '#' ? ' data-later' : ''}>${icon(ic)}<span>${label}</span>${c}</a></li>`;
    }).join('');
    const [name, sub] = ME[role];
    return `
      <a href="${withRole('dashboard.html')}" class="side-brand" aria-label="ICG desk, overview"><span class="display">ICG</span><span>Desk</span></a>
      <nav aria-label="Desk"><ul class="space-y-1">${items}</ul></nav>
      <div class="side-foot">
        <div class="side-person"><p>${esc(name)}</p><p>${esc(sub)}</p></div>
        <a class="nav-item" href="home.html">${icon('external')}<span>View the site</span></a>
        <a class="nav-item" href="login-identity.html">${icon('logout')}<span>Log out</span></a>
      </div>`;
  }

  /*
   * Mount the shell around the page's <main id="desk-main">.
   * opts: { current, title (for the mobile bar), action: { label, href, icon } }
   */
  function mount(opts) {
    const main = $('desk-main');
    const shell = document.createElement('div');
    shell.className = 'desk';
    shell.innerHTML = `
      <aside class="desk-sidebar bg-night on-night" aria-label="Desk navigation" data-component="DeskSidebar"><div class="side flex">${sidebar(opts.current)}</div></aside>
      <div class="desk-main" id="desk-column">
        <header class="desk-topbar bg-night on-night" data-component="DeskTopBar">
          <button type="button" class="icon-btn" id="menu-open" aria-label="Open menu" aria-expanded="false" aria-controls="drawer">${icon('menu', 22)}</button>
          <a href="${withRole('dashboard.html')}" class="display text-[30px] leading-none" aria-label="ICG desk, overview">ICG</a>
          <span class="text-[13px] text-on-dark-muted">${esc(opts.title)}</span>
          ${opts.action ? `<a href="${opts.action.href}" class="icon-btn ml-auto bg-marigold text-marigold-on hover:bg-marigold-bright" aria-label="${esc(opts.action.label)}">${icon(opts.action.icon || 'plus', 22)}</a>` : ''}
        </header>
      </div>
      <div class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Menu" data-component="DeskDrawer">
        <div class="drawer-scrim" data-close></div>
        <div class="drawer-panel bg-night on-night">
          <div class="side flex">${sidebar(opts.current)}</div>
          <button type="button" class="icon-btn drawer-close" aria-label="Close menu" data-close>${icon('close', 22)}</button>
        </div>
      </div>`;
    main.parentNode.insertBefore(shell, main);
    $('desk-column').appendChild(main);

    // Drawer: focus moves in, stays in, returns to the menu button (DESIGN.md).
    const drawer = $('drawer'), opener = $('menu-open');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const focusables = () => [...drawer.querySelectorAll('a[href], button')];
    const open = () => {
      drawer.classList.add('open'); opener.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => drawer.classList.add('shown')));
      (drawer.querySelector('[aria-current]') || focusables()[0]).focus();
    };
    const close = () => {
      drawer.classList.remove('shown'); opener.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      setTimeout(() => drawer.classList.remove('open'), reduce.matches ? 0 : 250);
      opener.focus();
    };
    opener.addEventListener('click', open);
    drawer.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
    drawer.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    matchMedia('(min-width: 1024px)').addEventListener('change', e => { if (e.matches && drawer.classList.contains('open')) close(); });

    // Pages that later rounds will design.
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-later]');
      if (a) { e.preventDefault(); toast(`${a.dataset.later || a.textContent.replace(/,.*$/, '').trim()} is designed in a later round.`); }
    });
  }

  /* Toast with a polite status region (DESIGN.md: Toasts). */
  let toastTimer;
  function toast(text, undo) {
    let t = $('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast'; t.className = 'toast hidden'; t.setAttribute('data-component', 'Toast');
      t.innerHTML = `<p role="status" aria-live="polite" id="toast-text" class="flex-1"></p><button type="button" id="toast-undo" class="hidden btn btn-day !h-11">Undo</button><button type="button" class="icon-btn on-day" id="toast-close" aria-label="Dismiss">${icon('close', 20)}</button>`;
      document.body.appendChild(t);
      $('toast-close').addEventListener('click', () => t.classList.add('hidden'));
    }
    $('toast-text').textContent = text;
    $('toast-undo').classList.toggle('hidden', !undo);
    $('toast-undo').onclick = () => { t.classList.add('hidden'); undo && undo(); };
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 5000);
  }

  /*
   * Dated things on the writer's desk, for calendar-style views: events, go-live
   * times, publish days, review hand-offs. kind: event | golive | published | sent | changes
   */
  function dated() {
    const out = [];
    ARTICLES.forEach(a => {
      if (a.event_starts_at) out.push({ date: a.event_starts_at, time: a.event_time, kind: 'event', label: a.title, a });
      if (a.status === 'approved') out.push({ date: '2026-11-16', time: '8:00 AM', kind: 'golive', label: a.title, a });
      if (a.status === 'in_review') out.push({ date: a.sent, time: a.time, kind: 'sent', label: a.title, a });
      if (a.changes) out.push({ date: a.changes.on, time: a.time, kind: 'changes', label: a.title, a });
      if (a.status === 'published' && a.updated_at >= '2026-11-01') out.push({ date: a.updated_at, time: a.time, kind: 'published', label: a.title, a });
    });
    return out;
  }
  const KIND = { event: 'Event', golive: 'Goes live', published: 'Published', sent: 'Sent for review', changes: 'Changes requested' };

  window.Desk = { dated, KIND, $, esc, icon, badge, STATUS, TODAY, MONTHS, DAYS, parse, plainDate, edited, ME, ARTICLES, role, withRole, mount, toast };
})();
