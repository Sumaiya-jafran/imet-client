# M3 admin catalogue completion

The existing admin catalogue now supports real JPEG/PNG upload before machine creation, authenticated previews, image descriptions and ordering, atomic create/edit attachment, and safe image retirement on replacement/removal/deletion. Legacy HTTPS URL images continue to work. There are no new dependencies or moved routes.

The shared Bunny transport and existing file-validation/storage lifecycle patterns are reused. Backend upload metadata owns staged files and gates public delivery through the existing publication/supplier/subscription rules. Managed images use canonical API-relative paths; the public image component resolves them through the existing backend API base. Private previews fetch bytes with the administrator's bearer token and use a revoked-on-unmount blob URL; credentials are never placed in image URLs.

Admins can archive published machines as private drafts with confirmation and stale-version protection. Draft/archive preserves images and specifications. Publication messaging now distinguishes stored status from actual supplier eligibility. Existing advanced-media, supplier ownership and linked-history deletion rules remain in force.

Forms retain typed React Hook Form/Zod behavior and now associate backend field errors with their controls. Category edits capture the loaded updatedAt version and refuse concurrent changes rather than overwriting them. Retry/loading/disabled/empty/error states are retained; unavailable storage leaves URL editing usable.

## Setup

Deploy the matching server changes and both additive migrations first, then deploy this client. The backend category update contract now requires its returned updatedAt timestamp. Configure the existing BUNNY_STORAGE_ZONE, BUNNY_STORAGE_ACCESS_KEY and regional BUNNY_STORAGE_HOST only in the backend and worker environments. Run the new `worker:catalogue:prod` server process for retryable deletion and abandoned-upload cleanup. Full architecture/API/limits/deployment instructions are in `imet-server/docs/m3-catalogue-completion.md`.

## Validation

Client lint, strict TypeScript and production build passed. Backend regression suite: 106 passing tests, plus shared transport checks. Chromium verified the actual API/database create/edit/upload/preview/order/publish/archive/remove/delete journey, storage outage/retry, stale-record recovery, form feedback and the editor at 390/820/1440 pixels without overflow.

Storage QA used an isolated Bunny emulator and actual PNG bytes decoded in the browser. Real live Bunny delivery still requires the owner's storage credentials. Test hooks/credentials are not application configuration. Supplier logo/document and supplier-side upload authoring gaps remain in M4 scope.
