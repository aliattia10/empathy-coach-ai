# Auth — password reset (Phase 3)

## Behaviour in the app

- Login validates standard email format before submit.
- **Forgot password?** sends `supabase.auth.resetPasswordForEmail`.
- The UI always shows **“Check your inbox”** whether or not the email exists (no account enumeration).
- The reset link lands on `/testing/settings`, where the user can set a new password via `updateUser({ password })`.

## Supabase dashboard setting (60-minute expiry)

In **Supabase → Authentication → Settings → Auth**:

1. Set **JWT expiry** / mailer OTP / recovery token lifetime as available for your project version.
2. For recovery links, set the email OTP / recovery expiry to **3600 seconds (60 minutes)** if the control is exposed (often under “Email” or “Auth Hooks”).
3. Confirm **Site URL** and **Redirect URLs** include:
   - Production: `https://shiftedai.netlify.app/**` (and your custom domain if used)
   - Local: `http://localhost:8080/**`

Document the chosen value in the Netlify deploy notes when you change it.

## Out of scope (open questions)

- Magic-link sign-in (passwordless)
- MFA

Password + email login remains the default until product confirms otherwise.
