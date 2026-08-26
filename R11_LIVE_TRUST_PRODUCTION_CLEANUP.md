# AJN PDF 3.1.0 R11 — Live Trust + Production Cleanup

R11 is a focused production-hardening release built on R10.9. It does not redesign the product or change the 107-workflow contract. It aligns the current source with the live canonical host, strengthens truthful processing copy, cleans stale search routes, upgrades homepage SEO targeting and adds an automated post-deployment audit.

## Implemented in R11

- Homepage H1 changed to **Free PDF Tools Online - Convert, Merge, Compress, Edit & **.
- Homepage SEO title changed to **Free PDF Tools Online - Convert, Merge, Compress & Edit | AJN PDF**.
- Homepage meta/Open Graph/Twitter description aligned to the same truthful task-oriented message.
- Removed the old secondary hero line "Fast, clear file workflows." in all five locales.
- Updated English, Hindi, Telugu, Tamil and Kannada homepage H1 copy while preserving the 511-key locale contract.
- Canonical host locked to `https://www.ajnpdf.com` to match the observed production redirect direction.
- Bare `ajnpdf.com` permanently redirects to `www.ajnpdf.com`.
- Extension homepage/tool links now use the same canonical `www` host.
- Added permanent redirects for stale `/tools/smart-read`, `/tools/pdf-ppt` and `/tools/-searchable` routes.
- Kept existing canonical redirects such as `pdf-jpg -> pdf-to-jpg` and `json-pdf -> json-to-pdf`.
- Changed temporary-processing copy from absolute deletion language to "scheduled for cleanup" wording across FAQ, transparency, tool editorial and tool policy surfaces.
- Tool WebApplication schema now references Anjan as author, AJN Studio as publisher, and AJN PDF as brand.
- Preserved build-time capability filtering so unavailable backend workflows are excluded from public SSG, sitemap and indexing.
- Preserved admin `noindex` + `no-store`, chunk-reload recovery, ImageObject licensing fields, `/image-licensing`, `/limits`, `/`, five-language UI and the light-only public theme.
- Added `scripts/verify-r11-live-trust.mjs` for source-level production/trust checks.
- Added `scripts/audit-r11-live-site.mjs` for real post-deployment HTTP, redirect, stale-copy, sitemap, robots, admin-header and security-header checks.
- Rebuilt the Chrome extension ZIP so the packaged extension uses the canonical `www` host.
- Updated the backend canonical origin default and user-agent URL while preserving conversion/security/media logic.

## What R11 intentionally does not fake

The following cannot be truthfully completed by a source ZIP alone:

- Google Search Console recrawl and index-state changes.
- Field Core Web Vitals from real users.
- Google AdSense/CMP approval and ad inventory.
- Chrome Web Store review/approval.
- Production admin secret values.
- A managed durable production database/object store and its credentials.
- Real-file acceptance for every user-owned file combination.

The Windows updater runs source gates, capability verification, lint, TypeScript, optimized build, built-runtime smoke, Git staging safety, commit and push. After deployment, run the included live audit script and complete the provider-side checklist.
