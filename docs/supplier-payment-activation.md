# Supplier subscription activation

The updated M4 brief adds SSLCOMMERZ subscription activation and an audited administrator activation flow. Backend configuration, API/security behavior and deployment steps are documented in the companion server repository at `docs/supplier-payment-activation.md`.

## Screens

- `/auth/signup`: existing buyer authentication remains available. Supplier/manufacturer signup collects the existing company profile and an eligible active database plan, then requires email verification.
- `/subscription`: verified pending suppliers can edit onboarding company details, upload through the existing private Bunny-backed upload system, choose an eligible plan, continue a pending checkout and read their payment history. Active subscriptions link to the supplier dashboard. Plans without supported gateway currency or with zero price use manual activation.
- `/payments/[id]`: owner-only processing/verified/failed/cancelled/expired/review status; initial and periodic authoritative reconciliation, with explicit retry/check controls. Redirect query values never determine success.
- `/dashboard/admin/suppliers`: selected supplier account/email status, immutable gateway payment history, activation metadata and a reason-required confirmation dialog for manual activation. Existing review, verification, profile and subscription administration remains available.
- Homepage: administrator-defined active plans, database prices/durations/limits, and registration CTA; changes and deactivation appear without static plan data.

Pending accounts can sign in, recover passwords and sign out but cannot open normal dashboard/business endpoints. Existing active users and buyer registration keep their working routes and behavior. Supplier activation does not automatically grant a verification badge or reveal private contacts.

No browser merchant credential or new dependency is required. Retain the existing NextAuth and `NEXT_PUBLIC_BACKEND_API_URL`/base URL configuration. The backend owns merchant credentials and callback URLs. Browser delivery, private uploads and provider execution still require their normal deployed infrastructure.

## Validation

Production build, TypeScript and ESLint checks pass; the companion server passes all 110 tests and migration/drift checks. Chromium checks cover supplier registration, password visibility, email verification, pending-account routing, file uploads through the existing storage adapter, hosted-checkout navigation, processing/verified payment state, admin confirmed activation, dynamic homepage changes, and desktop/tablet/mobile at 1440/820/390 pixels. Separate mobile checks against the normal API verify failed/cancelled/expired/pending/review screens, review checkout blocking, and stored status surviving missing gateway configuration. Gateway and storage transports are test fixtures for the primary browser lifecycle checks; live merchant/storage credentials are not used. See the server report for security/regression checks and live sandbox acceptance steps.
