# Frontend authentication audit — 2026-11-08

The full architecture, flow map, backend security review, executed test evidence, environment requirements, Google Console setup and deployment checklist are in the companion **imet-server** repository at `docs/authentication-audit.md`.

## Changes

- Existing NextAuth server callbacks now honor INTERNAL_BACKEND_API_URL.
- Sign-out revokes the stored backend refresh session even when the access token has expired. Deploy the backend's additive `/auth/logout-refresh` endpoint first.
- Temporary refresh outages preserve the private refresh credential for retry; invalid sessions still clear credentials.
- Shared authentication email schemas normalize whitespace/case before validation.
- Successful password reset clears the local revoked NextAuth cookie.
- Supplier signup copy describes queued conditional email and the existing administrator approval requirement.

No auth architecture, roles, routing, schema, data fetching architecture or marketplace features replaced. No new dependencies. The existing session callback still exposes short-lived access tokens for bearer API calls; refresh credentials stay inside the encrypted HttpOnly session cookie and are never exposed through the session callback.

## Executed results

- PASS: `npm run lint`, `npm run type-check`, `npm run build`, `git diff --check`.
- PASS: **7** callback tests via `node --import /workspace/imet-server/node_modules/tsx/dist/loader.mjs tests/auth-session-audit.test.mts` (uses the existing backend's TSX loader).
- PASS: **6** native Node tests, executed as `node tests/auth-return-url.test.mjs`, `node tests/auth-validation-audit.test.mjs`, `node tests/primary-nav.test.mjs`, `node tests/supplier-profile.test.mjs`. Module-type inference warnings remain; no package architecture change.
- PASS: real desktop Chromium signup, controlled verification link, login, rejected unsafe redirect, page refresh, buyer access restrictions, forgot/reset, cookie clearance and logout against the actual Next.js/Express/PostgreSQL/Redis stack. Browser harness is in server `tests/browser/auth-audit.mts`; no authentication HTTP mocking. Dedicated local audit database only.
- BLOCKED: actual Google OAuth login/signup/link/cancel (client credentials and Console configuration absent). Controlled callback/provider checks and signed Google-token backend tests passed, which do not prove real OAuth integration.
- BLOCKED: real email delivery (Resend credentials/verified sender absent). Tests use controlled encrypted-outbox links; no real email sent.
- NOT TESTED: positive admin/supplier browser login, mobile/tablet auth runs, deployed HTTPS/proxy cookie behavior and production multi-instance load. Backend authorization and role isolation integration checks passed.

## Frontend configuration

Set NEXTAUTH_URL to the actual HTTPS production origin and NEXTAUTH_SECRET to a managed, independent high-entropy secret of at least 32 characters. Configure the public API URL for browsers; optionally set INTERNAL_BACKEND_API_URL for Next.js server reachability. Never expose Google client secret with a NEXT_PUBLIC_ prefix.

Enable Google with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Next.js, matching GOOGLE_CLIENT_ID in the backend. Register the exact `<NEXTAUTH_URL>/api/auth/callback/google` URI in a Google Web application client; configure consent/scopes and authorized test accounts. Validate the real flow in staging before calling Google integration verified.

Changed files: `.env.example`, `src/lib/auth/options.ts`, `src/lib/schema-validations/auth.schema.ts`, `src/components/forms/AuthForm.tsx`, `src/components/forms/SupplierSignup.tsx`, `tests/auth-session-audit.test.mts`, `tests/auth-validation-audit.test.mjs`, this document.
