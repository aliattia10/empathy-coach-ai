# Admin Users Setup

Use this to configure admin login accounts and admin chat monitoring.

## Admin accounts

- `kara@admin.com`
- `josh@admin.com`
- `simon@admin.com`
- `louise@admin.com`
- `nikki@admin.com`
- Create strong passwords in Supabase/Auth. Do not commit passwords to git.

Any trainer account above with the `admin` role in `user_roles` can access `/adminchat` (not Joshua-only).

### @admin.com emails cannot be verified by inbox

Addresses like `nikki@admin.com` are **not real mailboxes**. Supabase may still require "email confirmed" for password login — but **no confirmation email can be read**.

**Do not** use Sign up + "check your email", or **Resend confirmation** in the dashboard.

**Do this instead:**

1. **Create user** in Supabase → Authentication → Users → **Create user**
   - Email: `nikki@admin.com`
   - Password: (choose and share securely with Nikki)
   - Enable **Auto Confirm User** if the checkbox is shown

2. If the user already exists and shows "Waiting for verification", run in **SQL Editor**:

```sql
-- One user
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
where lower(email) = 'nikki@admin.com';
```

Or run the whole team file: `supabase/sql/CONFIRM_FAKE_ADMIN_EMAILS.sql` (all `*@admin.com`).

3. Grant admin role: run `supabase/migrations/20260515120000_grant_admin_nikki.sql` (confirms email + role in one step for Nikki).

4. Sign in on the app with **email + password** only — no verification link needed.

**Still 400 / Invalid login credentials after email is confirmed?**

That is almost always the **wrong password** or the user was created on a **different Supabase project** than the live site uses.

1. In SQL Editor run `supabase/sql/DIAGNOSE_ADMIN_LOGIN.sql` — check `has_password` is `true`.
2. **Reset password** (cannot use "forgot password" for fake `@admin.com` mail):

```bash
# Same project as VITE_SUPABASE_URL on Netlify
set SUPABASE_URL=https://YOUR_REF.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
npm run admin:reset-password -- nikki@admin.com "ChooseANewPassword123"
```

Or Supabase Dashboard → **Authentication** → **Users** → `nikki@admin.com` → **⋮** → update/set password.

3. Confirm Netlify **VITE_SUPABASE_URL** matches the project where you ran the SQL (project ref in the browser network tab, e.g. `wxxwxvauseqftyorhkkp`).

**Optional (project-wide):** Authentication → Providers → Email → disable **Confirm email** for internal testing. Prefer SQL auto-confirm for production so only known admin addresses skip verification.

### Nikki cannot sign in?

**Invalid login credentials** means Supabase has no matching user/password. Nikki is not created automatically — you must provision her once:

**Option A — Dashboard**

1. Supabase → **Authentication** → **Users** → **Create user**
2. Email: `nikki@admin.com`, set a strong password
3. Enable **Auto Confirm User** (required for `@admin.com` — they cannot read verification mail)
4. Run `supabase/migrations/20260515120000_grant_admin_nikki.sql` in SQL Editor (confirms email + admin role)

**Option B — Script** (from project root, with service role key in env):

```bash
set ADMIN_USERS_JSON=[{"email":"nikki@admin.com","password":"YOUR_STRONG_PASSWORD"}]
npm run admin:seed-users
```

Then run the Nikki admin-role migration in the SQL editor.

```sql
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where lower(u.email) = 'nikki@admin.com'
on conflict (user_id, role) do nothing;
```

## Step 1 - Create these users in Supabase Auth

In Supabase Dashboard:
1. Go to **Authentication -> Users**
2. Click **Invite user** or **Create user**
3. Add each email and set a strong password

## Step 2 - Apply admin role migration

Run migrations (or execute SQL file) so only Joshua gets `admin` role:

- `supabase/migrations/20260325140000_admin_chat_access.sql`

This migration:
- adds admin read policy for all chat messages
- removes `admin` role from Kara/Simon/Louise if present
- grants `admin` role in `public.user_roles` only to `josh@admin.com`

## Step 3 - Admin chat page password

- Route: `/adminchat`
- Set Netlify env var:

```env
VITE_ADMIN_CHAT_PASSWORD=your-strong-password
```

## Notes

- `/adminchat` requires:
  1. logged-in user
  2. email = `josh@admin.com`
  3. `admin` role in `user_roles`
  3. correct admin page password
- Admins can monitor all stored AI chat conversations.

