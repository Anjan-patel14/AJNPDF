# AJN PDF 3.0.5 production implementation report

## Source changes

- Mobile homepage is tool-first: public tools appear directly below the fixed navigation.
- Added mobile sticky search and category filtering.
- Added compact two-column mobile tool cards with large tap targets and reduced visual noise.
- Desktop/tablet hero flow is preserved.
- Removed eager priority loading from the desktop-only hero artwork to avoid unnecessary mobile preload.
- Added `verify:mobile-first` to the production verification chain.
- Fixed the processing-animation hook dependency warning using a stable module-level status sequence.
- Version synchronized to 3.0.5 across package, backend and Windows setup checks.
- Setup opens only the main website after success instead of flooding the browser with QA tabs.

## Existing production protections retained

- 78 backend capability records with build-time fail-closed manifest validation.
- /LibreOffice Windows hardening, capability export, backend smoke tests and full acceptance suite.
- Consent-aware AdSense, security headers, privacy-minimized analytics, source secret scan and clean packaging.
- Accessibility guardrails, reduced motion, dark/light theme, SEO schemas and canonical routes.

## Deployment-only gates

Source cannot prove public DNS/TLS/backend hosting, persistent production storage, backup restore, external monitoring, Search Console indexing, live Core Web Vitals, CMP/AdSense approval, or physical-device QA. These remain post-build production gates.
