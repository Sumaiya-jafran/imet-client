# Supplier signup flow

- **Free:** signup and select a free plan → verification email → verify email → account and free subscription active. No payment method or checkout.
- **Paid:** signup and select a paid plan → verification email → verify email → sign in → secure hosted checkout/payment method → backend verifies successful payment → account and subscription active.

The verification page explains the result and links to sign-in with the onboarding destination. The onboarding page shows the already selected plan, supports free activation for existing verified/pending users without gateway configuration, and shows checkout only for paid plans. Free terms start on activation. Supplier storefront approval and publishing controls remain separate from account activation.

No new database migration or environment variable is required for this follow-up. Existing mail worker and gateway credentials remain necessary for real email and paid payments. See **imet-server/docs/supplier-onboarding.md** for backend rules and deployment order (backend first).

PASS: nine backend tests, real browser free signup/files/verification/activation/login without payment, lint/TypeScript/build in both repositories. Gateway/storage/email transport were mocked or controlled; real merchant checkout and inbox delivery remain configuration-blocked.
