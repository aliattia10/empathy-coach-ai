# Admin Login Credentials

> Security note: do not store real passwords in git.

## Admin users

- `kara@admin.com`
- `josh@admin.com`
- `simon@admin.com`
- `louise@admin.com`
- `nikki@admin.com`
- Passwords must be generated and managed in Supabase/Auth (or your secret manager), not in source code.

## /Adminchat    page to see all the conversations

- Route: `/adminchat`
- Page password comes from env var `VITE_ADMIN_CHAT_PASSWORD`

## Access policy note

- `/adminchat` is open to any **trainer admin** account ending in `@admin.com` with the `admin` role in `user_roles` (kara, josh, simon, louise, nikki).
- **Translation** defaults to **English**; admins can also translate to French, Spanish, German, Arabic, or Icelandic (see `docs/SUPER-PROMPT-ADMIN-PANEL.md`).

