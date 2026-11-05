# M-UI-01 — global branding implementation

The existing Tailwind CSS 4.2 `@theme` in `src/app/globals.css` remains the single source of truth. Next.js 16.3.8 App Router, layouts, routing, authentication, state, interactions, data fetching and backend code are unchanged. No dependencies were added.

## Semantic tokens

Approved colors remain primary #142F46, secondary/info #245B7A, accent #F28C28, accent-hover/warning #D97706, background #F4F6F8, surface #FFFFFF, foreground #17212B, muted #64748B, border #E2E8F0, success #16A34A and danger #DC2626. Existing inverse, muted-foreground, status-foreground and shadow tokens are preserved. Surface-muted, border-strong and subtle now name the existing derived neutral tones directly.

Components now consume `bg-primary`, `bg-surface`, `bg-background`, `text-foreground`, `text-muted-foreground`, `text-secondary`, `text-inverse`, `border-border`, `bg-accent` and semantic status utilities. Primary actions use dark foreground on accent, with accent-hover. On gray backgrounds, use muted-foreground for readable small text; official muted is appropriate on white surfaces.

Standard Tailwind slate/red/green/emerald/amber/blue palettes and white are no longer overridden. All their previous component usages have been migrated. Status tints use utilities such as `bg-danger/5`, `border-danger/25`, `text-danger-foreground`, preserving warning/success/error meaning. Shared surfaces use `shadow-surface`; existing helper classes reuse theme utilities with @apply where appropriate. Navigation geometry remains in the existing CSS; no parallel theme or new layout system is introduced.

Retained compatibility aliases: navy and navy-deep → primary; orange and orange-light → accent; orange-dark → accent-hover; font-display → font-sans. Current components use the semantic names directly, but these aliases remain for older consumers. The existing theme blocks use Tailwind static emission so compatibility custom properties remain available even after their last component usage is migrated. Browser checks verify their resolved colors. Standard Tailwind font size/weight scales are no longer overridden; components use the semantic scale.

## Typography

Inter is already configured in root layout through `next/font/local`, swap display, `--font-inter`, and variable weight range 400–700 (400/500/600/700 supported). This was retained because Google Fonts build-time downloads are blocked in the environment. Existing licensed Inter asset is reused; no additional font package or runtime request is needed. The Tailwind font-sans token resolves to that font. Non-Latin glyphs use system fallbacks.

Existing hero/page/section/card/body/nav/button/meta tokens are reused. Caption (12px) names the existing compact dock/table/eyebrow size. Duplicate standard-size overrides were removed; CSS font-size declarations now reference semantic tokens. Components use font-sans and supported font weights. Large decorative outlined letters retain responsive arbitrary sizes because they are ornamental, not content hierarchy.

## Migrated coverage

Homepage and category sections; desktop/mobile header and dock; footer; catalogue cards, filters, pagination and details; supplier profiles; pricing/subscriptions and existing payment-status UI; sign-in/signup/recovery/verification; dashboard shell, account, supplier and admin screens; RFQs, leads, sales, reviews, notifications, translations, analytics, service tickets; shared buttons, forms, inputs, badges, empty/loading/error states and media controls. Changes are CSS/class/style strings only.

Remaining exceptions: standalone favicon contains official literal colors because an external SVG cannot inherit document CSS. Dynamic inline styles remain only for the existing dock-wave position, review distribution widths and reveal delays; these implement existing interactions/data, not a second color system. Decorative homepage grid/strokes now derive translucent colors from the inverse token; their existing geometry is preserved. Font family declarations are centralized in globals.css and next/font.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed (all application routes compiled).
- `npm run type-check`: passed.
- `node --test tests/*.test.mjs`: 3 passed, none failed/skipped. Existing Node module-type warning remains; package configuration was not changed for this styling task.
- Syntax-tree comparison of all 73 changed TSX components found styling-string changes only; no non-style token changes.
- Source search finds no legacy palette utilities, old font names, old brand hex colors or standard palette overrides in the migrated frontend. Official literals remain only in @theme and the favicon.
- Chromium validation uses temporary read-only API fixtures outside the repositories. It covers populated homepage/categories/pricing, catalogue and machine details, supplier profile, sign-in/signup, subscription, and a fixture-authenticated dashboard. Public widths: 1440/1024/768/390/320px; dashboard widths: 1440/1024/768/390px. Checks verify Inter, official resolved tokens, compatibility aliases, populated catalogue rendering, document overflow and client exceptions.
- These are UI checks, not real backend/auth integration. The backend remains unavailable due to the previously diagnosed Prisma checksum download restriction. Physical iOS, software keyboard and exhaustive data-dependent modal/table states were not tested.

