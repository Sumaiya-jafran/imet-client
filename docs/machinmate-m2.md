# Machinmate M2 — multi-supplier foundation

Implementation is prepared, but backend schema/client/type/build/API integration validation is blocked by Prisma's engine checksum download returning HTTP 403 from binaries.prisma.sh. Do not treat this as production-ready. No production migration, reset, backfill, supplier creation or record reassignment was executed.

## Architecture inspected

The application already uses Next.js App Router, Express 5, PostgreSQL/Prisma 7, Redis workers and session-backed JWT authentication. Supplier identity is an existing `Supplier` row, with unique `userId` and a Restrict FK to `User`; there is no separate company/organization membership model to duplicate. Existing supplier roles are LOCAL_SUPPLIER and INTERNATIONAL_MANUFACTURER. ADMIN permissions are re-read from database role assignments/session state by middleware, not accepted from JSON. Supplier status is PENDING/APPROVED/REJECTED/SUSPENDED/INACTIVE.

Machine.supplierId already has an indexed Restrict foreign key. Public data is projected using allowlisted selects; private business contacts, address, documents and account details are not selected. Existing managed logos/documents are tied to supplier/user ownership; ordinary machinery images bind to uploader/listing, and advanced media checks machine ownership and approved entitlement inside transactions. Supplier-owned RFQ/sales/review/translation records already have their own domain relations/access checks. Historical RFQs and unrelated records were not moved or deleted.

The main single-platform assumptions were public `supplierId = NULL` inventory and the admin form's "curated/no owner" option. A second bypass was payment/account activation automatically approving the supplier. Existing subscriptions, payment processing, RFQs, messaging and services already exist in this branch; M2 does not build or expand them. Existing entitlement gates are retained, so approval alone does not bypass applicable subscription requirements.

## Changes

- Reuse Supplier; add unique, format-checked public slug (max 120 chars). Existing profiles receive supplier-ID-derived slugs; new profiles have a database-generated default if no slug is supplied. Optional explicit slugs are validated. UUID-shaped slugs are rejected by application validation to avoid ambiguity with existing ID URLs.
- Existing `/suppliers/:id` accepts either a legacy UUID or a slug. Public catalogue supplier projections add `slug`; the original ID and response envelopes remain.
- Public machines must be PUBLISHED and resolve to an eligible approved supplier. Unassigned machines, non-approved suppliers and private drafts/archives are excluded through the shared public predicate, including public image/media delivery and RFQ discovery already using it.
- Supplier private catalogue list/detail now require an approved profile in addition to existing authenticated supplier-role middleware. Every write uses server-derived supplier identity, existing entitlement checks and strict request schemas. Updates/deletes include the current supplier in their atomic versioned predicate; client-supplied ownership cannot override the server target.
- Admin creation requires supplierId. Updates cannot clear ownership; legacy unassigned machines must be explicitly assigned before editing. Existing FK, version checks, audit events and deletion protections remain.
- Admin catalogue list supports an optional UUID supplierId filter. Supplier list schemas deliberately omit that filter; their identity is always server-scoped.
- Own profile edits additionally permit business name/location fields (optional for backward compatibility). They do not permit slug/identity/user/approval/role changes. Business-name changes clear the verified badge. Rejected application resubmission preserves the original storefront slug.
- Rejection and suspension require a reason. Existing review APIs grant supplier roles on approval and record audited status changes. Suspension is enforced by backend profile/entitlement/public guards, not just hidden buttons.
- Payment/account activation no longer writes Supplier.status=APPROVED or marketplaceVisible=true. Payment verification, term creation and financial/idempotency behavior are unchanged. A new supplier still needs independent admin review; payment cannot approve it.

## API/route map

All backend paths below are relative to `/api/v1`.

