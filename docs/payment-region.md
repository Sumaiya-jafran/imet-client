# Supplier signup payment region

Signup includes exactly three clickable, keyboard-accessible radio cards: **Bangladesh**, **China**, **Other Countries**. Their stored values are BANGLADESH, CHINA and INTERNATIONAL. There is no default. Selection is required for a new supplier, survives editing the earlier account step and is submitted as `profile.paymentRegion` through the existing JSON/multipart registration API.

The existing business-country field is unchanged. A Bangladesh business may explicitly choose CHINA or INTERNATIONAL; no region is inferred. The UI uses existing Tailwind/typography tokens and adds no dependency, dropdown, gateway integration, credential or payment-processing behavior.

Existing supplier response types permit NULL for unknown preferences. Existing profile updates remain compatible; the owner form displays the preference read-only under existing edit permissions, and pending/admin forms retain unspecified legacy values safely. The backend enum/nullable migration preserves existing records without a default/backfill while requiring new registrations to select explicitly.

Changed frontend files: PaymentRegionField.tsx; config/payment-regions.ts; SupplierProfileForm.tsx; SupplierSignup.tsx; lib/schema-validations/supplier.schema.ts; lib/api/payment.service.ts (registration type only); types/supplier.ts; tests/payment-region.test.mjs; this document.

Validation: **PASS** 4 frontend tests, lint, TypeScript, production build; **PASS** backend 21 relevant tests; **PASS** real Chromium form checks (all choices, no default, required validation, keyboard/focus, step persistence, responsive widths, final registration/database enum) plus existing signup/files/verification/login flow. **PASS** preservation of 3 controlled legacy suppliers with NULL regions after the additive migration.

Standard Prisma CLI validation/generation/deployment were **BLOCKED** by HTTP 403 on the schema-engine checksum download. Official matching bundled WASM schema validation/client generation succeeded, and SQL migration verification ran only on an isolated local audit database. No production migration was run and no verification safeguards were disabled.

Full backend findings, API example, migration strategy, exact test commands, modified files and deployment instructions are in **imet-server/docs/payment-region.md**. Apply the migration before deployment and coordinate frontend/API rollout: older registration clients without this required field will receive 422. No new environment variables are needed. Future payment routing is not implemented here.
