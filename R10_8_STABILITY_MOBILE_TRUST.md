# AJN PDF 3.1.0 — R10.8 Stability, Mobile Performance & Trust

R10.8 is a focused production-hardening release. It does not add accounts, cloud file history, a public developer API, or a native mobile app. Those remain later roadmap items.

## Homepage and hydration stability
- Removed the duplicate mobile + desktop hero render path from the homepage.
- One responsive Hero now serves mobile and desktop.
- One primary search field now serves mobile and desktop.
- Removed the pre-hydration theme mutation script and renders deterministic light-theme HTML.
- Removed the global homepage API preconnect that was injected even when initial page work did not need the API.
- Removed the old secondary AJN PDF hero tagline from active UI copy.

## Mobile performance
- Tool discovery progressively renders 18 workflows initially and 18 more per request.
- Search and filters still evaluate the complete public workflow registry before display slicing.
- Off-screen tool cards use `content-visibility: auto` with an intrinsic-size fallback.
- Conversion artwork priority is limited to the first visible cards.
- Ad zones reserve dimensions and avoid scroll-anchor participation to reduce layout movement.

## Real processing transparency and limits
- Every shared tool workspace displays its processing mode and current limits near the tool title.
- Local tools use the existing frontend production policy for max files and max file size.
- Server tools show current documented defaults and query the live `/ready` endpoint to override file, total-upload and timeout values when the service is reachable.
- The readiness client now exposes max file, total upload, concurrency, timeout and conversion availability data.
- The status UI surfaces those live service facts when available and auto-refreshes the readiness check every 30 seconds while `/status` is open.

Current packaged server defaults documented by the existing AJN PDF 3.1.0 backend are 75 MB per file, 150 MB total upload, 300 PDF pages, 80 megapixels per image, 500 MB generated output and a 300-second processing timeout. A live deployment may be configured lower; the live tool/status response takes precedence where exposed.

## New information pages
- `/limits` explains upload, page/image, output, timeout and fair-use behavior.
- `/` documents supported  languages, scan-quality guidance and accuracy limitations without fabricated accuracy percentages.
- Footer and sitemap include both pages.

## Security headers
- Added a production CSP compatible with the current first-party site plus configured Google analytics/advertising origins.
- HSTS is enabled by default in production and can be disabled explicitly with `AJN_ENABLE_HSTS=false`.
- HSTS preload remains opt-in through `AJN_HSTS_PRELOAD=true` because preload has external operational consequences.
- Retains nosniff, referrer, permissions, frame and cross-origin headers.
- Trusted Types is intentionally not forced yet; it requires browser QA with Next.js, ads and analytics before activation.

## SEO and accessibility
- Tool metadata descriptions now incorporate tool-specific name, use case and benefit inputs rather than one generic description sentence.
- Shared UI dictionaries now contain 510 matching keys in English, Hindi, Telugu, Tamil and Kannada.
- Contrast on selected small labels was strengthened.
- Existing keyboard, reduced-motion and accessibility guardrails remain.

## Protected scope
The updater does not replace backend source, `package.json`, `package-lock.json`, `src/generated/backend-capabilities.json`, or `public/backend-capabilities.json`. It verifies the live repository capability manifest before build and push.

## Required manual QA after applying
- Open the production build in Chrome mobile/desktop and confirm there is one hero and one search.
- Confirm no React hydration error appears in the console.
- Run mobile PageSpeed/Lighthouse and measure LCP, INP/interaction responsiveness and CLS with ads enabled under realistic conditions.
- Test CSP with consent, AdSense, Analytics and representative local/server tools.
- Test representative real files for PDF, image, Office and security workflows.
- Verify `/status`, `/limits` and `/` against the deployed service.

## Brand-channel cleanup
- Product footer no longer presents personal Instagram/YouTube accounts as AJN PDF brand channels.
- The developer page can keep confirmed personal developer links.
- Dedicated AJN PDF social URLs must only be added after the real brand accounts are created and confirmed; no placeholder handles are published.
