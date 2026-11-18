/* Shared synthetic records for admin prototypes; no persistence or production data. */
(() => {
  const { parse } = window.Desk;
  const messages = [
      { id: 'm1', on: '2026-11-15', at: '8:47 AM', topic: 'event', first: 'Rhea', last: 'Santiago', email: 'rhea.santiago@plpasig.edu.ph', unread: true, status: 'open',
        subject: 'Listing for our parol-making workshop',
        body: 'Hi ICG,\n\nThe Fine Arts Guild is holding a parol-making workshop for first-year students. It’s free and open to everyone, and we’ll provide the bamboo and paper. Could you put it on the calendar?\n\nWe can send photos from last year’s workshop if that helps.\n\nRhea Santiago, Fine Arts Guild',
        event: { title: 'Parol-making workshop', date: '2026-12-09', time: '1:00 PM', place: 'College of Arts lobby' } },
      { id: 'm2', on: '2026-11-14', at: '7:30 PM', topic: 'account', first: 'Bianca', last: 'Lim', email: 'bianca.lim@plpasig.edu.ph', unread: true, status: 'open',
        subject: 'ICG account request',
        body: 'Good evening. I’m the new president of the Debate Society. Our past president had an account but graduated in June. Can I get one so we can post our tournament results?\n\nThank you.' },
      { id: 'm3', on: '2026-11-14', at: '10:02 AM', topic: 'question', first: 'Liza', last: 'Ocampo', email: 'liza.ocampo@example.com', phone: '0917 123 4567', unread: true, status: 'open',
        subject: 'Is the job fair open to alumni?',
        body: 'Good morning. I graduated from PLP in 2024. Is the job fair next week open to alumni, and do we need to sign up first? I’d like to bring printed copies of my résumé if so.\n\nThank you!' },
      { id: 'm4', on: '2026-11-11', at: '2:40 PM', topic: 'correction', first: 'Joshua', last: 'Tan', email: 'joshua.tan@plpasig.edu.ph', status: 'open',
        subject: 'Wrong room in the hackathon story',
        body: 'Hi! The hackathon kickoff story says Computer Lab 2, but the kickoff is in Computer Lab 3. Could you fix it before Wednesday the 18th so nobody goes to the wrong room?',
        article: { title: 'Computer Studies hackathon kickoff', slug: 'computer-studies-hackathon-kickoff', id: 'a5' } },
      { id: 'm5', on: '2026-11-13', at: '9:15 AM', topic: 'photo', first: 'Carlo', last: 'Reyes', email: 'carlo.reyes@plpasig.edu.hp', status: 'open',
        subject: 'Please take down a photo of me',
        body: 'One of the intramurals photos shows me at the first aid tent, and I’d rather it not be online. It’s the fourth photo in the gallery.\n\nThank you.',
        replies: [{ by: 'Nina Flores', on: '2026-11-13', at: '4:50 PM', to: 'carlo.reyes@plpasig.edu.hp', delivery: 'failed', back: '5:02 PM',
          body: 'Hi Carlo,\n\nThanks for telling us. We’ve taken the photo down from the intramurals story. It can take a few minutes to disappear everywhere.\n\nNina Flores, ICG desk' }] },
      { id: 'm6', on: '2026-11-13', at: '11:30 AM', topic: 'question', first: 'Andrea', last: 'Gomez', email: 'andrea.gomez@plpasig.edu.ph', status: 'replied',
        subject: 'Can a livestream link go on the calendar?',
        body: 'Hello! Our org is streaming the acquaintance party for students who can’t come in person. Can the calendar listing include the stream link?',
        replies: [{ by: 'Maria Santos', on: '2026-11-13', at: '2:05 PM', to: 'andrea.gomez@plpasig.edu.ph', delivery: 'sent',
          body: 'Hi Andrea,\n\nYes. Send the event through the contact form with the link in the message, and we’ll add it to the listing.\n\nMaria Santos, ICG desk' }] },
      { id: 'm7', on: '2026-11-12', at: '4:45 PM', topic: 'partner', first: 'Ben', last: 'Aquino', email: 'ben.aquino@example.com', status: 'replied',
        subject: 'Interview request from the city youth paper',
        body: 'Good afternoon. I edit the youth section of a Pasig community paper. We’re writing about student journalism in the city and would like to interview someone from ICG this month. Who should I talk to?',
        replies: [{ by: 'Nina Flores', on: '2026-11-13', at: '9:10 AM', to: 'ben.aquino@example.com', delivery: 'sent',
          body: 'Hi Ben,\n\nThanks for thinking of us. I can talk with you myself. Are you free on Thursday, November 19, any time from 1:00 PM to 4:00 PM?\n\nNina Flores, ICG desk' }] },
      { id: 'm8', on: '2026-11-10', at: '1:20 PM', topic: 'event', first: 'Mika', last: 'Dela Rosa', email: 'mika.delarosa@plpasig.edu.ph', status: 'replied',
        subject: 'Glee Club Christmas concert',
        body: 'Hi! Please list our Christmas concert. Entry is free with a school ID, and guests can get passes at the Student Affairs office.',
        event: { title: 'Glee Club Christmas concert', date: '2026-12-12', time: '6:00 PM', place: 'University auditorium' },
        replies: [{ by: 'Maria Santos', on: '2026-11-10', at: '3:00 PM', to: 'mika.delarosa@plpasig.edu.ph', delivery: 'sent',
          body: 'Hi Mika,\n\nIt’s on the calendar for Saturday, December 12. We’ll send a writer to cover it, too.\n\nMaria Santos, ICG desk' }] },
      { id: 'm9', on: '2026-11-12', at: '8:02 AM', topic: 'partner', first: 'Growth', last: 'Team', email: 'hello@rankfast.example', status: 'closed', closedBy: 'Nina Flores', closedOn: '2026-11-12',
        subject: 'Get your website on page one of Google',
        body: 'Dear website owner, we help schools rank higher. Reply today for a free audit and a special price for this month only.' },
      { id: 'm10', on: '2026-11-06', at: '3:00 PM', topic: 'question', first: 'Jun', last: 'Navarro', email: 'jun.navarro@plpasig.edu.ph', status: 'closed', closedBy: 'Maria Santos', closedOn: '2026-11-09',
        subject: 'Never mind, I found it',
        body: 'Sorry, I found the enrollment schedule on the registrar’s page. You can ignore my earlier message.' },
    ];
  const people = [
      { id: 'u1', name: 'Maria Santos', email: 'maria.santos@plpasig.edu.ph', role: 'admin', group: 'ICG', state: 'active', active: 'Today, 9:15 AM', joined: 'June 2, 2026', me: true, work: 'Manages the desk' },
      { id: 'u2', name: 'Nina Flores', email: 'nina.flores@plpasig.edu.ph', role: 'admin', group: 'ICG', state: 'active', active: 'Thursday, November 12', joined: 'June 2, 2026', by: 'Maria Santos', work: 'Manages the desk' },
      { id: 'u3', name: 'Paolo Cruz', email: 'paolo.cruz@plpasig.edu.ph', role: 'reviewer', group: 'ICG', state: 'active', active: 'Today, 9:58 AM', joined: 'June 16, 2026', by: 'Maria Santos', work: '2 reviews in progress, 2 new requests', open: 4 },
      { id: 'u4', name: 'Bea Villanueva', email: 'bea.villanueva@plpasig.edu.ph', role: 'reviewer', group: 'ICG', state: 'active', active: 'Friday, November 13', joined: 'June 16, 2026', by: 'Maria Santos', work: 'No reviews in progress', open: 0 },
      { id: 'u5', name: 'Lea Mendoza', email: 'lea.mendoza@plpasig.edu.ph', role: 'writer', group: 'Computer Society', state: 'active', active: 'Today, 10:05 AM', joined: 'August 4, 2026', by: 'Maria Santos', work: '11 articles, 6 published' },
      { id: 'u6', name: 'Carla Dizon', email: 'carla.dizon@plpasig.edu.ph', role: 'writer', group: 'Glee Club', state: 'active', active: 'Saturday, November 14', joined: 'September 1, 2026', by: 'Nina Flores', work: '3 articles, 2 published' },
      { id: 'u7', name: 'Jo Ramos', email: 'jo.ramos@plpasig.edu.ph', role: 'writer', group: 'College of Nursing', state: 'active', active: 'Today, 9:12 AM', joined: 'November 15, 2026', by: 'Maria Santos', work: '1 article in review' },
      { id: 'u8', name: 'Kim Reyes', email: 'kim.reyes@plpasig.edu.ph', role: 'writer', group: 'Photography Club', state: 'active', active: 'November 3', joined: 'August 20, 2026', by: 'Nina Flores', work: '5 articles, 5 published' },
      { id: 'u9', name: 'Joy Bautista', email: 'joy.bautista@plpasig.edu.ph', role: 'writer', group: 'ICG', state: 'active', active: 'October 28', joined: 'June 20, 2026', by: 'Maria Santos', work: '9 articles, 8 published' },
      { id: 'u10', name: 'Ana Reyes', email: 'ana.reyes@plpasig.edu.ph', role: 'writer', group: 'Student Council', state: 'invited', sent: 'November 13', expires: 'November 20', by: 'Maria Santos' },
      { id: 'u11', name: '', email: 'rafael.santos@plpasig.edu.ph', role: 'reviewer', group: 'ICG', state: 'expired', sent: 'November 7', expires: 'November 14', by: 'Maria Santos' },
      { id: 'u12', name: 'Miguel Torres', email: 'miguel.torres@plpasig.edu.ph', role: 'writer', group: 'Computer Society', state: 'deactivated', off: 'October 2', joined: 'June 20, 2026', by: 'Maria Santos', work: '4 articles, 4 published' },
    ];

  // Same two-school-day promise as Messages; holidays are not modeled in this demo.
  function dueDate(s) { const d = parse(s); let n = 0; while (n < 2) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) n++; } return d; }
  const failed = m => (m.replies || []).some(r => r.delivery === 'failed') && m.status === 'open';
  // Overview derives counts from the same records as its destination pages.
  function overview(todayKey, empty) {
    const today = parse(todayKey);
    const priority = m => !failed(m) && dueDate(m.on) < today ? 0 : failed(m) ? 1 : 2;
    const open = empty ? [] : messages.filter(m => m.status === 'open').sort((a, b) => priority(a) - priority(b) || dueDate(a.on) - dueDate(b.on));
    const invites = empty ? [] : people.filter(p => ['invited', 'expired'].includes(p.state)).sort((a, b) => Number(b.state === 'expired') - Number(a.state === 'expired'));
    const scheduled = empty ? [] : window.Desk.dated().filter(x => x.kind === 'golive');
    const published = empty ? [] : window.ICGDemo.records.filter(r => r.type !== 'Event' && r.date <= today);
    return { messages: open, invites, scheduled, published };
  }
  window.AdminDemo = { messages, people, dueDate, failed, overview };
})();
