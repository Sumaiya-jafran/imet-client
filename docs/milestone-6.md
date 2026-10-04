# Milestone 6 — Sales workspace

Use matching `milestone-6` branches in imet-client and imet-server. M6 retains the M5 RFQ/quote/conversation workflow and the existing UI redesign.

## Pages

| Audience                                                      | Routes                                                                                                                           |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Assigned supplier/manufacturer/independent seller/salesperson | `/dashboard/sales`, `/dashboard/sales/[id]`, `/dashboard/sales/history`, `/dashboard/sales/history/[id]`                         |
| Admin                                                         | `/dashboard/admin/sales`, `/dashboard/admin/sales/[id]`, `/dashboard/admin/sales/history`, `/dashboard/admin/sales/history/[id]` |
| Buyer                                                         | `/dashboard/purchases`, `/dashboard/purchases/[id]`                                                                              |

The dashboard navigation exposes the appropriate workspace. Pipeline counts and filters show only authorized opportunities. Cards keep RFQ, buyer, quantity, stage and last activity readable on small screens; search/date/stage/status filters, stable sorting and pagination support larger inboxes. Opportunity details link to the existing M5 lead/quote/conversation or admin RFQ page, with private notes and sales activity. Sales history and buyer purchases show accepted terms, exact totals, currency and record status.

## Confirmed workflow

Each M5 assigned recipient has one private opportunity: New → Qualified → Quoted → Negotiation → Won/Lost. Qualification and negotiation are private changes; quote submission and buyer/RFQ outcomes drive the other stages. Only the recipient and administrators can read notes/activity and that recipient's quotations. Competing recipients never see each other's opportunities.

After buyer acceptance, the winning recipient or admin manually records a sale. Recorded → Completed or Cancelled are final transitions. Cancellation requires a buyer-visible reason. Buyers can read only their own records and cannot edit sales or access private pipeline data. There is no payment collection.

Suppliers require an approved matching profile and active RFQ subscription for every mutation. Subscription expiry retains read-only history; controls are disabled with an explanation. Administrators and internal salespeople keep the existing exemptions. Actual authorization and version/transition checks happen on the backend, regardless of UI hints. Flagged RFQs pause changes. Existing M5 explicit assignment changes can reuse/reopen an opportunity on an open RFQ; arbitrary manual backward stage changes are rejected.

## Implementation and setup

New `SalesWorkspace`, `SalesOpportunityPanel`, `SaleRecordPanel` and `SalesNotesForm` reuse the current shell, role layouts, PageHeader, Button, Badge, loading/empty primitives, NextAuth, API client and React Hook Form/Zod. Types and services remain in their existing folders. No dependency, frontend credential or environment variable was added.

Apply the backend additive migration with `npm run db:generate` and `npm run db:deploy` against the intended database before starting. Existing M5 worker and provider setup still applies. Run client `npm run lint`, `npm run type-check`, `npm run build`, then `npm start`; follow the backend [M6 report](https://github.com/Sumaiya-jafran/imet-server/blob/milestone-6/docs/milestone-6.md) for API contracts, privacy, database guards and subscription enforcement.

Browser QA covers real M5 → M6 buyer/recipient/admin workflow, private notes, negotiation, manual recording, final statuses, read-only subscriptions, labels/validation, loading/empty/error/retry and layouts at 390, 820 and 1440 pixels. Full backend regressions and focused M6 lifecycle/migration tests are required before release.

M6 adds no M7–M13 features, new payment workflow or duplicate M5 system.
