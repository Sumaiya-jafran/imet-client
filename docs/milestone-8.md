# Milestone 8 — AI Translation

Use matching `milestone-8` client/server branches. The user confirmed OpenAI, public marketplace content only and admin-controlled generation. M8 extends the existing Next.js/TypeScript/Tailwind, API service, context, form and role-layout architecture. No dependency, duplicated locale pages, state framework or queue is added. AloSkill reference repositories are unchanged.

## Public language experience

Header and dashboard controls select **English**, **বাংলা** and **中文** (`en`, `bn`, `zh`). The preference persists locally, with memory fallback when storage is blocked. “Show originals” restores source text globally; “Show translations” returns to available cached results.

The approved fields are machinery names/descriptions/specification labels, supplier descriptions and published review bodies. They appear in existing machinery cards/detail, supplier detail/homepage and public/homepage reviews. Related machinery names on homepage review links also use their cache. Technical specification values and manufacturer/model columns remain unchanged. Original-language editing forms are preserved, so translated display values can never overwrite stored content through existing forms.

Static interface labels, category/plan/company names, metadata, URLs, search/sorting and private RFQ/quote/message/sales/review-moderation text are outside scope. A selected language affects available marketplace content, not every sentence in the app. Existing protected pages and permissions are unchanged.

The renderer keeps source text visible during loading, missing, stale, processing or failed translations and API errors. It shows a local fallback notice where useful. Returned source text must match the displayed original before a translation is used. Translated strings have correct language tags; unknown source language is marked unknown rather than assumed English. Bengali/CJK glyphs use natural spacing. No provider request or paid generation happens during page rendering, hydration or language selection.

## Admin workflow

The existing admin dashboard adds `/dashboard/admin/translations` and navigation. Active, verified admins can:

1. Search published machinery, currently public suppliers, or published reviews.
2. Inspect original fields and en/bn/zh cache statuses/results.
3. Explicitly choose each field's actual original language and a target.
4. Generate/use a current cache, regenerate, retry or reload status.

New content's source language is never inferred from browser preference. Specification labels are selected under their machinery; IDs returned alongside existing public label/value fields provide stable references. States are MISSING/STALE/PROCESSING/COMPLETED/FAILED. Same-language requests return originals without OpenAI; errors or concurrent/source changes stay visible with originals preserved. A missing server key and oversized fields show clear management guidance. No bulk/background translation or unrelated management feature is introduced.

## Files and conventions

New code follows existing locations:

- `src/app/contexts/LanguageContext.tsx`: shared presentation preference.
- `src/types/translation.ts`, `src/lib/api/translation.service.ts`: strict types and existing API client/auth envelopes.
- `src/components/shared/LanguageSelector.tsx`, `TranslatedText.tsx`, `TranslationWorkspace.tsx`: accessible controls, safe presentation and management.
- `src/components/forms/TranslationForm.tsx`: existing React Hook Form/Button conventions with explicit labels, validation and submission states.
- `src/app/(dashboardLayout)/dashboard/admin/translations/page.tsx` and `layout.tsx`: existing role protection.

Modified integration points are root layout, global language spacing, Header/DashboardShell, MachineCard, machinery/supplier details, HomeMarketplace, PublicReviews and specification types. Reuse Button, Badge, PageHeader, LoadingState and EmptyState. No key/provider library is present in browser code.

Public cache reads use batches of at most 40 references, deduplicated through a bounded 30-second browser read cache. They consume the backend `/translations/read` endpoint. Admin list/detail/generation calls use `/admin/translations/*` and bearer authentication. A browser refresh reads current translations; source changes invalidate cached results by server-side hash and changed original props. The backend rechecks current publication/supplier visibility and excludes stale, hidden or unauthorized data.

## Setup

Apply the reviewed additive translation migrations to the intended backend database before deploying this frontend; see server `docs/milestone-8.md` for exact schema/API/security details. Preserve existing NextAuth/JWT, PostgreSQL/Redis, API URL, Resend/Bunny and M5 worker configuration.

```bash
# imet-server
npm run db:generate
npm run db:validate
npm run db:deploy
npm run typecheck
npm run lint
npm run build
npm test
npm start

# imet-client
npm ci
npm run type-check
npm run lint
npm run build
npm start
```

Only the server needs `AI_TRANSLATION_API_KEY`, entered securely in backend/environment settings, and `AI_TRANSLATION_MODEL` (default `gpt-4.1-mini`). The server also bounds timeout, field characters and daily provider attempts. Never set a `NEXT_PUBLIC_` credential. No frontend environment variable or new worker is required. Without a usable key, live cross-language generation is unavailable; originals, existing cache reads and same-language generation still work.

## Validation status

Backend tests exercise all six language directions, identity/no-call, ownership/roles/publication, stale and changed sources, cache hits and concurrent claims, quotas, safe failures, technical tokens/structure and migration upgrades. Browser tests use a local mocked OpenAI transport and temporary database records; no live translation quality or provider credential usability is claimed. Frontend lint, strict typecheck and production build passed. Browser checks passed at 390, 820 and 1440 pixels, including language persistence, original toggle, public cached content, stale/unavailable fallback, admin controls and buyer/supplier access. Backend regression: 54 tests passed with no failures or skips. Mobile admin generation/retry used mocked OpenAI transport; tablet/desktop used normal server startup and verified missing-key guidance and same-language no-call behavior. Live OpenAI translation remains unverified until a usable backend key is configured.

M9–M13 are not implemented. Milestone 9 is next only when requested.
