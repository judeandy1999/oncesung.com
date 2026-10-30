create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  href text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_title_length check (char_length(title) <= 200),
  constraint notifications_body_length check (char_length(body) <= 1000),
  constraint notifications_href_length check (char_length(href) <= 500)
);

create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

grant select, update on table public.notifications to authenticated;

create policy "Users read their notifications"
  on public.notifications
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users mark their notifications read"
  on public.notifications
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
