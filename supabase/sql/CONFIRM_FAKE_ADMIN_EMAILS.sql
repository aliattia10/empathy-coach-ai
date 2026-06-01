-- @admin.com addresses are not real mailboxes — do NOT use "Resend confirmation" or email links.
-- Run this in Supabase SQL Editor (as project owner) to allow password sign-in.

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where lower(email) like '%@admin.com'
  and email_confirmed_at is null;

select email, email_confirmed_at, last_sign_in_at
from auth.users
where lower(email) like '%@admin.com'
order by email;
