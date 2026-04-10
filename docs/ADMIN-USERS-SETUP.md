# Admin Users Setup

Use this to configure admin login accounts and admin chat monitoring.

## Admin accounts

- `kara@admin.com` / `kara1*2`
- `josh@admin.com` / `joshua123*`
- `simon@admin.com` / `123*1`
- `louise@admin.com` / `louise*as`

Only **Joshua** (`josh@admin.com`) should be able to access `/adminchat`.

## Step 1 - Create these users in Supabase Auth

In Supabase Dashboard:
1. Go to **Authentication -> Users**
2. Click **Invite user** or **Create user**
3. Add each email/password pair above

## Step 2 - Apply admin role migration

Run migrations (or execute SQL file) so only Joshua gets `admin` role:

- `supabase/migrations/20260325140000_admin_chat_access.sql`

This migration:
- adds admin read policy for all chat messages
- removes `admin` role from Kara/Simon/Louise if present
- grants `admin` role in `public.user_roles` only to `josh@admin.com`

## Step 3 - Admin chat page password

- Route: `/adminchat`
- Default password in code: `123josh*1`
- For production, set Netlify env var:

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

