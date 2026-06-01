-- Run in SQL Editor when @admin.com user is "confirmed" but login still returns 400.

-- 1) Auth user health (must have encrypted_password; email_confirmed_at set)
select
  u.id,
  u.email,
  u.email_confirmed_at,
  (u.encrypted_password is not null) as has_password,
  u.banned_until,
  u.deleted_at,
  u.last_sign_in_at
from auth.users u
where lower(u.email) = 'nikki@admin.com';

-- 2) Login identity (should include provider email)
select user_id, provider, created_at, last_sign_in_at
from auth.identities
where user_id = (select id from auth.users where lower(email) = 'nikki@admin.com');

-- 3) App admin role
select ur.role, u.email
from public.user_roles ur
join auth.users u on u.id = ur.user_id
where lower(u.email) = 'nikki@admin.com';

-- Fix missing confirmation (if email_confirmed_at is null):
-- update auth.users set email_confirmed_at = now() where lower(email) = 'nikki@admin.com';

-- Password cannot be set in SQL — use Dashboard user edit, or:
--   node scripts/reset-admin-password.js nikki@admin.com "YourNewPassword"
