-- Run in Supabase SQL Editor after prior migrations.
-- Customer ↔ admin support chat. Enable Realtime for support_messages in
-- Dashboard → Database → Publications → supabase_realtime (add support_messages).

create type public.support_inquiry_kind as enum ('general', 'paid_song');

create table public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind public.support_inquiry_kind not null default 'general',
  order_id uuid references public.orders (id) on delete set null,
  song_title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_song_title_length check (char_length(song_title) <= 200)
);

create unique index support_conversations_user_general_uidx
  on public.support_conversations (user_id)
  where kind = 'general' and order_id is null;

create unique index support_conversations_user_order_uidx
  on public.support_conversations (user_id, order_id)
  where order_id is not null;

create index support_conversations_kind_updated_idx
  on public.support_conversations (kind, updated_at desc);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations (id) on delete cascade,
  sender_role text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint support_messages_sender_role_check check (sender_role in ('customer', 'admin')),
  constraint support_message_body_not_blank check (char_length(btrim(body)) > 0),
  constraint support_message_body_length check (char_length(body) <= 4000)
);

create index support_messages_conversation_created_idx
  on public.support_messages (conversation_id, created_at);

alter table public.support_messages replica identity full;

create or replace function public.support_bump_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.support_conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger support_messages_bump_conversation
  after insert on public.support_messages
  for each row
  execute function public.support_bump_conversation_on_message();

drop trigger if exists support_conversations_set_updated_at on public.support_conversations;
create trigger support_conversations_set_updated_at
  before update on public.support_conversations
  for each row
  execute function public.set_updated_at();

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;

revoke all on table public.support_conversations from anon, authenticated;
revoke all on table public.support_messages from anon, authenticated;
grant select, insert on table public.support_conversations to authenticated;
grant select, insert on table public.support_messages to authenticated;

create policy "Users read own support conversations"
  on public.support_conversations
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users create own support conversations"
  on public.support_conversations
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users read messages in own conversations"
  on public.support_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.support_conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  );

create policy "Users send customer messages in own conversations"
  on public.support_messages
  for insert
  to authenticated
  with check (
    sender_role = 'customer'
    and exists (
      select 1
      from public.support_conversations c
      where c.id = conversation_id
        and c.user_id = (select auth.uid())
    )
  );
