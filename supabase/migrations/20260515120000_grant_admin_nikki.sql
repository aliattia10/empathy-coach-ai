-- Nikki (and other @admin.com accounts): fake inboxes — cannot receive verification emails.
-- Mark email confirmed in Auth + grant admin role. Run after creating the user in Supabase Auth.

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where lower(email) = 'nikki@admin.com';

insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where lower(u.email) = 'nikki@admin.com'
on conflict (user_id, role) do nothing;
