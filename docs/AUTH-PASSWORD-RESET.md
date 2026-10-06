# Auth — password reset

## Behaviour in the app

- Login validates standard email format before submit.
- **Forgot password?** sends `supabase.auth.resetPasswordForEmail` with `redirectTo` set to `/testing/reset-password`.
- The UI always shows **“Check your inbox”** whether or not the email exists (no account enumeration).
- The reset link lands on `/testing/reset-password`, which handles hash tokens, PKCE `?code=`, and error hashes.
- After setting a new password (minimum 8 characters), the user is redirected to `/testing/journeys`.
- Signed-in users can also change password from Settings.

## Supabase dashboard settings

In **Supabase → Authentication → URL configuration**:

1. Confirm **Site URL** and **Redirect URLs** include:
   - Production: `https://shiftedai.netlify.app/**` (and your custom domain if used)
   - Local: `http://localhost:8080/**`
2. Set recovery link expiry to **3600 seconds (60 minutes)** where exposed in Auth settings.

## Out of scope

- Magic-link sign-in (passwordless)
- MFA

Password + email login remains the default until product confirms otherwise.