| API | Access and M2 behavior |
| --- | --- |
| GET /supplier/me | Existing authenticated user's own profile/status |
| POST /supplier/applications | Existing verified account; strict profile, optional slug; pending application, no self-approval |
| PUT /supplier/me | Own approved profile; allowlisted business/contact fields and updatedAt; protected identity/status rejected |
| GET /admin/suppliers and /:id | Existing ADMIN guard; application/profile review |
| PUT /admin/suppliers/:id | Existing audited admin profile edit |
| PATCH /admin/suppliers/:id/review | ADMIN; rejection/suspension reason required; versioned/audited transitions |
| GET /suppliers and /suppliers/:id-or-slug | Eligible approved profiles only; public projection, backward-compatible ID links |
| GET /catalogue/categories, /machines, /machines/:slug | Existing search/category/supplier filtering and pagination; owned eligible public inventory only |
| GET/POST /supplier/catalogue/machines; GET/PUT/DELETE /:id | Existing supplier roles plus approved identity, server-derived ownership, scoped/versioned writes |
| GET /admin/catalogue/machines?supplierId=UUID | ADMIN, optional owner filter; existing global admin detail/write routes remain |
| /supplier/catalogue/image-uploads/... | Existing session/uploader ownership, approved entitlement and managed-file restrictions reused |
| /catalogue/machines/:id/media; /catalogue/media/:id/preview | Existing actor/listing ownership checks; public content uses the tightened eligibility predicate |
| /supplier/assets/...; /suppliers/assets/:id/logo | Existing private owner/admin checks and public-eligible logo projection reused |

Frontend retains existing routes: `/suppliers`, `/suppliers/[id]` (ID or slug), `/machinery`, `/machinery/[slug]`, `/dashboard/supplier`, `/dashboard/supplier/machinery`, `/dashboard/admin/suppliers` and `/dashboard/admin/catalogue`. No fake pages are added. Storefronts now render a first page of supplier-owned public machinery plus the existing full filtered catalogue link. Supplier forms accept optional slugs on application and show them read-only afterward. Restricted states explain unavailable storefront/management actions. Admin profiles link to their filtered catalogue; listing forms require an owner.

## Migration and iMET preservation

Migration: `prisma/migrations/20261105180000_multi_supplier_foundation/migration.sql`.

It adds/backfills supplier slugs, creates a unique index/format constraint, and adds `machines_supplier_required CHECK (supplierId IS NOT NULL) NOT VALID`. The staged check preserves existing null rows but rejects new unowned inserts/updates. The Prisma ownership field intentionally remains nullable until a verified backfill is complete. No tables are dropped and no supplierId/userId or historical domain relations are changed.

The user explicitly stated they will upload iMET as a supplier later. Accordingly, M2 does not invent an iMET account, infer an owner from a name, or assign any legacy machinery to an arbitrary user. Existing known ownership remains exact; legacy null-owned records remain in admin inventory and become non-public. When iMET is registered/reviewed later, an authorized administrator must inspect each record and explicitly select the correct owner. The M2 SQL regression test preserves both known-owned and unassigned iMET-labelled fixtures; its assignment step is isolated test data in a rolled-back schema, not an application backfill.

## Executed validation

- Frontend lint, production build and type-check passed. Existing auth/navigation tests plus new slug form regression: 4 passed.
- Backend lint passed.
- Focused M2 validation/approval tests, all ten SQL migration regression tests and existing branding/email tests: 18 passed (6 validation, 10 migration, 2 email). SQL tests run in isolated temporary schemas inside rolled-back transactions on local PostgreSQL; public schema/data remain untouched.
- New `tests/m2-supplier-ownership.test.ts` covers applications, admin-only review, buyer denial, pending denial, own CRUD, cross-supplier detail/update/publish/delete and nested media denial, explicit-owner validation, public visibility/privacy, drafts, suspension/reactivation, admin owner filtering and audited review. Attempted execution failed at module loading because generated Prisma client is missing; these HTTP assertions have NOT executed.
- Prisma db:generate and db:validate both fail fetching the verified checksum (403). Backend typecheck/build fail with missing generated client/enums and resulting type errors. No dummy client, disabled TLS/checksum verification or passing replacement test was introduced.
- Existing catalogue/admin/image/notification fixtures now use approved supplier-owned inventory. Payment regression asserts payment does not approve a storefront, then explicitly sets up a reviewed fixture for its later payment assertions. Full ORM-backed catalogue/auth/upload/payment/RFQ regression suites remain unverified until client generation and a dedicated migrated test database are available.
- Chromium checks passed at 1440/768/390px for slug storefront with its machinery cards and pending supplier dashboard; no overflow/client exceptions. These use temporary read-only API/session fixtures outside the repositories and do not prove backend authorization.

