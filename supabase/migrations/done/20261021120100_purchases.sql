-- Run after 20261021120000_profiles.sql.
-- Records which songs a user has paid for. Authenticated users can read their
-- own rows only. Inserts happen later from the server with the service role
-- key, which bypasses row level security. A signed-in user cannot grant
-- themselves a song.

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  song_slug text not null,
  order_reference text not null,
  created_at timestamptz not null default now(),
  constraint purchases_song_slug_not_blank check (char_length(btrim(song_slug)) > 0),
  constraint purchases_order_reference_not_blank check (char_length(btrim(order_reference)) > 0),
  constraint purchases_user_song_order_unique unique (user_id, song_slug, order_reference)
);

create index purchases_user_id_idx on public.purchases (user_id);

alter table public.purchases enable row level security;

revoke all on table public.purchases from anon, authenticated;
grant select on table public.purchases to authenticated;

create policy "Users read their own purchases"
  on public.purchases
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
