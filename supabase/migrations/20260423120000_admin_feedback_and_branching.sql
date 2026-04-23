alter table public.chat_sessions
add column if not exists active_message_id uuid;

alter table public.chat_messages
add column if not exists parent_message_id uuid references public.chat_messages(id) on delete set null,
add column if not exists regenerated_from_message_id uuid references public.chat_messages(id) on delete set null,
add column if not exists branch_root_message_id uuid references public.chat_messages(id) on delete set null,
add column if not exists generation_metadata jsonb;

create index if not exists idx_chat_messages_parent on public.chat_messages(parent_message_id);
create index if not exists idx_chat_messages_branch_root on public.chat_messages(branch_root_message_id);
create index if not exists idx_chat_messages_regenerated_from on public.chat_messages(regenerated_from_message_id);

alter table public.chat_sessions
add constraint chat_sessions_active_message_fkey
foreign key (active_message_id)
references public.chat_messages(id)
on delete set null;

create table if not exists public.chat_feedback (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_sessions(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  feedback_text text not null,
  rating int check (rating between 1 and 5),
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.chat_feedback enable row level security;

create index if not exists idx_chat_feedback_message on public.chat_feedback(message_id);
create index if not exists idx_chat_feedback_conversation on public.chat_feedback(conversation_id);

do $$ begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_feedback'
      and policyname = 'Admins can manage feedback'
  ) then
    create policy "Admins can manage feedback"
      on public.chat_feedback
      for all
      using (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;
