# AJN PDF R10 — Chrome Web Store submission guide

## Package to upload
Use `AJN-PDF-CHROME-EXTENSION-1.0.0.zip`. `manifest.json` is at the ZIP root.

## Current architecture
- Manifest V3.
- No required permissions.
- No host permissions.
- No background service worker.
- No content scripts.
- No remote JavaScript or runtime code loading.
- Four extension-native local image tools.
- Audited search across 107 AJN PDF public workflows.
- Five extension UI locales: English, Hindi, Telugu, Tamil and Kannada.

## Before submission
1. Load the unpacked extension in Chrome and test all four local quick actions with real images.
2. Verify generated PDF/image downloads open correctly.
3. Confirm the extension popup and workspace match the store screenshots/listing copy.
4. Capture an actual 1280x800 or 640x400 screenshot from the loaded extension for final listing use.
5. Use `https://www.ajnpdf.com/chrome-extension/privacy` as the extension privacy-policy URL after R10 is deployed.
6. In the Chrome Web Store privacy fields, keep the single-purpose statement narrow and justify only capabilities actually present.
7. Do not add future permissions "just in case". Add new permissions only when a real feature needs them.
8. Upload the ZIP in the Chrome Developer Dashboard, complete Store Listing, Privacy, Distribution and test instructions if requested, then submit for review.

## Important policy choices
The extension is not a link-only launcher. It implements Image to PDF, Reduce Image, Resize Image and Convert Image directly in extension pages. This avoids relying solely on website conversion links and gives the extension independent user value.

## After Web Store approval
Set a public Chrome Web Store install URL in the website UI in a follow-up release and replace the local-test CTA with the store-install CTA. Do not claim the extension is available in the Chrome Web Store before the listing is approved and published.
