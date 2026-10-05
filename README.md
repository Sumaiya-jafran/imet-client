# iMet Machinery client — Milestone 0

Next.js 16 App Router, React 19, strict TypeScript, and Tailwind 4 following AloSkill's directory organization.

## Setup

Use Node.js 24 and npm 11. Use the existing isolated cloud checkout without creating a worktree.

```sh
cd /workspace/imet-client
test -e .env.local || cp .env.example .env.local
npm ci --cache /workspace/.npm-cache
npm run dev
```

Start the API and database as described in `../imet-server/README.md`. The frontend defaults to port 3000 and the API to port 5000. `NEXT_PUBLIC_BACKEND_API_URL` must be reachable from the browser; its value is bundled at build time. `NEXT_PUBLIC_BACKEND_BASE_URL` documents the companion server origin. Never place credentials in public variables. For production, configure both origins before building and set the backend `FRONTEND_URL` to the exact frontend origin.

## Structure

- `src/app/(withoutSidebarLayout)/`: public routes and layout.
- `src/app/layout.tsx`, `loading.tsx`, `error.tsx`: application shell and states.
- `src/components/buttons/` and `shared/`: reusable accessible components.
- `src/lib/api/`: typed API client and feature services.
- `src/lib/utils.ts`: class-name composition.
- `src/config/`: public configuration validation.
- `src/types/`: API types.

The foundation page is a development status page, not a finished marketplace. It checks API/database readiness, shows loading/failure states, and offers retry. Authentication, dashboards, forms, catalogue, and other product features are intentionally reserved for later milestones. Add hooks, domain types, and form schemas using AloSkill's equivalent directories when needed rather than creating unused scaffolding.

The API client preserves HTTP failures using `ApiError`, supports request cancellation and FormData, and does not invent authentication behavior. M1 will integrate the approved authentication pattern.

## Validation

```sh
npm run lint
npm run build
npm run type-check
```

Building generates Next.js route types. Verify the status page shows connected services while the API/database are available, and that disconnect/retry works when the API is unavailable. Check both mobile and desktop layouts.

## Reference baseline

AloSkill frontend `aeed61f`, backend `fc05dbc`. Core versions follow its lockfiles; Next.js ESLint configuration is aligned to Next.js 16. Reference code is unchanged. Detailed M0 scope and verification are recorded in `../imet-server/docs/milestone-0.md`.

## Milestone 1

The `milestone-1` branch adds NextAuth credentials sessions, React Hook Form/Zod authentication forms, a protected account page, profile/password management, and administrator-only user management. Detailed scope/configuration and pending signup-policy/email requirements are in `../imet-server/docs/milestone-1.md`. NextAuth is patched to 4.24.15. Initialize missing local signing secrets with `node ../imet-server/scripts/init-local-env.mjs`, preserve `NEXTAUTH_URL`, and start the API, PostgreSQL and Redis first. Verification/reset URLs contain single-use tokens; live email delivery requires the separately configured Resend worker.

## Milestone 2

The `milestone-2` branch includes `/machinery` search/category filtering/pagination and `/machinery/[slug]` details, backed by the server public catalogue API. Start the matching backend branch and apply its migration before browsing. Only published machines appear; an empty catalogue shows an empty state. Prices are on request. Admin catalogue editing and online quote submission are scheduled for M3 and M5 respectively. No new frontend environment variables are required.

## Milestone 3

The `milestone-3` branch adds `/dashboard/admin/catalogue`, linked from administrator accounts. Manage categories, create/edit machinery, reorder image URLs/specifications, publish/unpublish, filter the catalogue and confirm deletions. Use the matching backend branch. Image upload/storage integration is deferred; this editor accepts validated HTTPS URLs. Existing M0/M1 setup applies, with no new environment variables.

## Milestone 4

The `milestone-4` branch adds supplier applications/accounts at `/dashboard/supplier`, owned machinery editing, admin supplier review at `/dashboard/admin/suppliers`, plan management at `/dashboard/admin/subscriptions` and public `/suppliers` profiles. Use the matching backend branch and apply its additive Prisma migration. Plans and subscription dates are admin-defined; activation/renewal is manual. The backend enforces approval, ownership, active terms and listing/media limits. Buyers browse without subscriptions; private supplier contacts are excluded from public pages/APIs. Logos/documents use HTTPS URLs rather than an upload service. See `../imet-server/docs/milestone-4.md` for setup and validation. No new frontend environment variables or payment integration are required.

## Milestone 5

Buyer RFQs, recipient leads/private quotes, admin review and subscription RFQ permissions retain the existing design and NextAuth/API patterns. See [docs/milestone-5.md](docs/milestone-5.md); provider credentials and workers are configured on the backend only.

## Milestone 6

Recipient pipelines, private opportunity details, sales history, admin oversight and buyer read-only purchases reuse the current dashboard and M5 workflows. See [docs/milestone-6.md](docs/milestone-6.md). Use the matching backend branch and apply its additive migration. No new frontend dependency, environment variable or payment integration is required.

## Milestone 7

See [Reviews & Ratings and Dynamic Homepage](docs/milestone-7.md) for buyer/admin workflows, live homepage data, setup and validation.

## Milestone 8

See [AI Translation](docs/milestone-8.md) for English/Bangla/Chinese public content, admin generation, original/fallback controls, backend OpenAI requirements and validation.

Milestone 9 adds lazy machinery 3D/360 viewing, capability-gated VR and admin/supplier media management. See [M9 setup and validation](docs/milestone-9.md). Storage credentials remain backend-only.

## Milestone 10 — Service & Warranty

The `milestone-10` branch adds completed-purchase service tickets, admin review/assignment/manual warranty assessment, assignee progress/resolution and admin closure. Read [the M10 implementation and deployment guide](docs/milestone-10.md) for permissions, APIs, pages, migration and validation. No new provider, dependency or environment variable is required.

## Milestone 11 — Notifications

The `milestone-11` branch preserves the existing UI for the approved email-only notification scope. See [M11 behavior and deployment](docs/milestone-11.md). Service emails link to existing authorized dashboards; no notification inbox, badge, new client API or dependency is introduced.
