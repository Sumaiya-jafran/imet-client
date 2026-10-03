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
