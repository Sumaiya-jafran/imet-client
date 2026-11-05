# Global design system

This UI-only update uses the existing Next.js 16.3.8 App Router, Tailwind CSS 4.2 CSS-first theme, components and layouts. No runtime dependencies, routes, auth behavior, API/data handling or backend files change.

## Tokens and usage

The source of truth is `src/app/globals.css`. Its `@theme` defines primary #142F46, secondary/info #245B7A, accent #F28C28, accent-hover/warning #D97706, background #F4F6F8, surface #FFFFFF, foreground #17212B, muted #64748B, border #E2E8F0, success #16A34A and danger #DC2626. Inverse text, a stronger muted foreground for small text on the light-gray background, stronger status foregrounds, status tints and restrained shadows derive from these values using color-mix. Darker status foregrounds keep small status labels readable on light surfaces.

New components should use `bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `text-primary`, `text-secondary`, `border-border` and status tokens. Primary actions use `bg-accent text-foreground hover:bg-accent-hover`; use shared Button or action-link. Normal links remain primary/secondary blue. Use text-muted on white surfaces and text-muted-foreground on the light-gray background; the official muted color alone falls slightly below 4.5:1 on that background. Keyboard focus uses secondary blue. Do not use white text on orange actions.

Existing navy/orange, slate neutral and red/green/emerald/amber/blue utility palettes are compatibility aliases to the semantic tokens. This applies the system across all existing forms, cards, dropdowns, tables, dashboards, subscription pages, alerts, errors, loaders and empty states without rewriting component behavior. Existing white utilities also alias surface. Preserve status meaning; use `text-success-foreground`, `text-warning-foreground` or `text-danger-foreground` with tinted surfaces for small text.

Semantic typography utilities: `text-hero` (responsive 40–56px, 700), `text-page` (responsive 28–32px, 700), `text-section` (24px, 600), `text-card` (18px, 600), `text-body` (16px, 400), `text-nav` (15px, 500), `text-button` (14px, 600), `text-meta` (13px, 400). Existing text utilities map to the same scale. Compact mobile dock labels retain 12px sizing; decorative lettering remains oversized. Some existing form/help/table labels retain 12–13px metadata sizing. Existing font-display aliases Inter; bold/extrabold/black resolve to 700.

## Font

Inter is served with next/font/local from `src/app/fonts/inter-latin.woff2`, with display swap and the 400–700 variable range supporting 400, 500, 600 and 700. Both body and display use one font-family. Archivo and its file were removed. The font comes from @fontsource-variable/inter 5.3.0; SIL OFL accompanies the asset. Google Fonts was blocked by this environment, so neither build nor browser now needs Google Fonts access. Non-Latin content uses system fallbacks; Bengali and CJK retain natural letter spacing.

## Applied surfaces

Global/base controls and tables; homepage hero, sections and CTAs; desktop notch/dock and mobile header/navigation; footer; catalogue cards, filters and machine details; supplier profiles; pricing/subscriptions and payment-status display; auth forms/password controls; dashboard shell/account/supplier/admin components; badges, rating stars, loading, empty and error states. The 3D viewer reads the background token rather than a separate hardcoded canvas color. Existing layouts, controls, event handlers and business logic are preserved.

The standalone SVG browser icon uses literal official brand colors because an external SVG cannot inherit the document CSS. Neutral translucent overlays and existing decorative grid/stroke geometry remain; the navbar's blue gradient and old teal/yellow/black brand colors were removed. Orange is reserved for primary actions and restrained highlights; broad promotional bands now use neutral/navy backgrounds.

## Validation

- `npm run lint`, `npm run build`, `npm run type-check`: passed.
- `node --test tests/*.test.mjs`: 3 passed; existing auth return-path and navigation role/nested-route checks.
- Chromium inspected populated homepage/categories/pricing, machinery listing and details, supplier profile, sign-in/sign-up and subscription pages at 1440, 1024, 768, 390 and 320px widths. Dashboard account/forms/badges/sidebar were inspected at 1440, 1024, 768 and 390px using a fixture-authenticated session. Compact desktop navigation spacing and account shortcut min-widths were adjusted to avoid overflow without changing destinations or layout structure. Assertions check actual Inter family, official resolved tokens, populated catalogue rendering, no document overflow and no client exceptions.
- Populated-page visual checks use temporary read-only API fixtures outside the repository, not production/backend integration. Real backend/database flows were not verified: Prisma setup remains blocked by the previously observed checksum download HTTP 403. No TLS or checksum checks were bypassed.
- Source audit finds no Archivo declarations or the old brand hex colors in src. Official color literals remain centralized in the theme, plus the external favicon exception.
- Orange action text has calculated contrast ratios of 6.64:1 normally and 5.11:1 on hover; secondary blue on white is 7.36:1.
- Physical iOS/software-keyboard and screen-reader testing were not performed. No exhaustive claim is made for every data-dependent modal/table state; those inherit shared tokens and controls.

## Modified files

- `src/app/fonts/inter-latin.woff2`
- `src/app/(dashboardLayout)/dashboard/account/AccountPanel.tsx`
- `src/app/(dashboardLayout)/dashboard/supplier/SupplierDashboard.tsx`
- `src/app/(home)/page.tsx`
- `src/app/(withoutSidebarLayout)/machinery/[slug]/page.tsx`
- `src/app/(withoutSidebarLayout)/suppliers/[id]/page.tsx`
- `src/app/fonts/OFL.txt`
- `src/app/fonts/archivo-latin.woff2`
- `src/app/globals.css`
- `src/app/icon.svg`
- `src/app/layout.tsx`
- `src/components/buttons/Button.tsx`
- `src/components/cards/MachineCard.tsx`
- `src/components/forms/AuthForm.tsx`
- `src/components/forms/PasswordInput.tsx`
- `src/components/forms/ReviewForm.tsx`
- `src/components/forms/SupplierActivationPanel.tsx`
- `src/components/forms/SupplierSignup.tsx`
- `src/components/forms/VerifyEmail.tsx`
- `src/components/shared/AdvancedMediaViewer.tsx`
- `src/components/shared/AnalyticsWorkspace.tsx`
- `src/components/shared/Badge.tsx`
- `src/components/shared/DashboardShell.tsx`
- `src/components/shared/EmptyState.tsx`
- `src/components/shared/Footer.tsx`
- `src/components/shared/Header.tsx`
- `src/components/shared/HomeMarketplace.tsx`
- `src/components/shared/PageHeader.tsx`
- `src/components/shared/PrimaryNavigation.tsx`
- `src/components/shared/RatingStars.tsx`
- `src/components/shared/RfqDetailPanel.tsx`
- `src/components/shared/SalesOpportunityPanel.tsx`
- `src/components/shared/SalesWorkspace.tsx`
- `src/components/shared/SignOutButton.tsx`
- `src/components/shared/SubscriptionPaymentStatus.tsx`
- `src/components/shared/SupplierOnboarding.tsx`
- `docs/design-system.md` (this guide)
