# Admin access (ShiftED AI)

Admin features are **not** gated by passwords compiled into the frontend. Access is controlled by Supabase Auth plus a row in `public.user_roles`.

## How admins are created

1. Create or identify the user in **Supabase → Authentication → Users** (typically an `@admin.com` trainer address).
2. Run the admin setup SQL in **Supabase → SQL Editor** (see `supabase/sql/ADMIN_CHAT_SETUP.sql` in this repo) to insert an `admin` role for that user's UUID into `user_roles`.
3. Confirm the user can sign in at `/testing/login` and open `/adminchat` (Admin Chat Monitor).

## What admins can do

- View all users' chat sessions in `/adminchat` (RLS allows admins to read cross-user data; the UI still requires the `admin` role).
- Star messages and leave trainer feedback when signed in as admin.

## Security notes

- Do **not** store admin passwords or PINs in `VITE_*` environment variables — they are shipped to every browser.
- Rotate compromised credentials in Supabase Auth directly; update this doc if the onboarding process changes.
- Optional extra PIN verification, if required later, must be checked in a Netlify Function using a **non-`VITE_`** secret.

## Related files

- `supabase/sql/ADMIN_CHAT_SETUP.sql` — role grants and admin RLS helpers
- `src/pages/AdminChatPage.tsx` — admin chat monitor UI
