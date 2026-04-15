-- CONFIRM_ADMIN_USERS.sql
-- Run in Supabase SQL Editor (project owner / service role context).
--
-- Marks listed admin emails as email-confirmed so they can sign in
-- when "Confirm email" is enabled in Auth settings.
--
-- After running, refresh Authentication → Users; "Waiting for verification"
-- should clear for these rows.

-- Primary column for “email confirmed” in Auth; required for password sign-in when confirmation is on.
-- If your project’s auth.users still has confirmed_at, add: confirmed_at = coalesce(confirmed_at, now()),
update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where lower(email) in (
  'kara@admin.com',
  'josh@admin.com',
  'simon@admin.com',
  'louise@admin.com'
);

-- Optional: show result
select id, email, email_confirmed_at, last_sign_in_at
from auth.users
where lower(email) in (
  'kara@admin.com',
  'josh@admin.com',
  'simon@admin.com',
  'louise@admin.com'
)
order by email;
