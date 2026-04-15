-- ADMIN_CHAT_USER_DIRECTORY.sql
-- Run this in Supabase SQL Editor.
--
-- Provides a safe Joshua-only directory for admin chat UI so it can show
-- user email/display_name instead of raw UUIDs.

create or replace function public.admin_chat_user_directory(user_ids uuid[])
returns table (
  user_id uuid,
  email text,
  display_name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if to_regclass('public.profiles') is not null then
    return query
    select
      u.id as user_id,
      u.email::text,
      p.display_name::text
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    where u.id = any(user_ids)
      and public.is_josh_admin_chat_monitor();
  else
    return query
    select
      u.id as user_id,
      u.email::text,
      null::text as display_name
    from auth.users u
    where u.id = any(user_ids)
      and public.is_josh_admin_chat_monitor();
  end if;
end;
$$;

grant execute on function public.admin_chat_user_directory(uuid[]) to authenticated;
