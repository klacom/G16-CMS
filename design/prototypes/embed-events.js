/* Public event widget design preview. Dates follow the shared public-calendar fixtures. */
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const parse = value => {
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(value || '')) return null;
    const [y,m,d] = value.split('-').map(Number), date = new Date(y,m-1,d);
    return key(date) === value ? date : null;
  };
  const params = new URLSearchParams(location.search);
  const today = new Date(2026,10,14); // Same stable demo clock as the public calendar.
  let selected = parse(params.get('startdate')) || new Date(today);
  let cursor = new Date(selected.getFullYear(), selected.getMonth(), 1);
  let view = params.get('view') === 'calendar' ? 'calendar' : 'list';
  let state = ['empty','loading','error'].includes(params.get('state')) ? params.get('state') : '';
  const limit = Math.max(1, Math.min(10, Number.parseInt(params.get('limit'),10) || 5));
  const available = () => Boolean(window.ICGDemo);
  const records = () => state === 'empty' ? [] : [...(window.ICGDemo?.events || [])].sort((a,b) => a.date-b.date);
  const on = date => records().filter(e => key(e.date) === key(date));
  const fullDay = d => d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const count = n => `${n} ${n === 1 ? 'event' : 'events'}`;
  const eventHTML = e => `<li class="ew-event"><a class="ew-event-link" href="${esc(window.ICGDemo.href(e))}" target="_blank" rel="noopener"><div><h3>${esc(e.title)}</h3><p>${esc(e.start || 'Time to be announced')}${e.end ? ` to ${esc(e.end)}` : ''}</p><p class="ew-place">${esc(e.place || 'Venue to be announced')}</p></div><span aria-hidden="true">↗</span><span class="ew-sr">Opens in a new tab</span></a></li>`;
  const emptyHTML = (title, hint) => `<div class="ew-state"><h3>${title}</h3><p>${hint}</p></div>`;

  function renderList() {
    $('from-date').value = key(selected);
    $('date-error').hidden = true; $('from-date').setAttribute('aria-invalid','false');
    const events = records().filter(e => e.date >= selected).slice(0,limit);
    const groups = new Map();
    events.forEach(e => { const date=key(e.date); if (!groups.has(date)) groups.set(date,[]); groups.get(date).push(e); });
    $('upcoming').innerHTML = events.length ? [...groups.values()].map(group => {
      const d=group[0].date;
      return `<section class="ew-day-group" aria-label="${esc(fullDay(d))}"><time class="ew-spine" datetime="${key(d)}" aria-label="${esc(fullDay(d))}"><b>${d.getDate()}</b><span class="ew-weekday">${d.toLocaleDateString('en-US',{weekday:'short'})}</span><span>${d.toLocaleDateString('en-US',{month:'long'})}</span></time><ol>${group.map(eventHTML).join('')}</ol></section>`;
    }).join('') : emptyHTML('No upcoming events', 'Try an earlier date or open the full campus calendar.');
  }

  function render() {
    const failed = state === 'error' || !available(), blocked = failed || state === 'loading';
    $('list-view').hidden = blocked || view !== 'list';
    $('calendar-view').hidden = blocked || view !== 'calendar';
    document.querySelectorAll('[data-view]').forEach(b => { const active=b.dataset.view === view; b.setAttribute('aria-selected',String(active)); b.tabIndex=active ? 0 : -1; });
    $('feed-state').hidden = !blocked;
    $('feed-state').setAttribute('aria-busy', String(state === 'loading' && !failed));
    $('feed-state').innerHTML = failed ? '<h2>Events couldn’t load</h2><p>Try again or open the full campus calendar.</p><button type="button" class="ew-button" id="retry">Try again</button>' : blocked ? '<h2>Loading events…</h2><div class="ew-loading-lines" aria-hidden="true"><span></span><span></span><span></span></div>' : '';
    $('full-calendar').href = `calendar.html?date=${key(selected)}&view=${view === 'list' ? 'agenda' : 'month'}`;
    if (blocked) return;
    if (view === 'list') renderList(); else renderCalendar();
  }

  function switchView(next) { view=next; render(); }
  document.querySelector('.ew-tabs').addEventListener('click', e => { const b=e.target.closest('[data-view]'); if (b) switchView(b.dataset.view); });
  document.querySelector('.ew-tabs').addEventListener('keydown', e => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
    e.preventDefault();
    switchView(e.key === 'Home' ? 'list' : e.key === 'End' ? 'calendar' : view === 'list' ? 'calendar' : 'list');
    $(view+'-tab').focus();
  });
  $('from-date').addEventListener('change', () => {
    const date=parse($('from-date').value);
    $('date-error').hidden = Boolean(date); $('from-date').setAttribute('aria-invalid',String(!date));
    if (!date) return;
    selected=date; cursor=new Date(date.getFullYear(),date.getMonth(),1); render();
    $('widget-status').textContent = `Events from ${fullDay(selected)}.`;
  });
  $('feed-state').addEventListener('click', e => {
    if (!e.target.closest('#retry')) return;
    state=''; const url=new URL(location.href); url.searchParams.delete('state'); history.replaceState(null,'',url);
    render(); $(available() ? view+'-tab' : 'retry').focus();
    $('widget-status').textContent = available() ? 'Events loaded.' : 'Events still couldn’t load. Open the full campus calendar.';
  });
  function renderCalendar() {
    const y=cursor.getFullYear(), m=cursor.getMonth(), days=new Date(y,m+1,0).getDate(), first=new Date(y,m,1).getDay();
    $('month-label').textContent = cursor.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    $('previous-month').disabled = y === 2000 && m === 0;
    $('next-month').disabled = y === 2099 && m === 11;
    const labels=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const cells=Array.from({length:Math.ceil((first+days)/7)*7}, (_,i) => {
      const n=i-first+1; if (n<1 || n>days) return '<td></td>';
      const date=new Date(y,m,n), id=key(date), nEvents=on(date).length;
      const active=id===key(selected), isToday=id===key(today), label=`${fullDay(date)}, ${count(nEvents)}`;
      const dot=nEvents ? '<span class="ew-event-dot" aria-hidden="true"></span>' : '';
      return `<td><button type="button" class="ew-day" data-date="${id}" aria-label="${esc(label)}" aria-pressed="${active}" ${isToday ? 'aria-current="date"' : ''} tabindex="${active ? 0 : -1}">${n}${dot}</button><span class="ew-static-day" data-today="${isToday}" data-selected="${active}"><span aria-hidden="true">${n}</span>${dot}<span class="ew-sr">${esc(label)}</span></span></td>`;
    });
    const rows=[]; for (let i=0;i<cells.length;i+=7) rows.push(`<tr>${cells.slice(i,i+7).join('')}</tr>`);
    $('month-grid').innerHTML = `<table aria-labelledby="month-label"><thead><tr>${labels.map(d=>`<th scope="col"><abbr title="${d}">${d.slice(0,3).toUpperCase()}</abbr></th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
    $('day-select').innerHTML = Array.from({length:days},(_,i) => { const d=new Date(y,m,i+1); return `<option value="${key(d)}" ${key(d)===key(selected) ? 'selected' : ''}>${d.toLocaleDateString('en-US',{month:'long',day:'numeric'})} · ${count(on(d).length)}</option>`; }).join('');
    const events=on(selected);
    $('day-title').textContent = fullDay(selected);
    $('day-count').textContent = count(events.length);
    $('day-events').innerHTML = events.length ? `<ol>${events.map(eventHTML).join('')}</ol>` : emptyHTML('No events on this day', 'Choose another day or open the full campus calendar.');
  }
  function selectDate(date, focus=false) {
    if (!date || date.getFullYear()<2000 || date.getFullYear()>2099) return;
    selected=date; cursor=new Date(date.getFullYear(),date.getMonth(),1); render();
    if (focus) document.querySelector(`[data-date="${key(date)}"]`).focus({preventScroll:true});
    $('widget-status').textContent = `${fullDay(date)}. ${count(on(date).length)}.`;
  }
  $('month-grid').addEventListener('click', e => { const b=e.target.closest('[data-date]'); if (b) selectDate(parse(b.dataset.date),true); });
  $('month-grid').addEventListener('keydown', e => {
    const b=e.target.closest('[data-date]'); if (!b) return;
    const d=parse(b.dataset.date), offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};
    let next;
    if (e.key in offsets) next=new Date(d.getFullYear(),d.getMonth(),d.getDate()+offsets[e.key]);
    else if (e.key==='Home' || e.key==='End') next=new Date(d.getFullYear(),d.getMonth(),d.getDate()-d.getDay()+(e.key==='End' ? 6 : 0));
    else if (e.key==='PageUp' || e.key==='PageDown') {
      const target=new Date(d.getFullYear(),d.getMonth()+(e.key==='PageUp' ? -1 : 1),1);
      next=new Date(target.getFullYear(),target.getMonth(),Math.min(d.getDate(),new Date(target.getFullYear(),target.getMonth()+1,0).getDate()));
    } else return;
    e.preventDefault(); selectDate(next,true);
  });
  $('day-select').addEventListener('change', () => selectDate(parse($('day-select').value)));
  $('previous-month').addEventListener('click', () => selectDate(new Date(cursor.getFullYear(),cursor.getMonth()-1,1)));
  $('next-month').addEventListener('click', () => selectDate(new Date(cursor.getFullYear(),cursor.getMonth()+1,1)));
  $('today').addEventListener('click', () => selectDate(new Date(today)));
  render();
})();
