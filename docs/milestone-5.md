# Milestone 5 UI

Built on `ui-design-1`, preserving the existing routes, shared components, Tailwind styling, NextAuth sessions and API client.

New protected pages: buyer RFQs (list, creation, details), recipient leads (inbox/details), my quotes, admin RFQs (list/details) and supplier lead overview. Sidebar links reflect current roles; backend authorization remains authoritative.

General Request Quote and machinery-detail CTAs open the draft form. Save first, add private attachments, then submit. Quotes stay private to their author, buyer and administrators; buyer comparison shows each currency without inventing conversion. Contact reveal is decided by the backend after acceptance. Each recipient has a private message thread. Text RFQs work without a file provider; uploads require backend Bunny configuration.

Plan editing exposes RFQ entitlement, nullable monthly caps and contact permission. Legacy/current assignments retain their snapshots; an admin must renew/assign an RFQ-enabled plan before a supplier receives leads. Subscription cards show those assigned permissions.

No frontend secrets or new dependencies were added. All Bunny/Resend settings and both workers belong to `imet-server`; see its `docs/milestone-5.md` for setup, API contracts and verification.

Checks: `npm run lint`, `npm run type-check`, `npm run build`. Browser acceptance checks should cover draft/submit, recipient quote, private comparison/acceptance/contact/closure and admin review at mobile/tablet/desktop widths. Live email and storage delivery require configured secure provider credentials.

## Implementation validation (2026-10-04)

Both repository production builds, lint and TypeScript checks passed. Backend regression suite: 18 tests passed, including M0–M4 and M5. The final RFQ integration rerun also checked archived thread access and paginated lead overview. Prisma validation and repeat migration deployment passed.

Browser flow passed against running production builds: buyer creates/submits a machinery RFQ; supplier marks viewed and quotes; buyer compares, accepts, sees gated contact and closes; admin audit renders. RFQ list/detail, leads, quotes, admin RFQs and lead overview passed at 390/820/1440 pixels without horizontal overflow or application error alerts. All temporary records were cleaned up.

Live Bunny transfer and Resend delivery remain unverified because provider credentials are absent. Private Bunny HTTP was mocked in integration tests; email provider payload/error behavior was mocked in the existing regression suite. Environment configuration draft includes M5 worker startup and missing Bunny requirements; it still needs secure values and publication through environment settings.
