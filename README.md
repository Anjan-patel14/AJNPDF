# AJN PDF 3.1.0

AJN PDF is a Next.js + FastAPI document platform for PDF, image, Office, eBook and structured-data workflows.

## R11 live-trust production focus

R11 keeps the hardened backend processing path and adds live-trust cleanup: one canonical `www` host, stronger homepage search intent, truthful temporary-processing language, legacy-route redirects, aligned Person/Organization/Product schema, five-locale homepage copy, and deployment audits that fail visibly instead of claiming provider-side success.

The backend path remains hardened: Public server-assisted tools now fail closed unless `/ready` is healthy and the exact live capability is available. Uploads stream to disk, file contents are structurally validated, conversions run in killable worker processes, workloads are bounded, generated outputs are validated, request references are preserved, and temporary files are cleaned after delivery.

The Windows production gate now runs both the direct converter acceptance suite and a live HTTP acceptance suite through `/api/convert/{tool_id}` plus Protect, Unlock, Repair and Compress before the frontend build is allowed to pass.

## Current product experience

- R11 retains the R10.8 stability/mobile/trust pass: one responsive homepage hero, one primary search, progressive tool rendering and built-production SSR/header smoke before release commit.
- Per-tool processing transparency with concrete policy limits and live `/ready` overrides for server workflows.
- Live `/status` readiness view with 30-second refresh plus dedicated `/limits` and `/` information pages.
- Production security header configuration including CSP and HSTS controls, with Trusted Types intentionally deferred until compatibility QA.
- 74 live conversion/ icon assets, 75 catalog assets and 5 source sheets integrated into the 107-tool experience.
- Five UI languages with 511 matching shared translation keys.
- R7 polished light-only homepage with compact professional horizontal tool cards.
- Lightweight source-driven vector icon system covering all 107 production tools without repeated card artwork.
- Five UI languages: English, Hindi, Telugu, Tamil and Kannada.
- Unified Choose File → Customize → Process → Download tool workflow.
- Direct visual placement for Add Text, Add Image and Sign PDF.
- Strict zero-warning ESLint and semantic TypeScript build gates.
- Capability-aware backend tools and hardened `/ready` checks.
-  languages installed locally by Windows setup.

## R11 release contract

- Canonical public host: `https://www.ajnpdf.com`.
- Bare-domain requests redirect permanently to the `www` host.
- Homepage H1/metadata target free PDF tools, conversion, merge, compression, editing and  without removing the supporting 100+ workflow message.
- Browser-local and server-assisted tools use separate, truthful processing language.
- Admin analytics/media pages remain `noindex` and `no-store`.
- Build-time capability filtering prevents known unavailable backend tools from being advertised as available.
- Search Console recrawl, field Core Web Vitals, AdSense/CMP approval, Chrome Web Store review, production secrets and managed durable storage are external gates and are never fabricated by the package.

## Local Windows setup

Run `SETUP_FULL_PRODUCTION.ps1`. It verifies converter dependencies,  data, backend readiness, capability availability, direct acceptance, live HTTP acceptance, frontend dependencies, security-maintenance versions, all source guards, zero-warning lint, TypeScript and the optimized Next.js production build.

Success marker:

`AJN PDF PRODUCTION SETUP PASSED`

## Local URLs

- Website: `http://localhost:3000`
- Backend health: `http://127.0.0.1:8000/health`
- Backend readiness: `http://127.0.0.1:8000/ready`
- Live capability registry: `http://127.0.0.1:8000/api/tools`
- API documentation: `http://127.0.0.1:8000/docs`

## Dependency-aware tools

Ghostscript is not installed automatically. Ghostscript/XPS/PostScript-dependent capabilities stay unavailable until an appropriately licensed engine is configured. This does not make the other tools unhealthy.

## Deployment gates after local PASS

Public hosting, DNS/TLS/CORS, real persistent storage and restore drills, monitoring, physical-device/browser/screen-reader QA, genuine MSG/XPS fixtures, live URL-to-PDF network acceptance, Search Console/Core Web Vitals, CMP and AdSense review remain deployment/manual gates.

See `BACKEND_WORKFLOW_3_1_0.md`, `IMPLEMENTATION_REPORT_3_1_0.md` and `PRODUCTION_DEPLOYMENT_GUIDE.md`.
