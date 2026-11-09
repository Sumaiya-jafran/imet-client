# M3 frontend implementation

> See [the M3 offline/plan-management extension](m3-offline-plan-management.md) for the current admin-operated offline workflow and plan controls.

The complete audit, database migration, subscription policy, API/security details, environment requirements, test results, file inventory, sandbox instructions, limitations, and deployment checklist are in the server report:

https://github.com/Sumaiya-jafran/imet-server/blob/feat/m3-subscriptions/docs/m3-subscriptions.md

Frontend changes reuse existing Next.js App Router, NextAuth, API client, form validation, Tailwind tokens, buttons, private-file renderer, and plan-management architecture.

- Plan selection is signup's first step; zero-priced plans request no payment method. Paid selection requires a configured supported method and persists through verification.
- Public `/plans` loads active public plans dynamically, identifies Free/current plans, and links to the selected checkout or signup.
- `/subscription` displays current/history/usage/payment state and supports online or manual checkout. Existing active access remains until verified replacement.
- Existing supplier dashboard and footer link to dynamic pricing.
- Admin subscription management gains plan metadata/entitlement controls and billing administration: payment/period filters, pagination, currency-separated revenue, method management, private proof review, manual decisions, and completed manual-refund recording.
- Terminal results clear method-specific retry keys. Session storage contains only idempotency IDs, never authentication tokens.
- Real browser tests covered signup/verification/uploads and Free-to-manual-paid upgrade/admin verification, including desktop/tablet/mobile overflow checks.

Default Turbopack production build was blocked by local socket restrictions. The supported `npm run build -- --webpack` production build passed. TypeScript and ESLint passed. Real SSLCOMMERZ sandbox testing remains blocked by missing merchant configuration; no real provider success is claimed.
