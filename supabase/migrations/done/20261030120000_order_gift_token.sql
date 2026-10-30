-- Gift listen/download link token (unguessable; emailed to gift recipients).

alter table public.orders
  add column if not exists gift_access_token uuid unique default gen_random_uuid();

update public.orders
  set gift_access_token = gen_random_uuid()
  where gift_access_token is null;

alter table public.orders
  alter column gift_access_token set not null;
