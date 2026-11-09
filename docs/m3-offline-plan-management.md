# M3 offline payments and plan management

Full audit, API/database details, modified-file inventory, exact verification results, security/transition rules and deployment checklist:

https://github.com/Sumaiya-jafran/imet-server/blob/feat/m3-offline-plan-management/docs/m3-offline-plan-management.md

- Admin plans now support safe Delete/Archive confirmations and backend explanations for referenced plans.
- Drag handles, keyboard sorting and Move up/down controls save ordering through an atomic version-checked API. dnd-kit is confined to the client admin page.
- Homepage visibility is independent of active/public availability and Free designation. Homepage and full pricing consume the appropriate ordered backend feed.
- **Record Offline Payment** searches existing suppliers, shows their status/current period, accepts received amount/method/time/private proof/admin notes, previews timing and confirms once.
- Standard paid renewals preserve the current term; an explicit administrator override can activate immediately with valid custom dates and a reason. Supplier approval remains separate.
- Owner payment/history pages show offline method, received date, reference and authorized receipt without internal notes. Supplier pages revalidate on window focus.
- Existing manual-submission settings/history remain labelled legacy; new public UI does not depend on supplier proof submission or a second admin approval step. Online gateway verification/automatic activation remains separate.

No new secrets. Real proof uploads require the existing private Cloudinary configuration. Run the additive migration and deploy the coordinated new backend/frontend before using these features. No production migration was run here.
