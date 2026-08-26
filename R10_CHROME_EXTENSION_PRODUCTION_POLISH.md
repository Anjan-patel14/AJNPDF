# AJN PDF 3.1.0 R10 — Chrome Extension + Production Polish

R10 builds on the R9 consistency/logic/SEO baseline and adds a Chrome extension without changing the protected backend or live capability manifests.

## New product surface
- `/chrome-extension` product page.
- `/chrome-extension/privacy` dedicated extension disclosure.
- Homepage Chrome extension promo card.
- Chrome extension link in primary/mobile navigation and footer.
- Chrome extension pages added to the sitemap.

## Chrome extension
- Manifest V3.
- Four extension-native local image tools: Image to PDF, Reduce Image, Resize Image and Convert Image.
- 107 audited AJN PDF workflow search entries.
- No required permissions or host permissions.
- No page reading, browsing-history reading, content scripts or background worker.
- No remote runtime code.
- Five locales: English, Hindi, Telugu, Tamil and Kannada.
- Chrome Web Store listing draft and graphics included.

## Release safety
- Backend, package.json, package-lock.json and live backend-capability manifests remain protected.
- R9 production verifier is retained.
- New R10 verifier checks the extension package, manifest permissions, remote-code policy, 107-tool catalog, website integration, locale parity and store asset dimensions.
- The updater stages only R10 release-owned frontend/extension files and stops on any gate failure.
