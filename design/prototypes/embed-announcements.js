/* Compact announcement layouts; eligibility and expiry remain a live-feed decision. */
(() => {
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const params = new URLSearchParams(location.search);
  const layout = params.get('layout') === 'row' ? 'row' : 'column';
  const requestedLimit=Number.parseInt(params.get('limit'),10);
  const limit = Number.isNaN(requestedLimit) ? 5 : Math.max(1,Math.min(10,requestedLimit));
  let state = ['empty','loading','error'].includes(params.get('state')) ? params.get('state') : '';
  const available = () => Boolean(window.ICGDemo);
  document.querySelector('.ew-announcements').dataset.layout = layout;

  function render() {
    const failed=state === 'error' || !available();
    const records=failed || state === 'empty' || state === 'loading' ? [] : window.ICGDemo.records
      .filter(r => r.type === 'Announcement').sort((a,b) => b.date-a.date).slice(0,limit);
    $('notices').hidden = !records.length;
    $('notices').innerHTML = records.map(r => {
      const fullDate=r.date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
      return `<li class="ew-notice"><a class="ew-notice-link" href="${esc(window.ICGDemo.href(r))}" target="_blank" rel="noopener"><h2>${esc(r.title)}</h2><time class="ew-notice-date" datetime="${window.ICGDemo.dateString(r.date)}"><b aria-hidden="true">${r.date.getDate()}</b><span class="ew-notice-stamp" aria-hidden="true"><span>${r.date.toLocaleDateString('en-US',{month:'long'})}</span><span>${r.date.getFullYear()}</span></span><span class="ew-sr">Posted ${fullDate}</span></time><span class="ew-notice-arrow" aria-hidden="true">↗</span><span class="ew-sr">Opens in a new tab</span></a></li>`;
    }).join('');
    $('notice-state').hidden = records.length>0;
    $('notice-state').setAttribute('aria-busy',String(state === 'loading' && !failed));
    $('notice-state').innerHTML = failed ? '<h2>Announcements couldn’t load</h2><p>Try again or open all announcements.</p><button type="button" class="ew-button" id="notice-retry">Try again</button>' : state === 'loading' ? '<h2>Loading announcements…</h2><div class="ew-loading-lines" aria-hidden="true"><span></span><span></span><span></span></div>' : '<h2>No announcements to show</h2><p>Check back later or browse all announcements.</p>';
    return records.length;
  }
  $('notice-state').addEventListener('click', e => {
    if (!e.target.closest('#notice-retry')) return;
    state=''; const url=new URL(location.href); url.searchParams.delete('state'); history.replaceState(null,'',url);
    const n=render();
    const target=!available() ? $('notice-retry') : document.querySelector('.ew-notice-link') || $('announcements-title');
    target.focus();
    $('notice-status').textContent = !available() ? 'Announcements still couldn’t load. Open all announcements.' : `${n} ${n===1 ? 'announcement' : 'announcements'} loaded.`;
  });
  render();
})();
