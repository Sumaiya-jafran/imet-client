# M2 public catalogue completion

This batch completes the public catalogue usability and resilience gaps from the M1–M4 audit. It retains the existing App Router pages, typed catalogue service, Tailwind tokens, shared cards, and backend projections. No dependencies, migrations, API contracts, authentication flows, supplier management, or subscription rules change.

## Public flow

- Machinery discovery uses the existing published/entitled catalogue API. Search supports names, descriptions, manufacturers and models; category and supplier filters combine with search. Pagination preserves filters and searches start at page one.
- The responsive catalogue shows result ranges and individually removable filters. Unknown categories and zero-result searches have recovery controls. An out-of-range page returns to page one without discarding filters.
- A failed category lookup leaves machinery search available, explains the degraded filter, preserves a selected category during submission, and offers retry. Existing route loading and error boundaries handle slow/unavailable catalogue requests; retry retains the current URL.
- Cards have machine-specific accessible link names, reliable image loading/fallbacks and aligned quote-only footers.
- Public details have a compact image gallery with native keyboard-operable thumbnail buttons, selected-image status, correct alt text and recovery by selecting another photo after an image fails. Gallery state is scoped to each machine. Missing imagery/specifications and unavailable machines have explicit states.
- Existing translations, public reviews, advanced-media selection/retry/fallback and after-sales links remain integrated. Request-a-quote links keep the existing machine-specific destination through authentication into the RFQ form.

## Scope boundaries

Machinery authoring and ordinary image/file uploads are M3/M4 gaps. They are not implemented in this M2-only batch. Existing M9 advanced-media upload/storage behavior is retained. Public supplier management, private contact gating and supplier subscription eligibility continue to use their existing backend implementations. Machine pricing remains “Price on request”; no private contact, quotation or payment fields are added to catalogue responses.

## Validation

- Client lint, strict TypeScript and production build.
- Server lint/typecheck and complete existing regression suite, plus catalogue discovery tests covering manufacturer/model/name search, whitespace normalization, supplier isolation and malformed/duplicate supplier filters.
- Chromium against the actual API and PostgreSQL using isolated, cleaned-up fixtures: 14 published machines, a draft, an approved subscribed supplier, and a no-image/no-specification machine.
- Browser journeys at 390, 820 and 1440 pixels: search/category/supplier combination, pagination, remove filters, invalid/empty/out-of-range results, keyboard photo selection, failed-image recovery, details/specifications, draft/missing/expired-supplier rejection, anonymous sign-in return and actual RFQ machine prefill.
- Isolated test-process fault injection validates category-only outages, preserved filters during degraded search, category retry, full catalogue outage/retry and streamed loading. Fault injection is outside the repository and removed from normal app startup after verification.

Visual screenshots and the browser test harness are recorded in the task's `m2-catalogue` artifacts. Test machinery images are intercepted fixtures, not persisted catalogue examples or uploaded production assets.
