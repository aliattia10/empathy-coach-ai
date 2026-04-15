-- ADMIN_CHAT_SETUP.sql
-- Run this in Supabase SQL Editor.
--
-- What this does:
-- 1) Ensures ONLY Joshua can read all chat sessions and chat messages.
-- 2) Grants admin role only to josh@admin.com (if user exists in auth.users).
-- 3) Removes admin role from all other users.
--
-- Important:
-- - Create josh@admin.com first in Supabase Authentication -> Users.
-- - Then run this SQL.

-- Ensure enum exists
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'app_role'
      and n.nspname = 'public'
  ) then
    create type public.app_role as enum ('admin', 'manager', 'user');
  end if;
end $$;

-- Ensure user_roles table exists
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

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

-- Joshua-only admin monitor: must NOT reference auth.users directly in the policy
-- (authenticated role cannot SELECT auth.users — it breaks all users' chat queries).
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

-- Remove admin role from everyone except josh@admin.com
delete from public.user_roles
where role = 'admin'::public.app_role
  and user_id in (
    select id
    from auth.users
    where lower(email) <> 'josh@admin.com'
  );

-- Grant admin role only to josh@admin.com
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where lower(u.email) = 'josh@admin.com'
on conflict (user_id, role) do nothing;

-- Verification query
select
  u.email,
  r.role
from auth.users u
join public.user_roles r on r.user_id = u.id
where u.email in ('josh@admin.com', 'kara@admin.com', 'simon@admin.com', 'louise@admin.com')
order by u.email;

