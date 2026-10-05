# M4 supplier completion UI

Supplier applications and admin profile editing now support real company-logo and private verification-document uploads. Existing HTTPS references remain editable for compatibility. Managed documents download through authenticated backend requests; approved owners can read documents but only admins change verification fields. Owners may replace their company logo.

The supplier machinery workspace uses the existing catalogue image uploader with supplier-scoped authorization. It displays listing usage, disables new listings when ineligible or at the current cap and applies assigned image/specification limits in the editor. Backend checks remain authoritative. Public profiles display managed logos without exposing document or contact fields.

Application, review, plan and term forms retain existing routes/services and show field errors, upload progress, storage availability and retry states. Requests have bounded deadlines. Subscription prices, durations and limits remain administrator-defined, and activation/renewal stays manual.

Deploy the matching M4 server migration and configure existing Bunny credentials **only on the server**. No new frontend secret or dependency is required. Private document downloads must not be replaced with public Bunny URLs. Missing storage configuration is shown explicitly by the upload controls.

Browser verification covers registered-user application, logo/PDF upload and authenticated downloads; admin rejection validation, approval, plan creation and activation; entitled supplier image upload, publication and limits; public media delivery; owner logo replacement and expired-term behavior. Application layouts are checked at mobile (390), tablet (820) and desktop (1440) widths. Production build, strict TypeScript and ESLint checks are required.
