create table if not exists public.control_records (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.control_records enable row level security;

grant select, insert, update, delete on public.control_records to anon;
grant select, insert, update, delete on public.control_records to authenticated;

drop policy if exists "anon read control records" on public.control_records;
create policy "anon read control records"
on public.control_records
for select
to anon
using (true);

drop policy if exists "anon insert control records" on public.control_records;
create policy "anon insert control records"
on public.control_records
for insert
to anon
with check (true);

drop policy if exists "anon update control records" on public.control_records;
create policy "anon update control records"
on public.control_records
for update
to anon
using (true)
with check (true);

drop policy if exists "anon delete control records" on public.control_records;
create policy "anon delete control records"
on public.control_records
for delete
to anon
using (true);
