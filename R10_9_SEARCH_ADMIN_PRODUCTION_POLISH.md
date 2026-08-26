# AJN PDF 3.1.0 R10.9 — Search Appearance + Admin Diagnostics Production Polish

R10.9 builds on R10.8.1 without changing backend source, package.json, package-lock.json or live backend capability manifests.

## Implemented

- Completes Google ImageObject enrichment on both AJN Discover collection and detail output with `creditText`, `copyrightNotice`, `license` and `acquireLicensePage`.
- Adds `/image-licensing` with accurate copyright, attribution and reuse guidance rather than claiming a blanket Creative Commons/public-domain licence.
- Links image licensing from AJN Discover, footer, sitemap and the contact workflow.
- Improves `/admin/analytics` diagnostics for disabled analytics, rejected token, missing endpoint and rate-limit states.
- Improves `/admin/media` diagnostics for rejected media tokens and deployment mismatches across list/create/update/delete calls.
- Admin screens show the running backend URL and explain that tokens must be configured on that same backend deployment.
- Adds `CONFIGURE_AJN_ADMIN_LOCAL.ps1` to safely enable local analytics and create distinct cryptographically random analytics/media tokens without printing them.
- Keeps tokens in session storage on admin pages; no token is placed in URLs or public source.
- Extends the retained brand/media source verifier to require all four Google image licensing metadata fields.
- Adds a dedicated R10.9 source audit before ESLint, TypeScript, production build, runtime smoke, commit and push.

## External/deployment checks that cannot be truthfully shipped as source fixes

- Production admin secrets must be configured in the deployed backend environment and the backend restarted/redeployed.
- Search Console must recrawl the updated image pages before enhancement warnings can clear.
- React hydration console, real Core Web Vitals, real-file workflows, AdSense/CSP compatibility and Chrome Web Store review still require browser/provider/external validation.
