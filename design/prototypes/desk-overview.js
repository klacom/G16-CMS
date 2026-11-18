/* Month desk. Review records are shared with Reviews; dates are deadlines, not event dates. */
(function () {
  const { $, esc, icon, badge, ARTICLES, DAYS, MONTHS, parse, plainDate, mount, dated, KIND, role, withRole, ME } = window.Desk;
  const reviewer = role === 'reviewer', admin = role === 'admin', params = new URLSearchParams(location.search);
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const demoDate = params.get('today');
  const today = (reviewer || admin) && /^\d{4}-\d{2}-\d{2}$/.test(demoDate) && iso(parse(demoDate)) === demoDate ? parse(demoDate) : window.Desk.TODAY;
  const todayKey = iso(today), reviewHref = r => withRole(`dashboard-reviews.html?id=${r.id}`);
  const reviews = reviewer && params.get('empty') !== '1' ? window.Review.REVIEWS : [];
  const accepted = reviews.filter(r => r.state === 'accepted'), requests = reviews.filter(r => r.state === 'invited');
  const due = r => !r.neededBy ? 'No review deadline' : r.neededBy < todayKey ? `Overdue · ${plainDate(r.neededBy)}` : r.neededBy === todayKey ? 'Due today' : `Needed by ${plainDate(r.neededBy)}`;
  const reviewKind = r => r.state === 'invited' ? 'New request' : r.round > 1 ? 'Another read' : 'First read';
  const demo = window.ICGDemo;
  const operations = admin ? window.AdminDemo.overview(todayKey, params.get('empty') === '1') : null;
  const mine = reviewer ? reviews.filter(r => r.neededBy).map(r => ({
    date: r.neededBy, kind: r.state === 'invited' ? 'request' : 'review',
    label: r.title, heading: r.state === 'invited' ? 'New request' : 'Review due',
    chip: r.state === 'invited' ? 'New request' : r.round > 1 ? 'Another read' : 'Review due',
    detail: `${reviewKind(r)} · ${r.writer} · Round ${r.round}`, href: reviewHref(r),
  })) : admin ? operations.scheduled.map(x => ({ ...x, heading: `Goes live, ${x.time}`, chip: `${x.time} Goes live`, detail: `Scheduled publication · ${x.a.category}`, href: withRole(`dashboard-editor.html?id=${x.a.id}`), status: x.a.status }))
    .concat(operations.published.map(r => ({ date: iso(r.date), kind: 'published', label: r.title, heading: 'Published', chip: 'Published', detail: `${r.type} · ${r.cat}`, href: demo.href(r), status: 'published' })))
    : dated().map(x => ({ ...x, heading: `${KIND[x.kind]}, ${x.time}`, chip: `${x.time} ${KIND[x.kind]}`, href: `dashboard-editor.html?id=${x.a.id}`, status: x.a.status }));
  // A review deadline does not replace the corresponding public event date.
  const campusOn = key => (demo?.events || []).filter(e => demo.dateString(e.date) === key && (reviewer || admin || !mine.some(m => m.label === e.title)));
  const nextPublication = admin && [...operations.scheduled].filter(x => x.date >= todayKey && x.date.slice(0, 7) === todayKey.slice(0, 7)).sort((a, b) => a.date.localeCompare(b.date))[0];
  let view = new Date(today.getFullYear(), today.getMonth(), 1), selected = nextPublication ? nextPublication.date : todayKey;
  const action = reviewer ? { label: 'Open reviews', href: withRole('dashboard-reviews.html'), icon: 'reviews' }
    : admin ? operations.messages.length ? { label: 'Answer messages', href: withRole(`dashboard-messages.html?id=${operations.messages[0].id}`), icon: 'mail' }
      : { label: 'View articles', href: withRole('dashboard-articles.html'), icon: 'articles' }
    : { label: 'New article', href: 'dashboard-editor.html?id=new', icon: 'plus' };
  mount({ current: 'overview', title: 'Overview', action });
  const queueCount = reviewer ? reviews.length : admin ? operations.messages.filter(m => m.unread).length : null;
  if (queueCount !== null) document.querySelectorAll(`.nav-item[href*="${reviewer ? 'dashboard-reviews' : 'dashboard-messages'}"]`).forEach(link => {
    const count = link.querySelector('.nav-count'), spoken = link.querySelector('.sr-only');
    if (queueCount) { count.textContent = queueCount; spoken.textContent = `, ${queueCount} new`; }
    else { count?.remove(); spoken?.remove(); }
  });
  $('new-btn').href = action.href;
  $('new-btn').innerHTML = icon(action.icon, 18) + action.label;
  $('greeting').textContent = `Good morning, ${ME[role][0].split(' ')[0]}`;
  const overdue = accepted.filter(r => r.neededBy && r.neededBy < todayKey).length;
  const dueToday = accepted.filter(r => r.neededBy === todayKey).length;
  const summary = reviewer ? [`${accepted.length} ${accepted.length === 1 ? 'review' : 'reviews'}`, `${requests.length} new ${requests.length === 1 ? 'request' : 'requests'}`, ...(overdue ? [`${overdue} overdue`] : []), ...(dueToday ? [`${dueToday} due today`] : [])]
    : admin ? [`${operations.scheduled.length} scheduled`, `${operations.messages.length} open messages`, `${operations.invites.filter(p => p.state === 'invited').length} invite${operations.invites.filter(p => p.state === 'invited').length === 1 ? '' : 's'} waiting`]
    : ['2 drafts', '1 in review', '1 going live tomorrow'];
  const dateLine = `${DAYS[today.getDay()]}, ${MONTHS[today.getMonth()]} ${today.getDate()}`;
  $('summary').innerHTML = [dateLine, ...summary].map(part => `<span class="inline-block">${esc(part)}</span>`).join('<span class="dot-sep"></span>');

  function render() {
    $('month-heading').textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
    const start = new Date(view); start.setDate(1 - ((view.getDay() + 6) % 7));
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      if (i === 35 && d.getMonth() !== view.getMonth()) break;
      const key = iso(d), own = mine.filter(x => x.date === key), campus = campusOn(key);
      const label = `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}${key === todayKey ? ', today' : ''}${own.length ? `, ${own.length} ${reviewer ? 'review deadlines or requests' : admin ? 'publication dates' : 'of yours'}` : ''}${campus.length ? `, ${campus.length} on campus` : ''}`;
      cells.push(`<button type="button" class="cell ${d.getMonth() !== view.getMonth() ? 'out' : ''} ${key === todayKey ? 'today' : ''}" data-key="${key}" aria-pressed="${key === selected}" aria-label="${esc(label)}">
        <span class="display n" aria-hidden="true">${d.getDate()}</span>
        <span class="dots" aria-hidden="true">${own.slice(0, 2).map(() => '<i></i>').join('')}${campus.length ? '<i class="c"></i>' : ''}</span>
        <span class="chips" aria-hidden="true">${own.slice(0, 2).map(x => `<span class="chip-ev" data-kind="${x.kind}"${x.status ? ` data-status="${x.status}"` : ''}><b>${esc(x.chip)}</b><span>${esc(x.label)}</span></span>`).join('')}${own.length > 2 ? `<span class="text-[12px] font-semibold">${own.length - 2} more</span>` : ''}</span>
        ${campus.length ? `<span class="campus" aria-hidden="true">${campus.length} on campus</span>` : ''}</button>`);
    }
    $('cells').innerHTML = cells.join('');
    renderDay();
  }

  function renderDay() {
    const d = parse(selected), own = mine.filter(x => x.date === selected), campus = campusOn(selected);
    $('day-heading').textContent = `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}${selected === todayKey ? ' (today)' : ''}`;
    const items = own.map(x => `<a href="${esc(x.href)}" class="day-item review-entry"><div class="entry-text">
      <p class="meta">${esc(x.heading)}</p><p class="t-row mt-1">${esc(x.label)}</p>
      ${x.status ? `<div class="mt-2">${badge(x.status)}</div>` : ''}${x.detail ? `<p class="review-meta mt-2">${esc(x.detail)}</p>` : ''}</div>${reviewer || admin ? icon('chevron', 20) : ''}</a>`);
    if (!own.length && (reviewer || admin)) {
      const next = mine.filter(x => x.date > selected).sort((a, b) => a.date.localeCompare(b.date))[0];
      items.push(`<p class="day-item text-[15px] text-ink-muted">${admin ? 'No publication dates on this day.' : 'No review deadlines or requests on this day.'}${next ? ` Next: ${plainDate(next.date)}.` : ''}</p>${next ? `<button type="button" class="btn btn-day mb-3" data-go="${next.date}">Show ${DAYS[parse(next.date).getDay()]}</button>` : ''}`);
    }
    items.push(...campus.map(e => `<a href="article.html?id=${encodeURIComponent(e.id)}" class="day-item"><p class="meta">On campus, ${esc(e.start)}</p><p class="t-row mt-1 !font-medium">${esc(e.title)}</p></a>`));
    if (!items.length) {
      const next = mine.filter(x => x.date > selected).sort((a, b) => a.date.localeCompare(b.date))[0];
      items.push(`<p class="day-item text-[15px] text-ink-muted">Nothing on your calendar this day.${next ? ` Next: ${KIND[next.kind].toLowerCase()} on ${DAYS[parse(next.date).getDay()]}, ${plainDate(next.date)}.` : ''}</p>${next ? `<button type="button" class="btn btn-day" data-go="${next.date}">Show ${DAYS[parse(next.date).getDay()]}</button>` : ''}`);
    }
    $('day-list').innerHTML = items.join('');
  }

  $('cells').addEventListener('click', e => {
    const c = e.target.closest('[data-key]'); if (!c) return;
    selected = c.dataset.key; const d = parse(selected);
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) {
      view = new Date(d.getFullYear(), d.getMonth(), 1); render(); $('cells').querySelector(`[data-key="${selected}"]`).focus(); return;
    }
    $('cells').querySelectorAll('[aria-pressed]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.key === selected)));
    renderDay();
  });
  $('day-list').addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    selected = b.dataset.go; const d = parse(selected); view = new Date(d.getFullYear(), d.getMonth(), 1); render(); $('day-heading').focus();
  });
  $('prev').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); });
  $('next').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });

  if (reviewer) {
    $('legend').innerHTML = '<span class="legend-desktop">Filled: review deadline</span><span class="legend-desktop">Dashed: new request, needed by this day</span><span class="legend-desktop">On campus: public events</span><span class="legend-mobile">Ink dot: deadline or request</span><span class="legend-mobile">Muted dot: on campus</span><span>Marigold circle: today</span>';
    $('needs-heading').innerHTML = `Needs you <span class="review-count">${reviews.length}</span>`;
    const ordered = [...accepted].sort((a, b) => (a.neededBy || '9999').localeCompare(b.neededBy || '9999')).concat(requests);
    $('needs').innerHTML = ordered.map(r => `<a class="day-item review-entry" href="${esc(reviewHref(r))}"><div class="entry-text">
      <p class="review-meta"><span class="review-kind">${esc(reviewKind(r))}</span> · ${esc(r.writer)}</p>
      <p class="t-row mt-1">${esc(r.title)}</p><p class="review-meta mt-2">${esc(due(r))}${r.round > 1 ? ` · Round ${r.round}, ${r.requests.length} fixes to check` : ''}</p>
      <p class="review-kind text-[13px] mt-2">${r.state === 'invited' ? 'View request' : 'Continue review'}</p></div>${icon('chevron', 20)}</a>`).join('')
      || '<div class="day-item"><p class="t-row">You’re all caught up</p><p class="review-meta mt-2">New review requests will appear here.</p></div>';
    $('work-heading').textContent = 'Your reviews';
    document.querySelector('[data-component="PipelineCounts"]').dataset.component = 'ReviewCounts';
    const groups = [['First reads', accepted.filter(r => r.round === 1)], ['Another read', accepted.filter(r => r.round > 1)], ['New requests', requests]];
    $('work').innerHTML = groups.map(([label, items]) => `<a class="day-item review-entry" href="${esc(items.length ? reviewHref(items[0]) : withRole('dashboard-reviews.html'))}"><span class="entry-text t-row">${label}</span><span class="review-count">${items.length}</span>${icon('chevron', 20)}</a>`).join('');
  } else if (admin) {
    $('legend').innerHTML = '<span class="legend-desktop">Goes live: scheduled publication</span><span class="legend-desktop">Published: publication date</span><span class="legend-desktop">On campus: event date</span><span class="legend-mobile">Ink dot: publication</span><span class="legend-mobile">Muted dot: campus event</span><span>Marigold circle: today</span>';
    document.querySelector('[data-component="NeedsYou"]').dataset.component = 'OpenMessages';
    document.querySelector('[data-component="PipelineCounts"]').dataset.component = 'PendingInvites';
    $('needs-heading').innerHTML = `Open messages <span class="review-count">${operations.messages.length}</span>`;
    const { dueDate, failed } = window.AdminDemo;
    const late = operations.messages.filter(m => !failed(m) && dueDate(m.on) < today).length;
    const bounced = operations.messages.filter(failed).length;
    $('needs').innerHTML = operations.messages.length ? `<p class="review-meta mt-2">${late} reply overdue · ${bounced} not delivered</p>` + operations.messages.slice(0, 3).map(m => {
      const deadline = iso(dueDate(m.on));
      const state = failed(m) ? 'Reply not delivered' : deadline < todayKey ? 'Reply overdue' : deadline === todayKey ? 'Reply by today' : `Reply by ${plainDate(deadline)}`;
      return `<a class="day-item review-entry" data-message="${m.id}" href="${esc(withRole(`dashboard-messages.html?id=${m.id}`))}"><div class="entry-text"><p class="review-meta"><span class="review-kind">${esc(state)}</span></p><p class="t-row mt-1">${esc(m.subject)}</p><p class="review-meta mt-2">${esc(m.first + ' ' + m.last)}</p></div>${icon('chevron', 20)}</a>`;
    }).join('') + `<a class="day-item review-entry" href="${esc(withRole('dashboard-messages.html'))}"><span class="entry-text t-row">View all ${operations.messages.length} messages</span>${icon('chevron', 20)}</a>`
      : '<div class="day-item"><p class="t-row">No open messages</p><p class="review-meta mt-2">New messages will appear here.</p></div>';
    $('work-heading').innerHTML = `Invites <span class="review-count">${operations.invites.length}</span>`;
    const waiting = operations.invites.filter(p => p.state === 'invited').length;
    $('work').innerHTML = operations.invites.length ? `<p class="review-meta mt-2">${waiting} waiting · ${operations.invites.length - waiting} expired</p>` + operations.invites.map(p => `<a class="day-item review-entry" data-invite="${p.id}" href="${esc(withRole('dashboard-users.html?status=invited&q=' + encodeURIComponent(p.email)))}"><div class="entry-text"><p class="review-meta"><span class="review-kind">${p.state === 'expired' ? 'Invite expired' : 'Invite waiting'}</span> · ${esc(p.role)}</p><p class="t-row mt-1 invite-name">${esc(p.name || p.email)}</p><p class="review-meta mt-2">${p.state === 'expired' ? 'Expired' : 'Expires'} ${esc(p.expires)}</p></div>${icon('chevron', 20)}</a>`).join('')
      + `<a class="day-item review-entry" href="${esc(withRole('dashboard-users.html?status=invited'))}"><span class="entry-text t-row">View all invites</span>${icon('chevron', 20)}</a>`
      : '<div class="day-item"><p class="t-row">No invites waiting</p><p class="review-meta mt-2">New invitations and expired links will appear here.</p></div>';
  } else {
    const ask = ARTICLES.find(a => a.changes);
    $('needs').innerHTML = `<div class="day-item"><p class="meta"><span class="flag">Changes requested</span> by ${esc(ask.changes.by)}, ${plainDate(ask.changes.on)}</p><p class="t-row mt-1">${esc(ask.title)}</p><p class="mt-1 text-[14px] text-ink-muted">“${esc(ask.changes.note)}”</p><a href="dashboard-editor.html?id=${ask.id}" class="btn btn-day mt-3">Edit draft</a></div>`;
    $('work').innerHTML = ['draft', 'in_review', 'approved', 'published'].map(s => {
      const n = ARTICLES.filter(a => a.status === s).length;
      return `<a href="dashboard-articles.html?status=${s}" class="day-item flex items-center gap-3"><span class="w-[112px] shrink-0">${badge(s)}</span><span class="t-row flex-1">${n} ${n === 1 ? 'article' : 'articles'}</span><span class="text-ink-muted">${icon('chevron', 20)}</span></a>`;
    }).join('');
  }
  const state = params.get('state');
  if ((reviewer || admin) && (state === 'loading' || state === 'error')) {
    document.querySelector('.month-layout').hidden = true;
    $('overview-state').hidden = false;
    const loading = admin ? 'Loading the desk…' : 'Loading your reviews…';
    $('summary').textContent = `${dateLine} · ${state === 'loading' ? loading : admin ? 'Desk overview unavailable' : 'Reviews unavailable'}`;
    $('overview-state').innerHTML = state === 'loading'
      ? `<div role="status" aria-busy="true"><p class="t-row">${loading}</p><div class="ph" aria-hidden="true"></div><div class="ph" aria-hidden="true"></div></div>`
      : `<div class="panel-note !bg-error-soft" role="alert"><h2 class="t-h2">${admin ? 'The desk overview didn’t load' : 'Your reviews didn’t load'}</h2><p class="mt-2 text-[15px]">${admin ? 'Try again to see publication dates, messages and invites.' : 'Try again to see your deadlines and requests.'}</p><button type="button" class="btn btn-day mt-4" id="retry">Try again</button></div>`;
    $('retry')?.addEventListener('click', () => { const url = new URL(location.href); url.searchParams.delete('state'); location.href = url.href; });
  }
  render();
})();
