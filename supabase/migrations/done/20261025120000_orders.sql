-- Run once in the Supabase SQL Editor, after these files have already been run
-- in order:
--   20261021120000_profiles.sql
--   20261021120100_purchases.sql
--   20261021120200_purchased_songs_bucket.sql
--
-- One row is one song a customer is buying. The price is stored in cents.
-- Customers can read their own rows. They cannot insert or update, so they
-- cannot mark themselves paid or attach a song file. The site server writes
-- rows with the service role key.

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  package_key text not null,
  amount_cents integer not null,
  currency text not null default 'USD',
  status text not null default 'draft',
  recipient_name text not null default '',
  occasion text not null default '',
  story jsonb not null default '{}'::jsonb,
  paypal_order_id text,
  paypal_capture_id text,
  song_storage_path text,
  song_filename text,
  song_content_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint orders_package_key_check check (package_key in ('essential', 'signature', 'concierge')),
  constraint orders_amount_positive check (amount_cents > 0),
  constraint orders_currency_usd check (currency = 'USD'),
  constraint orders_status_check check (status in ('draft', 'pending', 'paid')),
  constraint orders_recipient_length check (char_length(recipient_name) <= 200),
  constraint orders_occasion_length check (char_length(occasion) <= 200),
  constraint orders_story_size check (octet_length(story::text) <= 100000)
);

create unique index orders_paypal_order_id_uidx
  on public.orders (paypal_order_id)
  where paypal_order_id is not null;

create unique index orders_paypal_capture_id_uidx
  on public.orders (paypal_capture_id)
  where paypal_capture_id is not null;

create index orders_user_paid_idx
  on public.orders (user_id, paid_at desc);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row
  execute function public.set_updated_at();

alter table public.orders enable row level security;

revoke all on table public.orders from anon, authenticated;
grant select on table public.orders to authenticated;

create policy "Users read their own orders"
  on public.orders
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
