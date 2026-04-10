-- ADMIN_CHAT_SETUP.sql
-- Run this in Supabase SQL Editor.
--
-- What this does:
-- 1) Ensures admins can read all chat sessions and chat messages.
-- 2) Grants admin role only to josh@admin.com (if user exists in auth.users).
-- 3) Removes admin role from other previously listed admin emails.
--
-- Important:
-- - Create josh@admin.com first in Supabase Authentication -> Users.
-- - Then run this SQL.

-- Ensure helper function exists (already present in most setups)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  );
$$;

-- Admins can read all chat sessions
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_sessions'
      and policyname = 'Admins can view all sessions'
  ) then
    create policy "Admins can view all sessions"
      on public.chat_sessions
      for select
      using (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

-- Admins can read all chat messages
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_messages'
      and policyname = 'Admins can view all messages'
  ) then
    create policy "Admins can view all messages"
      on public.chat_messages
      for select
      using (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

-- Remove admin role from non-Josh admin emails, if present
delete from public.user_roles
where role = 'admin'::public.app_role
  and user_id in (
    select id
    from auth.users
    where email in (
      'kara@admin.com',
      'simon@admin.com',
      'louise@admin.com'
    )
  );

-- Grant admin role only to josh@admin.com
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where u.email = 'josh@admin.com'
on conflict (user_id, role) do nothing;

-- Verification query
select
  u.email,
  r.role
from auth.users u
join public.user_roles r on r.user_id = u.id
where u.email in ('josh@admin.com', 'kara@admin.com', 'simon@admin.com', 'louise@admin.com')
order by u.email;

