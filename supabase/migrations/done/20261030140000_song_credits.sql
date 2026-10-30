-- Prepaid song gift credits (gift card purchase at /gift-cards).

create table public.song_credits (
  id uuid primary key default gen_random_uuid(),
  purchaser_user_id uuid not null references auth.users (id) on delete cascade,
  package_key text not null,
  amount_cents integer not null,
  currency text not null default 'USD',
  status text not null default 'pending',
  recipient_email text not null,
  recipient_name text not null default '',
  recipient_user_id uuid references auth.users (id) on delete set null,
  personal_message text not null default '',
  claim_token uuid not null unique default gen_random_uuid(),
  paypal_order_id text,
  paypal_capture_id text,
  paid_at timestamptz,
  claimed_at timestamptz,
  consumed_at timestamptz,
  redeemed_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint song_credits_package_key_check check (package_key in ('essential', 'signature', 'concierge')),
  constraint song_credits_amount_positive check (amount_cents > 0),
  constraint song_credits_currency_usd check (currency = 'USD'),
  constraint song_credits_status_check check (
    status in ('pending', 'paid', 'claimed', 'consumed', 'cancelled')
  ),
  constraint song_credits_recipient_email_length check (char_length(recipient_email) <= 254),
  constraint song_credits_recipient_name_length check (char_length(recipient_name) <= 200),
  constraint song_credits_message_length check (char_length(personal_message) <= 500)
);

create unique index song_credits_paypal_order_id_uidx
  on public.song_credits (paypal_order_id)
  where paypal_order_id is not null;

create unique index song_credits_paypal_capture_id_uidx
  on public.song_credits (paypal_capture_id)
  where paypal_capture_id is not null;

create index song_credits_recipient_email_idx on public.song_credits (lower(recipient_email));
create index song_credits_recipient_user_idx on public.song_credits (recipient_user_id, status);

drop trigger if exists song_credits_set_updated_at on public.song_credits;
create trigger song_credits_set_updated_at
  before update on public.song_credits
  for each row
  execute function public.set_updated_at();

alter table public.orders
  add column if not exists song_credit_id uuid references public.song_credits (id) on delete set null,
  add column if not exists payment_source text not null default 'paypal';

alter table public.orders drop constraint if exists orders_payment_source_check;
alter table public.orders
  add constraint orders_payment_source_check check (payment_source in ('paypal', 'gift_credit'));

alter table public.song_credits enable row level security;

revoke all on table public.song_credits from anon, authenticated;
grant select on table public.song_credits to authenticated;

create policy "Users read credits they bought or received"
  on public.song_credits
  for select
  to authenticated
  using (
    (select auth.uid()) = purchaser_user_id
    or (select auth.uid()) = recipient_user_id
  );
