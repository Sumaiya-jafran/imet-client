# Machinmate M1 — branding and responsive navigation

Platform identity is Machinmate across public chrome, homepage, auth forms, dashboard/sidebar, page metadata, error copy and supplier onboarding/support labels. A new SVG browser icon is included. The existing Archivo typeface is self-hosted (36 KB Latin variable font from @fontsource-variable/archivo 5.3.0, SIL OFL included) because the environment blocks Google Fonts; no runtime dependency was added. Supplier names/data and existing iMet internal keys, return-path headers and checkout identifiers remain unchanged. Payment changes are display text only.

## Navigation

One PrimaryNavigation instance per layout; Header serves public/home/auth layouts, DashboardShell serves authenticated workspaces. Central route/role selection lives in src/config/primary-nav.ts. Desktop >=1024px keeps a 64px slot; IntersectionObserver moves the same nav to a bottom dock after that slot passes the viewport, then restores it. The slot prevents content movement. No scroll event handler or duplicate primary nav. CSS handles motion, reduced-motion preferences, touch targets, responsive widths and safe-area insets; the body reserves bottom clearance and interactive elements have scroll clearance. Existing sidebar, role guards and auth return-path handling are reused. Account always enters the existing account workspace and sidebar exposes the existing authorized role links. Header retains machine search (GET /machinery?q=...), account and language controls; suppliers remain reachable in header/footer.

Mobile/tablet <1024px use a fixed bottom navigation immediately. Six compact icon/label positions; unavailable entries are non-links with accessible explanations. Desktop hover titles explain the existing service-ticket and RFQ destinations. Guests use Account to sign in. No new catalogue, messaging backend or business logic.

| Item | Destination |
| --- | --- |
| Home | / |
| Machines | /machinery, active for nested machine pages |
| Spare parts | Unavailable, no route exists |
| Services — buyer | /dashboard/service-tickets |
| Services — supplier/seller | /dashboard/service-management |
| Services — admin | /dashboard/admin/service-tickets |
| Messages — buyer | /dashboard/rfqs |
| Messages — supplier/seller | /dashboard/leads |
| Messages — admin | /dashboard/admin/rfqs |
| Account | /dashboard/account or /auth/signin |

Messages are existing conversations inside RFQ details, not a standalone chat inbox. Services is an existing authorized service-ticket workspace, not service booking. Admin takes precedence for multi-role destinations; active states recognize related nested workspace routes. Supplier/seller roles remain LOCAL_SUPPLIER, INTERNATIONAL_MANUFACTURER, INDEPENDENT_SELLER and SALES_PERSON. Unauthorized management links are not added; backend authorization is unchanged.

## Executed validation

- npm run lint, npm run build and npm run type-check: passed in client.
- node --test tests/*.test.mjs: 3 tests passed (existing auth return URLs plus navigation role destinations and nested active states).
- Chromium against production build: desktop top/scrolled/return, exactly one primary nav, unchanged main-content document position across docking, 320/390/768/1024px widths, >=44px link targets, bottom spacing, no horizontal overflow, keyboard skip link, active routes, browser back/forward, guest dashboard login redirect preserving callback, and search query submission passed. No client page exceptions observed.
- Buyer/supplier/admin browser link checks use intercepted session fixtures; session removal returns Account to sign-in. These are UI checks, not real authenticated end-to-end tests.
- Backend ESLint passed. Existing email adapter test and new branding/escaping/supplier-name preservation test passed (2 tests).
- Backend npm ci postinstall, typecheck and build remain blocked: binaries.prisma.sh checksum download returns HTTP 403, so generated Prisma client/enums are absent. TLS/checksum verification was not disabled. Real login/logout, authorized dashboard rendering, database-backed catalogue/RFQ/payment regressions and the full backend suite could not be verified. Search navigation was checked, but successful catalogue data was not available.
- CSS safe-area support is implemented; physical iOS devices, software keyboards and screen-reader behavior were not tested.

No Prisma schema, migration, API contract, authentication flow, payment logic, supplier/RFQ data or permissions changed. Spare-parts functionality, standalone messaging, storefront expansion, service booking and other M2+ work are deferred.

## Changed client files

- `src/app/fonts/OFL.txt`
- `src/app/fonts/archivo-latin.woff2`
- `src/app/icon.svg`
- `src/components/shared/PrimaryNavigation.tsx`
- `src/config/primary-nav.ts`
- `tests/primary-nav.test.mjs`
- `src/app/(dashboardLayout)/dashboard/admin/catalogue/MachineForm.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/catalogue/page.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/translations/page.tsx`
- `src/app/(dashboardLayout)/dashboard/supplier/page.tsx`
- `src/app/(home)/page.tsx`
- `src/app/(withoutSidebarLayout)/machinery/[slug]/page.tsx`
- `src/app/(withoutSidebarLayout)/machinery/page.tsx`
- `src/app/(withoutSidebarLayout)/suppliers/[id]/page.tsx`
- `src/app/(withoutSidebarLayout)/suppliers/page.tsx`
- `src/app/auth/layout.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/forms/AuthForm.tsx`
- `src/components/forms/SupplierSignup.tsx`
- `src/components/forms/VerifyEmail.tsx`
- `src/components/shared/DashboardShell.tsx`
- `src/components/shared/Footer.tsx`
- `src/components/shared/Header.tsx`
- `src/components/shared/HomeMarketplace.tsx`
- `src/components/shared/HomeSectionError.tsx`
- `src/components/shared/SubscriptionPaymentStatus.tsx`
- `src/components/shared/SupplierOnboarding.tsx`
- `docs/machinmate-m1.md` (this report)
