# AJN PDF 3.1.0 — Backend-Hardened Production Release

## Problems addressed

- Generic Processing Error could occur after optimistic `/health` checks or missing capability data.
- Uploads could be duplicated into Python memory.
- Many formats relied too heavily on filename extensions.
- Thread-based timeouts could leave converters running after the HTTP timeout.
- Large PDF/image workloads could exhaust memory.
- Existing full acceptance tested converter functions directly but not the real FastAPI request path.
- Analytics write failures could mask the actual conversion result.
- Encrypted PDF and Repair PDF required different validation behavior.

## Implemented

- `/ready` + exact live capability fail-closed frontend gating.
- Streaming uploads, combined limits and early Content-Length protection.
- Format-aware input validation and output validation.
- Process-isolated killable workers for conversion, Protect, Unlock, Repair and Compress.
- Disk admission and PDF/image/frame/output workload ceilings.
- Page-by-page PDF rendering for normal image/PPT/ workflows.
- Request-reference propagation into localized frontend errors.
- Best-effort analytics that cannot alter tool success/failure.
- Direct converter acceptance plus live HTTP acceptance wired into Windows setup.
- Five-language backend status/workflow copy retained.

## Source verification completed

Python backend compilation passes. Source verifiers for SEO/ads, Phase 1, production routes, trust UI, links, final UI, conversions/, SEO growth, theme/analytics, brand/media, final production, accessibility, mobile-first, i18n, tool UX, code quality, backend workflow and secret scanning pass on the clean source.

## Windows authority

The Windows production setup remains authoritative for native Python dependencies, LibreOffice//Calibre execution, capability export, direct real conversion outputs, live HTTP acceptance, npm install/security maintenance, zero-warning ESLint, TypeScript and optimized Next.js build.
