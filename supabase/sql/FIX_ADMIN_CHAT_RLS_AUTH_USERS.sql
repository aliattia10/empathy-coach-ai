-- FIX_ADMIN_CHAT_RLS_AUTH_USERS.sql
-- Run in Supabase SQL Editor if you see:
--   "permission denied for table users" on chat_sessions / chat_messages
--
-- Cause: RLS policies that use `SELECT ... FROM auth.users` run as the
-- `authenticated` role, which cannot read auth.users — so every request fails.
--
-- Fix: evaluate the Joshua + admin check inside a SECURITY DEFINER function.

create or replace function public.is_josh_admin_chat_monitor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and lower(coalesce(u.email, '')) = 'josh@admin.com'
  )
  and exists (
    select 1
    from public.user_roles r
    where r.user_id = auth.uid()
      and r.role = 'admin'::public.app_role
  );
$$;

grant execute on function public.is_josh_admin_chat_monitor() to authenticated;

drop policy if exists "Admins can view all sessions" on public.chat_sessions;
create policy "Admins can view all sessions"
  on public.chat_sessions
  for select
  using (public.is_josh_admin_chat_monitor());

drop policy if exists "Admins can view all messages" on public.chat_messages;
create policy "Admins can view all messages"
  on public.chat_messages
  for select
  using (public.is_josh_admin_chat_monitor());
