# M1 authentication completion

Authentication/account settings only; M2–M4 forms, APIs and business rules are preserved. Shared layout/header changes only handle signed-in account navigation and validated return paths. AloSkill was not modified. No dependency was added.

Google uses the existing NextAuth provider with PKCE/state/nonce, then backend verification and existing iMet sessions/RBAC. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the NextAuth server; never use NEXT_PUBLIC_ for the secret. Register `<NEXTAUTH_URL>/api/auth/callback/google` in the Google web OAuth client. The API must receive the same GOOGLE_CLIENT_ID. A missing configuration leaves Google controls disabled with guidance, preserving credentials login.

Existing password accounts are linked only from an authenticated session with matching verified email. Sign in with your password, then select Link / sign in with Google in account settings. Google-only accounts can establish a password through Forgot/reset password. Provider/account errors remain visible with credentials recovery; password sign-in always passes an explicit safe callback URL rather than inheriting an OAuth error URL.

Signup/sign-in/reset/change password use the shared accessible PasswordInput. M1 auth/user calls have 15-second deadlines; failed account loading has retry and sign-in recovery. Profile edits refresh live NextAuth/server identity, and user management requires at least one selected role with backend validation feedback. Protected destinations are preserved through the existing live server/API authorization guards; the new proxy records the local requested path but does not replace authorization.

Backend deployment adds two auth-only migrations and uses the existing Resend worker to recover durable encrypted verification/reset intents. Configure PUBLIC_SIGNUP_ROLE=BUYER, secure RESEND_API_KEY and a verified RESEND_FROM_EMAIL on the API/worker. See the companion imet-server `docs/m1-auth-completion.md` for migration, worker, encryption and refresh-handoff behavior.

In this restricted Node 24 cloud, allow accounts.google.com, oauth2.googleapis.com, www.googleapis.com and api.resend.com and launch with NODE_USE_ENV_PROXY=1 when HTTP(S)_PROXY is supplied. The saved environment draft preserves earlier setup and provider requirements. Draft saving does not apply the network/settings or publish an environment.

Checks: `npm run type-check`, `npm run lint`, `npm run build`, `node --test tests/auth-return-url.test.mjs`. Production-browser scripts/screenshots are in `/workspace/artifacts/m1-auth`; tests use isolated accounts, a real DB/Redis/email worker and controlled Google/email providers. Never use QA preload hooks or fake OAuth credentials in normal startup. Live Google consent and actual inbox delivery remain unverified until credentials and egress are configured.
