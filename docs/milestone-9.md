# Milestone 9 — Machinery media

M9 adds an interactive gallery to the existing machinery detail and reuses the existing admin/supplier CatalogueManagement screen for upload/preview/delete. Existing image forms, catalogue routes, RFQs, auth and translation behavior remain in place. AloSkill references were not modified. Video playback, CAD conversion, AR and M10–M13 are excluded.

## Using the feature

Open Admin catalogue or Your machinery and choose **Manage media** for an existing machine. Admins manage all machines; suppliers need the existing owning account, approval and applicable active subscription. Upload:

- Self-contained, static GLB 2.0, up to 25 MB. No external resources, animations, skins, morph targets or compression extensions. Embed PNG/JPEG textures; each dimension at most 4096 pixels, up to 16 images/32 megapixels total.
- 2:1 JPEG/PNG equirectangular panorama, up to 10 MB, 512×256 through 8192×4096.
- At most five advanced assets per machine, including pending upload/removal records.

Public detail shows standard images first. Select a 3D model to rotate/zoom or a panorama to look around. Touch, mouse, keyboard arrows and labelled zoom/reset controls are available. Advanced files and Three.js load on selection. Standard images remain available; download/decoding/WebGL/context failures show image fallback and retry.

The VR button appears only in a secure browser context with supported immersive WebXR. Entering requires a click and compatible headset; failed entry keeps ordinary viewing usable. Unsupported VR never blocks machinery browsing. Physical headset operation remains unverified in the cloud environment.

## Storage and recovery

Configure `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_ACCESS_KEY` and the zone's `BUNNY_STORAGE_HOST` on the backend only. No storage key is exposed to the browser. No public CDN or pull zone is needed: catalogue files are served by a visibility-checked backend route, while existing RFQ attachments remain private. The server rechecks publication/subscription and verifies file size/hash for delivery.

Missing storage settings disable uploads with a clear message. UPLOADING reservations remain hidden; an interrupted upload can be removed after one minute. DELETING records stay hidden and allow retry if storage cleanup fails. Remove advanced media before deleting a machine; existing machinery without advanced files retains its delete workflow. See the server's [M9 documentation](https://github.com/Sumaiya-jafran/imet-server/blob/milestone-9/docs/milestone-9.md) for API and deployment details.

## Existing conventions and files

- `types/media.ts` and `lib/api/media.service.ts` use existing strict types and API conventions.
- `components/shared/MachineryMediaManagement.tsx` reuses Button, LoadingState and EmptyState, including existing dashboard layout/role gates.
- `MachineryMediaGallery.tsx` preserves MachineImage fallback and mounts the dynamic viewer only after selection.
- `AdvancedMediaViewer.tsx` uses the approved Three.js and its types, OrbitControls, GLTFLoader and native WebXR; no new React state framework or UI library.
- Machinery metadata uses the original name; the old malformed literal JSX title was corrected.

## Setup and validation

```bash
npm ci
npm run type-check
npm run lint
npm run build
npm start
```

Keep the existing backend API environment binding, start the backend after its two additive M9 migrations, and retain M0–M8 setup instructions. The approved `three`/`@types/three` dependencies are included in the lockfile.

Client locked installation, strict types, lint and production build passed. Backend regression suite: **64 tests passed**, zero failures/skips. Browser QA passed at **390/820/1440 pixels** for real GLB rendering, rendered rotation/zoom/reset, panorama mouse/touch, actual admin upload/preview/delete, lazy downloads, capability-gated VR, rejected session fallback, no-WebGL fallback and network retry. Storage responses were mocked and synthetic assets used; live Bunny and physical headset usability remain unverified until configured/device-tested. Normal server startup preserves storage-not-configured guidance and standard-image browsing.
