/* Navigation and sample interactions for the static public design walkthrough. */
(() => {
  'use strict';
  const D = window.ICGDemo;
  const esc = D.escape;
  const page = location.pathname.split('/').pop().replace('.html','') || 'home';
  const params = new URLSearchParams(location.search);
  const routes = [['Home','home'],['Calendar','calendar'],['Archive','archive'],['About','about'],['Contact','contact']];
  const active = page==='article' ? (D.get(params.get('id'))?.type==='Event' ? 'calendar':'archive') : page;
  const icon = (path) => `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  const searchIcon = icon('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>');
  const links = routes.map(([label,file])=>`<li><a href="${file}.html"${active===file?' aria-current="page"':''}>${label}</a></li>`).join('');
  const header = document.querySelector('[data-component="SiteHeader"]');
  if (header) {
    const progress = header.querySelector('#progress')?.parentElement;
    const scrim = header.querySelector('.nav-scrim');
    header.replaceChildren();
    if(scrim)header.append(scrim);
    header.insertAdjacentHTML('beforeend',`<div class="public-header-row">
      <a href="home.html" class="public-brand" aria-label="ICG home"><span class="public-brand-mark">ICG</span><span class="public-brand-name">Integrated Communications Group<span>Pamantasan ng Lungsod ng Pasig</span></span></a>
      <nav class="public-nav" aria-label="Main"><ul>${links}</ul></nav>
      <div class="public-actions"><a href="archive.html#search" class="public-icon" aria-label="Search the archive">${searchIcon}</a><a href="login-identity.html" class="public-login">Log in</a><button type="button" class="public-icon public-menu-toggle" id="public-menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="public-menu">${icon('<path d="M4 7h16M4 12h16M4 17h16"/>')}</button></div>
    </div>`);
    if(progress)header.append(progress);
    document.body.insertAdjacentHTML('beforeend',`<dialog class="public-menu" id="public-menu" aria-label="Site navigation"><div class="public-menu-top"><a href="home.html" class="public-brand-mark" aria-label="ICG home">ICG</a><button type="button" class="public-icon" id="public-menu-close" aria-label="Close menu" autofocus>${icon('<path d="m6 6 12 12M18 6 6 18"/>')}</button></div><nav aria-label="Mobile">${links.replaceAll('<li>','').replaceAll('</li>','')}</nav><a class="public-login" href="login-identity.html">Log in to the ICG desk</a></dialog>`);
    const menu=document.getElementById('public-menu');
    const toggle=document.getElementById('public-menu-toggle');
    toggle.addEventListener('click',()=>{menu.showModal();toggle.setAttribute('aria-expanded','true');});
    document.getElementById('public-menu-close').addEventListener('click',()=>menu.close());
    menu.addEventListener('close',()=>{toggle.setAttribute('aria-expanded','false');toggle.focus();});
    matchMedia('(min-width:1024px)').addEventListener('change',e=>{if(e.matches && menu.open)menu.close();});
  }

  const footer=document.querySelector('[data-component="SiteFooter"]');
  if(footer)footer.innerHTML=`<div class="max-w-container mx-auto px-4 lg:px-16 pt-12 lg:pt-14 pb-8"><div class="grid gap-10 lg:grid-cols-[420px_1fr_1fr] lg:gap-16"><div><a href="home.html" class="font-display text-[44px] lg:text-[56px] leading-none" aria-label="ICG home">ICG</a><p class="mt-3 text-[15px] text-on-dark-muted leading-relaxed max-w-[44ch]">Campus life, on the record.</p><p class="mt-3 text-[15px] text-on-dark-muted leading-relaxed max-w-[44ch]">Stories, events, and announcements from the PLP community.</p></div><nav aria-label="Footer"><h2 class="text-[14px] font-bold text-marigold">Explore ICG</h2><ul class="mt-3 space-y-2 text-[15px]">${links}</ul></nav><div class="text-[15px] space-y-3"><h2 class="text-[14px] font-bold text-marigold">The campus desk</h2><p class="text-on-dark-muted">Pamantasan ng Lungsod ng Pasig<br>Alcalde Jose Street, Kapasigan, Pasig City</p><p><a href="contact.html" class="underline underline-offset-4">Send us a message</a></p><p><a href="contact.html?topic=event" class="underline underline-offset-4">Submit an event</a></p></div></div><div class="mt-10 pt-5 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px] text-on-dark-muted"><p>© 2026 Integrated Communications Group</p><p>Design preview · Sample campus content</p></div></div>`;

  const targets = new Map([
    ...routes.map(([label,file])=>[label,`${file}.html`]),
    ['Log in','login-identity.html'],['All news','archive.html?type=News'],['Read the latest news','archive.html?type=News'],
    ['All announcements','archive.html?type=Announcement'],['Send us a message','contact.html'],
    ['Contact the desk','contact.html'],['Submit an event','contact.html?topic=event'],
    ['Report a correction','contact.html?topic=question&subject=Report%20a%20correction'],
    ['contact form','contact.html?topic=event'],['Open the calendar','calendar.html'],
    ['Browse the archive','archive.html'],['Browse the calendar','calendar.html'],
    ['See the full calendar','calendar.html'],['See the full November calendar','calendar.html'],
    ['Email us','contact.html'],['Campus','archive.html?cat=Campus'],
    ['Student life','archive.html?cat=Student%20life'],['ICG','about.html']
  ]);
  function wireLinks() {
    document.querySelectorAll('a[href="#"], a[href="article.html"]').forEach(a=>{
      const title=a.querySelector('.story-title')?.textContent.trim();
      const text=a.textContent.replace(/\s+/g,' ').trim();
      const record=D.find(title||text);
      if(record){a.href=D.href(record);return;}
      if(targets.has(text)){a.setAttribute('href',targets.get(text));return;}
      if(/full .*calendar/i.test(text)){a.href='calendar.html';return;}
      if(/^[\w.+-]+@[\w.-]+$/.test(text)){a.href=`mailto:${text}`;return;}
      if(a.getAttribute('aria-label')==='Share by email'){
        a.href=`mailto:?subject=${encodeURIComponent(document.querySelector('h1').textContent)}&body=${encodeURIComponent(location.href)}`;return;
      }
      if(a.getAttribute('aria-label')==='Share on Facebook'){a.remove();return;}
      if(['Facebook','Instagram'].includes(text)){a.remove();return;}
    });
  }

  if(page==='article') {
    const id=params.get('id');
    const record=id ? D.get(id) : D.find('ICG summit asks every college to tell its own story');
    const articleHead=document.querySelector('[data-component="ArticleHead"]');
    const title=articleHead.querySelector('h1');
    const prose=document.querySelector('[data-component="ArticleBody"]');
    if(!record){
      title.textContent='Story not found';title.nextElementSibling.textContent='This link does not match an entry in the design preview.';
      prose.innerHTML='<p>Return to <a href="archive.html">the archive</a> to choose a story.</p>';
      document.querySelector('[data-component="EventStamp"]').hidden=true;
      document.querySelector('[data-component="ArticleGallery"]').hidden=true;
      document.querySelector('[data-component="LeadPhoto"]').hidden=true;
    } else {
      title.textContent=record.title;
      title.nextElementSibling.textContent=record.summary;
      document.title=`${record.title} — ICG`;
      const time=articleHead.querySelector('time');time.dateTime=D.dateString(record.date);
      time.textContent=record.date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
      const cat=articleHead.querySelector('a.font-semibold');cat.textContent=record.cat;cat.href=`archive.html?cat=${encodeURIComponent(record.cat)}`;
      const figure=document.querySelector('[data-component="LeadPhoto"]');
      figure.querySelector('img').src=`../../gallery/${record.photo || D.records[0].photo}`;
      figure.querySelector('img').alt=record.alt;
      figure.querySelector('figcaption').textContent=record.alt+'. From the PLP campus photo collection.';
      const isSummit=record.id==='icg-summit-asks-every-college-to-tell-its-own-story';
      if(!isSummit){
        const detail=record.type==='Event' ? `<h2>Event details</h2><p>${esc(time.textContent)} · ${esc(record.start)} to ${esc(record.end)}<br>${esc(record.place)}</p><p>${esc(record.summary)}</p><h2>Stay connected</h2><p>Find this event on <a href="calendar.html?date=${D.dateString(record.date)}">the campus calendar</a>, or <a href="contact.html?topic=event">contact the desk</a> with a question about the listing.</p>` : `<h2>From the campus desk</h2><p>This ${record.type==='Announcement'?'announcement':'story'} brings a moment from the PLP community into the shared campus record, with its date and context kept together.</p><p>Explore <a href="archive.html?type=News">more campus news</a>, check <a href="calendar.html">the calendar</a> for what's coming up, or <a href="archive.html?year=${record.date.getFullYear()}&month=${record.date.getMonth()+1}">browse the record for this month</a>.</p><h2>Keep the record useful</h2><p>Have a detail to add or a correction to share? <a href="contact.html?subject=${encodeURIComponent(record.title)}">Contact the ICG desk</a>.</p>`;
        prose.innerHTML=`<p>${esc(record.summary)}</p>${detail}`;
        document.querySelector('[data-component="ArticleGallery"]').hidden=true;
      }
      const stamp=document.querySelector('[data-component="EventStamp"]');
      stamp.querySelector('h2').textContent=record.type==='Event'?'Event details':'On the record';
      stamp.querySelector('.display').textContent=record.date.getDate();
      // Build date labels directly so all story and event links retain their dates.
      const dateBlock=stamp.querySelector('[class~="pb-1.5"]');
      if(dateBlock)dateBlock.innerHTML=`<span class="block text-[13px] font-semibold uppercase tracking-[.06em] text-on-dark-muted">${record.date.toLocaleDateString('en-US',{weekday:'short'})}</span><span class="block text-[15px] font-semibold">${record.date.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</span>`;
      stamp.querySelector('ul').innerHTML=record.type==='Event'?`<li>${esc(record.start)} to ${esc(record.end)}</li><li>${esc(record.place)}</li>`:`<li>${esc(record.cat)}</li><li>By the ICG news desk</li>`;
      stamp.querySelector('a').href=`calendar.html?date=${D.dateString(record.date)}`;
      if(record.type==='Event')stamp.insertAdjacentHTML('beforeend',`<button type="button" class="mt-5 h-11 px-5 rounded-pill border border-on-dark text-[14px] font-semibold" data-calendar-id="${esc(record.id)}">Add to calendar</button>`);
      const tags=document.querySelector('ul[aria-label="Topics"]');
      tags.innerHTML=`<li><a class="inline-flex min-h-11 items-center px-4 rounded-pill border border-ink text-[13px] font-semibold" href="archive.html?cat=${encodeURIComponent(record.cat)}">${esc(record.cat)}</a></li>`;
    }
  }

  wireLinks();
  document.addEventListener('icg:render',wireLinks);
  if(page==='contact'){
    const subject=params.get('subject');if(subject)document.getElementById('subject').value=subject.slice(0,200);
    const follow=document.querySelector('[data-component="FollowLinks"]');
    if(follow)follow.innerHTML='<h2 class="text-[20px] lg:text-[22px] font-bold pb-3 border-b border-ink">Keep up with campus life</h2><p class="mt-4 text-[15px] text-ink-muted">Follow the stories and dates that matter to the PLP community.</p><a href="archive.html?type=News" class="mt-4 inline-flex min-h-11 items-center text-[14px] font-semibold text-amber underline underline-offset-4">Read the latest news</a>';
  }
  if(location.hash==='#search')document.getElementById('q')?.focus({preventScroll:true});

  const icsEscape=s=>String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const fold=line=>{let result='',bytes=0;for(const char of line){const n=new TextEncoder().encode(char).length;if(bytes+n>73){result+='\r\n ';bytes=1;}result+=char;bytes+=n;}return result;};
  function calendarFile(records){
    const stamp=(r,t)=>{
      const match=/(\d{1,2})(?::(\d{2}))?\s*(AM|PM|NN)/i.exec(t||'9:00 AM');
      let h=+match[1]%12;if(match[3].toUpperCase()!=='AM')h+=12;
      return `${D.dateString(r.date).replaceAll('-','')}T${String(h).padStart(2,'0')}${match[2]||'00'}00`;
    };
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ICG//Public Design Preview//EN','CALSCALE:GREGORIAN','X-WR-TIMEZONE:Asia/Manila','BEGIN:VTIMEZONE','TZID:Asia/Manila','BEGIN:STANDARD','DTSTART:19700101T000000','TZOFFSETFROM:+0800','TZOFFSETTO:+0800','END:STANDARD','END:VTIMEZONE'];
    for(const r of records)lines.push('BEGIN:VEVENT',`UID:${r.id}@icg-design.local`,'DTSTAMP:20261114T000000Z',`DTSTART;TZID=Asia/Manila:${stamp(r,r.start)}`,`DTEND;TZID=Asia/Manila:${stamp(r,r.end)}`,`SUMMARY:${icsEscape(r.title)}`,`LOCATION:${icsEscape(r.place)}`,`DESCRIPTION:${icsEscape(r.summary)}`,'END:VEVENT');
    lines.push('END:VCALENDAR');
    const url=URL.createObjectURL(new Blob([lines.map(fold).join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=records.length===1?`${records[0].id}.ics`:'icg-campus-calendar.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  document.querySelectorAll('button').forEach(b=>{
    if(b.textContent.includes('Subscribe to this calendar')){
      b.dataset.calendarAll='true';
      b.lastChild.textContent=' Download calendar';
    }
  });
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(!b.hasAttribute('data-calendar-id')&&!b.hasAttribute('data-calendar-all')&&!b.textContent.includes('Add to calendar'))return;
    let record=D.get(b.dataset.calendarId);
    if(!record){const link=b.closest('li')?.querySelector('a.story') || document.querySelector('#hero-actions a');if(link)record=D.get(new URL(link.href).searchParams.get('id'));}
    const records=b.hasAttribute('data-calendar-all')?D.events:record?[record]:[];
    if(!records.length)return;
    calendarFile(records);
    let status=b.parentElement.querySelector('.public-message');
    if(!status){status=document.createElement('span');status.className='public-message';status.setAttribute('role','status');b.after(status);}
    status.textContent='Calendar file ready.';
  });
})();
