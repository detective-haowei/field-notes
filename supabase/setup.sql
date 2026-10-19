-- Run this once in the Supabase dashboard: SQL Editor -> New query -> Run.

-- One row per task or day setting, owned by the signed-in user.
create table if not exists public.items (
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  kind       text not null,
  id         text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);

alter table public.items enable row level security;

drop policy if exists "own items" on public.items;
create policy "own items" on public.items
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Live sync between devices.
alter publication supabase_realtime add table public.items;

-- Private file storage for attachments; each user can only touch their own folder.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "own attachments" on storage.objects;
create policy "own attachments" on storage.objects
  for all to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
