# Dashboard navigation and sign-out

The shared dashboard header now offers Sign out on every dashboard screen. It reuses the existing logout API and NextAuth sign-out flow to revoke the current backend session, clear the browser session and return to sign-in. Expired or already-revoked sessions can still clear local authentication. Temporary backend failures show a retryable error. The existing Account-page Sign out and Sign out everywhere controls are preserved.

The shared sidebar now keeps icon sizes and label columns consistent, centers collapsed controls, and separates the scrollable navigation from the fixed brand/marketplace/collapse controls. Long role menus scroll inside a viewport-height sidebar. Mobile drawers use the same navigation spacing, preserve Escape/focus behavior and keep the marketplace link reachable.

Validation: production build, strict TypeScript and ESLint. Chromium verification checks the dashboard routes exposed to admin, buyer, local supplier, international manufacturer, independent seller and salesperson accounts; fixed icon alignment, collapsed centering, short-viewport scrolling, mobile/tablet drawers, keyboard dismissal/focus restoration, logout revocation/local cleanup and failure/retry. Backend business logic and API contracts are unchanged.