## Modified files

- `src/app/(dashboardLayout)/dashboard/account/AccountPanel.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/catalogue/CatalogueManagement.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/catalogue/CategoryManagement.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/catalogue/MachineForm.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/leads/page.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/subscriptions/PlanManagement.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/suppliers/SupplierManagement.tsx`
- `src/app/(dashboardLayout)/dashboard/admin/users/UserManagement.tsx`
- `src/app/(dashboardLayout)/dashboard/quotes/page.tsx`
- `src/app/(dashboardLayout)/dashboard/rfqs/RfqListPanel.tsx`
- `src/app/(dashboardLayout)/dashboard/supplier/SupplierDashboard.tsx`
- `src/app/(home)/page.tsx`
- `src/app/(withoutSidebarLayout)/machinery/[slug]/not-found.tsx`
- `src/app/(withoutSidebarLayout)/machinery/[slug]/page.tsx`
- `src/app/(withoutSidebarLayout)/machinery/error.tsx`
- `src/app/(withoutSidebarLayout)/machinery/page.tsx`
- `src/app/(withoutSidebarLayout)/suppliers/[id]/not-found.tsx`
- `src/app/(withoutSidebarLayout)/suppliers/[id]/page.tsx`
- `src/app/(withoutSidebarLayout)/suppliers/error.tsx`
- `src/app/(withoutSidebarLayout)/suppliers/page.tsx`
- `src/app/auth/layout.tsx`
- `src/app/error.tsx`
- `src/app/globals.css`
- `src/components/buttons/Button.tsx`
- `src/components/cards/MachineCard.tsx`
- `src/components/cards/MachineImage.tsx`
- `src/components/forms/AuthForm.tsx`
- `src/components/forms/PasswordInput.tsx`
- `src/components/forms/ProfileForm.tsx`
- `src/components/forms/ReviewForm.tsx`
- `src/components/forms/RfqForm.tsx`
- `src/components/forms/RfqQuoteForm.tsx`
- `src/components/forms/SalesNotesForm.tsx`
- `src/components/forms/ServiceTicketForm.tsx`
- `src/components/forms/SubscriptionPlanForm.tsx`
- `src/components/forms/SupplierActivationPanel.tsx`
- `src/components/forms/SupplierProfileForm.tsx`
- `src/components/forms/SupplierSignup.tsx`
- `src/components/forms/SupplierSubscriptionForm.tsx`
- `src/components/forms/TranslationForm.tsx`
- `src/components/forms/VerifyEmail.tsx`
- `src/components/shared/AdvancedMediaViewer.tsx`
- `src/components/shared/AnalyticsWorkspace.tsx`
- `src/components/shared/Badge.tsx`
- `src/components/shared/CatalogueImagePreview.tsx`
- `src/components/shared/DashboardShell.tsx`
- `src/components/shared/EmptyState.tsx`
- `src/components/shared/Footer.tsx`
- `src/components/shared/Header.tsx`
- `src/components/shared/HomeMarketplace.tsx`
- `src/components/shared/HomeSectionError.tsx`
- `src/components/shared/LanguageSelector.tsx`
- `src/components/shared/LoadingState.tsx`
- `src/components/shared/MachineryMediaGallery.tsx`
- `src/components/shared/MachineryMediaManagement.tsx`
- `src/components/shared/PageHeader.tsx`
- `src/components/shared/PrimaryNavigation.tsx`
- `src/components/shared/PublicReviews.tsx`
- `src/components/shared/PurchaseReviews.tsx`
- `src/components/shared/RatingStars.tsx`
- `src/components/shared/ReviewWorkspace.tsx`
- `src/components/shared/RfqDetailPanel.tsx`
- `src/components/shared/SaleRecordPanel.tsx`
- `src/components/shared/SalesOpportunityPanel.tsx`
- `src/components/shared/SalesWorkspace.tsx`
- `src/components/shared/ServiceTicketDetailPanel.tsx`
- `src/components/shared/ServiceTicketWorkspace.tsx`
- `src/components/shared/SignOutButton.tsx`
- `src/components/shared/SubscriptionPaymentStatus.tsx`
- `src/components/shared/SupplierAssetFile.tsx`
- `src/components/shared/SupplierOnboarding.tsx`
- `src/components/shared/SystemStatus.tsx`
- `src/components/shared/TranslatedText.tsx`
- `src/components/shared/TranslationWorkspace.tsx`
- `docs/design-system.md` (this guide)
