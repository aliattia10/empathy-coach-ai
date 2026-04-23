# Admin Login Credentials

> Security note: do not store real passwords in git.

## Admin users

- `kara@admin.com`
- `josh@admin.com`
- `simon@admin.com`
- `louise@admin.com`
- Passwords must be generated and managed in Supabase/Auth (or your secret manager), not in source code.

## /Adminchat    page to see all the conversations

- Route: `/adminchat`
- Page password comes from env var `VITE_ADMIN_CHAT_PASSWORD`

## Access policy note

- Current `/adminchat` access is restricted to **Joshua** (`josh@admin.com`) in app logic.