## Deployment and verification checklist — manual, not executed

1. Review code and the payment/approval policy change. Back up the target database and record counts/ownership IDs. Use staging and a dedicated test database before production.
2. Restore verified HTTPS access to binaries.prisma.sh; run locked dependency installation, `npm run db:generate`, `npm run db:validate`, backend lint/typecheck/build. Fix any remaining issues before deploying; generation remains an external prerequisite.
3. On staging, run existing reviewed migrations using `npm run db:deploy`; run the new ownership HTTP test and relevant catalogue, supplier, uploads, auth, payment, RFQ and buyer/admin regression suites. Do not point these destructive fixture tests at production.
4. Check supplier slugs for uniqueness and public data leakage. Check every existing machine has its original supplierId. Review `SELECT id, name FROM machines WHERE "supplierId" IS NULL` as an admin. Do not guess ownership.
5. Apply the reviewed additive migration to production through the normal release process only. Deploy backend and frontend together in a controlled rollout; backend must understand slugs before frontend links use them. Expect unassigned inventory to disappear from public discovery, not from storage/admin history.
6. Register iMET when the user supplies its actual business profile; admin review is required. Only after authoritative per-record confirmation, assign legacy machinery using existing audited admin listing edits. No automatic data assignment is provided.
7. Confirm supplier A/B isolation for CRUD, nested images/media/documents; pending/suspended direct API denials; public draft/unowned exclusion; admin transitions/reasons/audits; buyer catalogue and login/logout; existing payment processing without auto-approval.
8. When `SELECT count(*) FROM machines WHERE "supplierId" IS NULL` is zero and every assignment is verified, manually validate the staged check with `ALTER TABLE machines VALIDATE CONSTRAINT machines_supplier_required`. A later reviewed migration may make the column NOT NULL. Do not validate/enforce it against unassigned legacy rows.

Cover images/social links are not added: the existing profile design/upload infrastructure only supports logos and private verification documents. No new billing/entitlements, spare parts, standalone messaging, booking or RFQ workflows were implemented.

## Changed files in this repository

- `docs/machinmate-m2.md`
- `tests/supplier-profile.test.mjs`
- `src/app/(dashboardLayout)/dashboard/admin/catalogue/CatalogueManagement.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/catalogue/MachineForm.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/catalogue/page.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/suppliers/SupplierManagement.tsx`
- `src/app/(dashboardLayout)/dashboard/supplier/SupplierDashboard.tsx`
- `src/app/(withoutSidebarLayout)/machinery/[slug]/page.tsx`
- `src/app/(withoutSidebarLayout)/suppliers/[id]/page.tsx`
- `src/app/(withoutSidebarLayout)/suppliers/page.tsx`
- `src/components/cards/MachineCard.tsx`
- `src/components/forms/SupplierProfileForm.tsx`
- `src/components/shared/HomeMarketplace.tsx`
- `src/components/shared/SupplierOnboarding.tsx`
- `src/lib/api/supplier.service.ts`
- `src/lib/schema-validations/supplier.schema.ts`
- `src/types/catalogue.ts`
- `src/types/supplier.ts`
