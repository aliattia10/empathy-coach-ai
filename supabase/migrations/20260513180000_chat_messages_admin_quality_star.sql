-- Admin "quality star" on assistant messages: marks exemplar replies for global prompt shaping.

alter table public.chat_messages
add column if not exists admin_quality_star boolean not null default false;

alter table public.chat_messages
add column if not exists admin_starred_at timestamptz;

comment on column public.chat_messages.admin_quality_star is
  'When true, this assistant message is treated as an exemplar for live LLM system context (service role fetch).';
comment on column public.chat_messages.admin_starred_at is
  'Timestamp when the message was last starred (null if unstarred).';

create index if not exists idx_chat_messages_admin_star
  on public.chat_messages (admin_starred_at desc)
  where admin_quality_star = true;

-- Admins only; updates only the star columns (not message body).
create or replace function public.set_chat_message_admin_star(p_message_id uuid, p_starred boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'forbidden';
  end if;

  update public.chat_messages
  set
    admin_quality_star = p_starred,
    admin_starred_at = case when p_starred then now() else null end
  where id = p_message_id
    and role = 'assistant';

  get diagnostics n = row_count;
  if n = 0 then
    raise exception 'message not found or not an assistant message';
  end if;
end;
$$;

revoke all on function public.set_chat_message_admin_star(uuid, boolean) from public;
grant execute on function public.set_chat_message_admin_star(uuid, boolean) to authenticated;
