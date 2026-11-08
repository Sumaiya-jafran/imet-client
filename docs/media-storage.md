# Signup and media storage update

Signup now occupies **70% of desktop width**, with full available width and padding on tablet/mobile. The signup-only side panel and nested width caps are removed; other auth pages retain their layout. Real Chromium verified 1440px, 768px and 390px without horizontal overflow.

All managed uploads now use the backend Cloudinary adapter, preserving the existing application access controls. Supplier image forms identify Cloudinary storage. To upload a machine video, save the machine, choose **Manage media**, then **Video — MP4/WebM (YouTube)**. Videos are capped at 25 MB and share the existing five advanced-media slots. Private YouTube videos require invitations from the channel owner; the player explains that requirement.

Full provider configuration, migration/deployment order, SQL CHECK-constraint migration and known limitations are documented in **imet-server/docs/media-storage.md**. Backend Cloudinary and marketplace-owned YouTube credentials must be configured before uploads become available. No new public frontend environment variable or UI dependency is needed.

Bunny code is retained as commented source. Existing managed Bunny assets must be copied and verified with the backend migration tool before switching production traffic. This work does not automatically transfer third-party URL images or bundled static site assets.

PASS: frontend lint, TypeScript and production build; backend 15 focused provider/media/RFQ/auth tests; real browser responsive signup/auth scenario. External provider APIs were mocked in automated tests. BLOCKED: real Cloudinary and YouTube operations, because credentials/channel authorization are absent in this workspace. No real video, image or email was posted externally.

Changed frontend files: src/app/auth/layout.tsx; src/app/globals.css; src/components/forms/SupplierSignup.tsx; SupplierProfileForm.tsx; src/app/(dashboardLayout)/dashboard/admin/catalogue/MachineForm.tsx; src/components/shared/MachineryMediaManagement.tsx; MachineryMediaGallery.tsx; new YouTubeVideo.tsx; src/lib/api/media.service.ts; src/types/media.ts; this guide.
