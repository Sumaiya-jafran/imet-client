# UI redesign through Milestone 4

The redesign keeps the existing routes, page locations, API services, validation schemas, authentication handlers and backend contracts. No dependency, backend source or database schema changes are required.

## Visual system

Graphite navigation, neutral surfaces and a restrained copper accent distinguish the industrial marketplace. Tokens and reusable surface/control treatments live in `src/app/globals.css`. The existing Button supports primary, secondary, destructive and ghost presentation. Lucide remains the icon library. System fonts avoid external font downloads.

Small shared components in the existing `components/shared` directory provide page headers, status badges, loading placeholders and empty states. Native inputs/selects and the native dialog are used rather than a new UI framework. Existing form components and typed API services remain in their original locations.

The dashboard layout reuses its existing authenticated `/auth/me` response to populate a presentation shell. Navigation has a collapsible desktop sidebar and a modal mobile drawer, with native keyboard focus containment, Escape dismissal and trigger focus restoration. Navigation visibility is presentational; existing backend/page authorization remains authoritative.

## Scope

| Area                  | Existing pages                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Marketplace           | `/`, `/machinery`, `/machinery/[slug]`, `/suppliers`, `/suppliers/[id]`                                                           |
| Authentication        | `/auth/signin`, `/auth/signup`, `/auth/forgot-password`, `/auth/resend-verification`, `/auth/reset-password`, `/auth/verify-user` |
| Account and suppliers | `/dashboard/account`, `/dashboard/supplier`, `/dashboard/supplier/machinery`                                                      |
| Administration        | `/dashboard/admin/users`, `/dashboard/admin/catalogue`, `/dashboard/admin/suppliers`, `/dashboard/admin/subscriptions`            |

Shared form styling covers profile/password management, catalogue categories/machinery/images/specifications, supplier applications/profile/review, plans and manual subscription terms. Existing loading, errors and public not-found screens receive consistent styling. Existing inline success and error announcements are preserved. No speculative routes, RFQ submission, payment flow, plan prices, testimonials or marketplace statistics are introduced.

## Accessibility and responsiveness

Layouts stack on narrow screens and use compact grids where space permits. Focus outlines, skip links, semantic landmarks, active navigation announcements, control labels, status announcements, image descriptions and reduced-motion support are maintained. Primary palette text combinations were chosen for AA contrast; disabled controls use their existing disabled states. Plan and supplier field validation messages are associated with their controls.

## Verification

Run `npm run lint`, `npm run type-check` and `npm run build` in the client. Start the matching backend, PostgreSQL and Redis using the existing setup documentation.

Chromium smoke checks exercise all 18 existing routes plus the two public not-found cases at 390px, 820px and 1440px. They check horizontal overflow, runtime exceptions, login validation, role restrictions, mobile drawer keyboard dismissal/focus restoration, desktop collapse, and dynamic form editors. A separate focused pass checks successful machinery, plan and supplier-application submissions with temporary database fixtures; no live email is sent. Screenshots use fixture content, not production records. This is targeted browser and keyboard verification, not a complete assistive-technology certification.

Only generated Next.js output is refreshed when restored development caches retain a prior stylesheet. Production builds are used for final visual checks. No migration is introduced by this UI change. The new dashboard links disable background prefetch so navigating the workspace does not proactively fetch every protected page. Repeated automated navigation can still reach the unchanged API rate limit; responsive and submission checks run in separate batches.
