begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(4);

-- This fixture is rolled back. No domain table or persistent seed is created.
create table public.foundation_probe (id integer primary key, label text not null);
insert into public.foundation_probe values (1, 'ICG connectivity fixture');
select ok(not has_table_privilege('anon', 'public.foundation_probe', 'SELECT'),
  'new tables require explicit grants');

alter table public.foundation_probe enable row level security;
grant select on public.foundation_probe to anon;
set local role anon;
select is((select count(*)::integer from public.foundation_probe), 0,
  'a grant alone cannot expose rows protected by RLS');
select throws_ok($$insert into public.foundation_probe values (2, 'unauthorized')$$,
  '42501', null, 'anonymous writes remain denied');
reset role;

create policy foundation_probe_read on public.foundation_probe for select to anon using (true);
set local role anon;
select is((select label from public.foundation_probe where id = 1), 'ICG connectivity fixture',
  'an explicit read policy exposes the intended fixture');
reset role;
select * from finish();
rollback;
