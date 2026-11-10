# Machinmate development progress

## M4 initial audit — 2026-11-10

Reuse the existing App Router catalogue, machine cards/gallery, shared admin/supplier MachineForm, server-side API client, design tokens, protected dashboards and supplier storefront. Extend existing components for commercial/manufacturing data, filters/sorting, price-safe rendering, archived lifecycle, preview and contextual contact. Retire RFQ CTAs/writes without deleting historical records. M6 chat remains disabled; authenticated email contact will use the existing backend mail queue, not an RFQ or fake chat.

The backend audit, ownership/deployment risks, privacy policy and implementation plan are recorded in imet-server/docs/DEVELOPMENT_PROGRESS.md. Production ownership is not verified; no iMET mapping will be guessed. Public data/metadata/JSON-LD/sitemap must consume safe backend projections only.

## M4 implemented — 2026-11-10

Existing catalogue routes, cards/gallery, shared machine form, admin/supplier management, storefront and M3 tokens/entitlement APIs were extended. No new UI dependency. Machinery has manufacturing/commercial fields, archived status, fixed-price or contact-price rendering, supplier/location, server-side URL filters/sorting/pagination, related inventory and safe metadata. Multiple image uploads, cover selection/order/alt text and private preview reuse managed storage. A real browser test discovered and fixed optional manufacturingYear null becoming zero on edit/save; commercial field validation now displays errors.

Public UI never obtains retained contact amounts. Exact decimal strings format fixed prices without floating-point calculations. Only fixed-price detail pages render Product offers. Canonical/OG metadata, robots and sharded XML sitemap consume safe API projections. Supplier storefront queries remain supplier-scoped and paginated.

RFQ call-to-action compatibility helpers now point to machinery/direct contact; primary Messages is unavailable until M6. Active RFQ/lead/quote UI routes show a retirement notice, and old navigation entries are removed. Historical data/APIs are preserved by the backend; no fake chat or RFQ request is created. Contact email uses verified buyer consent and existing mail infrastructure; Chat with Supplier is disabled. Active pricing/onboarding descriptions no longer advertise retired RFQ benefits; stored custom feature strings are not rewritten.

Modified routes: /machinery, /machinery/[slug], /suppliers/[id], /dashboard/supplier/machinery and shared admin catalogue management; retired RFQ/lead/quote layouts; new /sitemap.xml, /pages-sitemap.xml, /machinery-sitemap/[page], /robots.txt. Changes include MachineForm, CatalogueManagement, CategoryManagement, MachineCard, MachineContact, Header/Footer/PrimaryNavigation/DashboardShell, HomeMarketplace/PlansPricing/SupplierOnboarding, route/nav configuration, catalogue schemas/types/API clients and semantic decimal/site/sitemap helpers. Existing Tailwind design tokens remain authoritative.

Backend migration: 20261110090000_m4_machinery. Production ownership is BLOCKED pending read-only verification/authoritative mapping; do not guess iMET ownership or run a production migration from this session. Legacy missing prices/condition must be supplied by confirmed owners. Full architecture, endpoints, security and deployment checklist: companion imet-server/docs/DEVELOPMENT_PROGRESS.md.

Verification: frontend ESLint, TypeScript and production webpack build PASS. Existing frontend Node tests: 6 PASS. Chromium desktop 1440, tablet 820 and mobile 390 checks PASS, no page errors or horizontal overflow; safe HTML/RSC/JSON-LD/sitemap, real email/password login and supplier management exercised. Multiple-image browser uploads use mocked Cloudinary transport with real API/database validation; cover ordering persisted and hidden amount remained internal. Real Redis enquiry queue and verified reply-to PASS; external email delivery/reply, real Cloudinary and YouTube uploads NOT TESTED. Screenshots were inspected from /tmp/machinmate-m4-browser (test images intentionally use fallback URLs).

Backend targeted runs: M4/catalogue/image/migration 20 PASS; authentication/M2/M3/assets 43 PASS; existing media/translation/historical migration 17 PASS. The whole legacy backend suite does NOT pass: active RFQ-dependent cases and older fixtures remain incompatible/incomplete; consult backend progress results. Do not treat M4 as production-deployed or the entire legacy suite as green.

Deployment: review backend migration and authoritative ownership before release; set backend FRONTEND_URL and frontend NEXT_PUBLIC_SITE_URL (or NEXTAUTH_URL) to the canonical HTTPS origin, preserve existing API/auth/storage/Redis variables, deploy client/API together, restart email/subscription workers and purge previous public caches. No M5, M6, M7 or M8 functionality was implemented.

### Modified frontend files

- `docs/DEVELOPMENT_PROGRESS.md`
- `src/app/(dashboardLayout)/dashboard/admin/catalogue/CatalogueManagement.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/catalogue/CategoryManagement.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/catalogue/MachineForm.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/leads/layout.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/rfqs/layout.tsx`
- `src/app/(dashboardLayout)/dashboard/leads/layout.tsx`
- `src/app/(dashboardLayout)/dashboard/quotes/layout.tsx`
- `src/app/(dashboardLayout)/dashboard/rfqs/layout.tsx`
- `src/app/(withoutSidebarLayout)/machinery/[slug]/page.tsx`
- `src/app/(withoutSidebarLayout)/machinery/page.tsx`
- `src/app/(withoutSidebarLayout)/suppliers/[id]/page.tsx`
- `src/app/machinery-sitemap/[page]/route.ts`
- `src/app/pages-sitemap.xml/route.ts`
- `src/app/robots.ts`
- `src/app/sitemap.xml/route.ts`
- `src/components/cards/MachineCard.tsx`
- `src/components/forms/SubscriptionPlanForm.tsx`
- `src/components/shared/DashboardShell.tsx`
- `src/components/shared/Footer.tsx`
- `src/components/shared/Header.tsx`
- `src/components/shared/HomeMarketplace.tsx`
- `src/components/shared/MachineContact.tsx`
- `src/components/shared/PlansPricing.tsx`
- `src/components/shared/PrimaryNavigation.tsx`
- `src/components/shared/SupplierOnboarding.tsx`
- `src/config/dashboard-nav.ts`
- `src/config/primary-nav.ts`
- `src/config/routes.ts`
- `src/lib/api/catalogue-admin.service.ts`
- `src/lib/api/supplier.service.ts`
- `src/lib/catalogue-search.ts`
- `src/lib/money.ts`
- `src/lib/schema-validations/catalogue.schema.ts`
- `src/lib/site-url.ts`
- `src/lib/sitemap-feed.ts`
- `src/types/catalogue.ts`
- `tests/primary-nav.test.mjs`

Final confirmation: all 80 targeted backend tests also passed in one combined run on the final migration/schema. Final Chromium run passed, including real Redis contact retry deduplication and HTTP 429 on the eleventh enquiry request. The full legacy backend suite remains a separately reported FAIL (completed run: 167 total, 147 passed, 19 failed, 1 skipped); it must not be described as green.
