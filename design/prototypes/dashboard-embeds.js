/* Admin design preview. One validated configuration drives both iframe and code. */
(() => {
  const { $, mount } = window.Desk;
  mount({current:'settings',title:'Embed widgets'});
  const params=new URLSearchParams(location.search), sections=['featured','categories','about','contact','email'];
  const back=new URLSearchParams({section:sections.includes(params.get('section')) ? params.get('section') : 'featured',role:'admin'});
  if (params.get('mail') === 'on') back.set('mail','on');
  $('settings-back').href='dashboard-settings.html?'+back;
  const frame=$('builder-preview');
  let valid=false, copying=false, revision=0, currentURL='', loadedURL='', previewFailed=false, retrying=false;
  const whole=(id,min,max) => /^\d+$/.test($(id).value) && Number($(id).value)>=min && Number($(id).value)<=max;
  function validDate(value) {
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(value)) return false;
    const [y,m,d]=value.split('-').map(Number), date=new Date(y,m-1,d);
    return date.getFullYear()===y && date.getMonth()===m-1 && date.getDate()===d;
  }
  function error(id,message,ok) { $(id).setAttribute('aria-invalid',String(!ok)); $(message).hidden=ok; return ok; }
  function dimensions() { $('preview-size').textContent=valid && !frame.hidden ? `${Math.round(frame.getBoundingClientRect().width)} px wide · ${frame.height} px tall` : 'Preview unavailable'; }
  new ResizeObserver(dimensions).observe($('preview-stage'));
  function controls() { $('copy-code').disabled=!valid || copying; $('select-code').disabled=!valid; }
  function render() {
    revision++; $('copy-status').textContent='';
    const events=$('widget-kind').value==='events', calendar=events && $('event-view').value==='calendar';
    $('event-options').hidden=!events; $('event-options').disabled=!events;
    $('announcement-options').hidden=events; $('announcement-options').disabled=events;
    $('count-row').hidden=calendar; $('item-count').disabled=calendar; $('calendar-hint').hidden=!calendar;
    document.querySelector('label[for="item-count"]').textContent=events ? 'Number of events' : 'Number of announcements';
    $('start-label').textContent=calendar ? 'Start on' : 'Show events from';
    const dateOK=error('start-date','start-error',!events || validDate($('start-date').value));
    const countOK=error('item-count','count-error',calendar || whole('item-count',1,10));
    const heightOK=error('frame-height','height-error',whole('frame-height',240,1600));
    valid=dateOK && countOK && heightOK;
    $('invalid-preview').hidden=valid; $('failed-preview').hidden=true; frame.hidden=!valid;
    if (!valid) {
      currentURL=''; loadedURL=''; previewFailed=false; retrying=false; frame.src='about:blank'; frame.setAttribute('aria-busy','false');
      $('embed-code').value=''; $('preview-status').textContent='Check the marked fields.'; controls(); dimensions(); return;
    }
    const options=new URLSearchParams();
    if (events) { options.set('view',calendar ? 'calendar' : 'list'); if (!calendar) options.set('limit',String(Number($('item-count').value))); options.set('startdate',$('start-date').value); }
    else { options.set('layout',$('notice-layout').value==='row' ? 'row' : 'column'); options.set('limit',String(Number($('item-count').value))); }
    const url=new URL(events ? 'embed-events.html' : 'embed-announcements.html',location.href); url.search=options;
    const title=events ? 'ICG campus events' : 'ICG announcements', height=String(Number($('frame-height').value));
    frame.title=title; frame.height=height;
    $('embed-code').value=`<iframe\n  src="${url.href.replace(/&/g,'&amp;')}"\n  title="${title}"\n  width="100%"\n  height="${height}"\n  style="border:0;"\n></iframe>`;
    if (currentURL!==url.href) {
      currentURL=url.href; loadedURL=''; previewFailed=false; retrying=false; frame.setAttribute('aria-busy','true'); $('preview-status').textContent='Loading preview…'; frame.src=currentURL;
    } else if (previewFailed) { frame.hidden=true; $('failed-preview').hidden=false; $('preview-status').textContent='Preview unavailable.'; }
    else { $('preview-status').textContent=loadedURL===currentURL ? 'Preview ready.' : 'Loading preview…'; }
    controls(); dimensions();
  }
  frame.addEventListener('load', () => {
    if (!valid || frame.src!==currentURL) return;
    let ready=false;
    try { ready=frame.contentDocument?.URL===currentURL && Boolean(frame.contentDocument.querySelector('.ew')); } catch { /* Production cross-origin readiness needs a separate contract. */ }
    loadedURL=ready ? currentURL : ''; previewFailed=!ready; frame.setAttribute('aria-busy','false');
    $('failed-preview').hidden=ready; frame.hidden=!ready;
    $('preview-status').textContent=ready ? 'Preview ready.' : 'Preview unavailable.'; dimensions();
    if (retrying) { $(ready ? 'preview-h' : 'reload-preview').focus({preventScroll:true}); retrying=false; }
  });
  $('reload-preview').addEventListener('click', () => {
    if (!valid) return;
    retrying=true; previewFailed=false; $('failed-preview').hidden=true; frame.hidden=false; frame.setAttribute('aria-busy','true'); $('preview-status').textContent='Loading preview…'; frame.src=currentURL;
  });
  $('embed-options').addEventListener('submit',e=>e.preventDefault());
  $('embed-options').addEventListener('input',render);
  document.querySelector('.preview-width').addEventListener('click', e => {
    const b=e.target.closest('[data-preview-width]'); if (!b) return;
    $('preview-stage').dataset.width=b.dataset.previewWidth;
    document.querySelectorAll('[data-preview-width]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));
    dimensions();
  });
  $('select-code').addEventListener('click', () => { $('embed-code').focus(); $('embed-code').select(); $('copy-status').textContent='Code selected. Copy it with your keyboard.'; });
  $('copy-code').addEventListener('click', async () => {
    if (!valid || copying) return;
    const snapshot=$('embed-code').value, version=revision;
    copying=true; controls(); $('copy-code').textContent='Copying…'; $('copy-status').textContent='';
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(snapshot);
      $('copy-status').textContent=version===revision ? 'Code copied.' : valid ? 'Earlier code copied. Options changed; copy the updated code.' : 'Earlier code copied. Fix the marked fields before copying again.';
    } catch {
      if (valid) { $('embed-code').focus(); $('embed-code').select(); $('copy-status').textContent='Couldn’t copy automatically. Code is selected; copy it with your keyboard.'; }
      else $('copy-status').textContent='Couldn’t copy. Fix the marked fields first.';
    } finally { copying=false; $('copy-code').textContent='Copy code'; controls(); }
  });
  render();
})();
