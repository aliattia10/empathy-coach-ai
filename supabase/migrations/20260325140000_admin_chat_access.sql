-- Admin access setup for chat monitoring
-- 1) Ensure admins can read all chat messages
-- 2) Grant admin role to listed emails (if those users already exist)

create policy if not exists "Admins can view all messages"
  on public.chat_messages
  for select
  using (public.has_role(auth.uid(), 'admin'));

-- Grant admin role to specific users by email
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where u.email in (
  'kara@admin.com',
  'josh@admin.com',
  'simon@admin.com',
  'louise@admin.com'
)
on conflict (user_id, role) do nothing;

