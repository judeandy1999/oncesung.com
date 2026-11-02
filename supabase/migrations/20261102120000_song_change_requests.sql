-- Revision & remake requests tied to delivered paid orders.

create table public.song_change_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  package_key text not null,
  request_type text not null,
  sequence_number integer not null,
  status text not null default 'sent',
  fields jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint song_change_requests_package_key_check check (package_key in ('essential', 'signature', 'concierge')),
  constraint song_change_requests_type_check check (request_type in ('revision', 'remake')),
  constraint song_change_requests_status_check check (status in ('sent', 'in_progress', 'completed', 'cancelled')),
  constraint song_change_requests_sequence_positive check (sequence_number > 0),
  constraint song_change_requests_fields_object check (jsonb_typeof(fields) = 'object')
);

create unique index song_change_requests_order_type_seq_uidx
  on public.song_change_requests (order_id, request_type, sequence_number);

create index song_change_requests_user_created_idx
  on public.song_change_requests (user_id, created_at desc);

create table public.song_change_request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.song_change_requests (id) on delete cascade,
  sender_role text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint song_change_request_messages_sender_check check (sender_role in ('customer', 'admin')),
  constraint song_change_request_message_body_not_blank check (char_length(btrim(body)) > 0),
  constraint song_change_request_message_body_length check (char_length(body) <= 4000)
);

create index song_change_request_messages_request_created_idx
  on public.song_change_request_messages (request_id, created_at);

drop trigger if exists song_change_requests_set_updated_at on public.song_change_requests;
create trigger song_change_requests_set_updated_at
  before update on public.song_change_requests
  for each row
  execute function public.set_updated_at();

alter table public.song_change_requests enable row level security;
alter table public.song_change_request_messages enable row level security;

revoke all on table public.song_change_requests from anon, authenticated;
revoke all on table public.song_change_request_messages from anon, authenticated;

grant select on table public.song_change_requests to authenticated;
grant select, insert on table public.song_change_request_messages to authenticated;

create policy "Users read own song change requests"
  on public.song_change_requests
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read messages on own song change requests"
  on public.song_change_request_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.song_change_requests r
      where r.id = request_id
        and r.user_id = (select auth.uid())
    )
  );

create policy "Users send customer messages on own song change requests"
  on public.song_change_request_messages
  for insert
  to authenticated
  with check (
    sender_role = 'customer'
    and exists (
      select 1
      from public.song_change_requests r
      where r.id = request_id
        and r.user_id = (select auth.uid())
    )
  );
