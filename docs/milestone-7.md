# Milestone 7 — Reviews & Ratings and Dynamic Homepage

Use matching `milestone-7` branches in both repositories. This extends the existing M0–M6 architecture and shared Tailwind components without new dependencies or providers.

## Buyer and administrator workflows

Only the buyer on a completed M6 sale can review its RFQ-linked machinery and winning supplier profile, when present. Each sale/target has one review using 1–5 stars and non-empty text. Buyers need no subscription. The backend derives author/target IDs and checks ownership; frontend controls are not authorization.

Completed `/dashboard/purchases/[id]` shows eligible target forms with labelled native star radios, inline React Hook Form/Zod validation and submission states. Pending reviews require admin approval. Buyers can edit/resubmit or withdraw; editing removes publication until approval. Moderation feedback is private. `/dashboard/reviews` provides owned feedback search, status/target filtering, pagination and purchase links.

Administrators use `/dashboard/admin/reviews` to publish, reject or hide with optional feedback. Both new pages retain existing role-protected layouts and dashboard navigation. Version conflicts display API errors rather than silently overwriting another action. Withdrawal requires buyer resubmission before publication.

Machinery and supplier detail pages show only published reviews: actual average/count, real 1–5 distribution and paginated display-name-only feedback. No email, private contact, sale IDs or pricing is shown. Hidden/unpublished targets follow existing public visibility rules; expired supplier subscriptions do not remove buyers' historical eligibility.

## Live homepage

Five independently streamed sections reuse existing API services with uncached requests:

- Current categories with publicly visible machinery.
- Six current published machines, reusing MachineCard and existing catalogue ordering.
- All active admin-defined supplier/manufacturer plans with actual price/currency/duration, eligibility and feature limits. Activation is manual; buyers remain subscription-free.
- Active approved suppliers/manufacturers using existing marketplace visibility rules.
- Recent published completed-purchase feedback from visible targets.

Admin changes appear on the next request/refresh. Deactivated plans disappear; existing subscription snapshots remain unchanged. No invented featured flag, commercial plans, counts or testimonials are seeded. Suspense/loading, empty and independent error/retry states preserve the rest of the homepage when one section fails.

## Components and services

`ReviewForm`, `PurchaseReviews`, `PublicReviews`, `ReviewWorkspace` and `RatingStars` reuse Button, Badge, PageHeader, LoadingState, EmptyState, existing API envelopes and strict TypeScript. `HomeMarketplace` is server-rendered; `HomeSectionError` refreshes via the existing router. `review.service.ts` uses the existing API client and bearer authentication. Routes/file locations from previous milestones are preserved. AloSkill references remain unchanged.

## Setup

Apply the reviewed backend additive migration before running this frontend; see the server `docs/milestone-7.md` for APIs and migration safeguards. No new environment variable or worker is needed. Retain existing frontend API URLs, NextAuth configuration and backend PostgreSQL/Redis/M5 worker setup.

```bash
npm ci
npm run type-check
npm run lint
npm run build
npm start
```

Review publication sends no new email. Existing Resend/Bunny requirements still apply only to the previous email/upload integrations. M8–M13 and payments are outside this change.

## Validation

The backend regression suite passes all 37 tests, including completed-sale eligibility/ownership, duplicate and version races, moderation/edit/withdrawal, safe public projections, real ratings/distribution/pagination, plan synchronization and an additive migration upgrade. Both applications pass lint, type checks and production builds. Browser QA exercises a real M5 RFQ/quote → M6 completed sale → buyer review → admin publication → public rating flow, buyer edit/withdrawal and admin plan create/update/deactivate reflected on the homepage.

### Verified results

- Backend: 37 tests passed, zero failures/skips; focused M7 lifecycle and migration checks included.
- Both repositories: lint, type checks and production builds passed.
- Prisma: schema valid, seven migrations applied, no schema drift.
- Chromium: real RFQ/quote/completed-sale review lifecycle and admin plan create/update/deactivate synchronization passed.
- Responsive pages: 390px mobile, 820px tablet and 1440px desktop passed, including buyer forms, moderation, public details and seller sale-history regression. Long category/review text was checked.
- Public reviews: failure/retry remains local to the review section. Homepage: independent plans failure/retry, streamed loading and clean-database empty feedback passed.
- Mobile public-review pagination passed using eleven real temporary completed-purchase reviews across three pages.
- PostgreSQL/API readiness and a Redis RFQ-maintenance worker job passed after fixture cleanup.
- Fixtures are temporary; no review/commercial data is seeded and no live provider delivery is claimed.
