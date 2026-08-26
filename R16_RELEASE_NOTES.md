# AJN PDF R16 — Runtime Consistency & Production Closure

R16 is a targeted source-of-truth release built on the audited `ajnpdf/324` main line. It preserves the existing conversion engine behavior and closes the frontend/backend/deployment inconsistencies found during the August 16, 2026 audit.

## Fixed in R16

1. **CSP/backend URL parity** — Next.js CSP and the browser client now resolve the same backend URL candidates, including both supported environment variables and the Cloud Run fallback.
2. **Live upload limits** — server-assisted tools read `/ready` limits and enforce both per-file and combined upload limits. Protect, Unlock and Repair recheck readiness and limits immediately before upload.
3. **Capability snapshot** — source/public capability manifests are 78/78 with production fingerprint `101746815cd9a18f34453375b9dce720a06f07fe4eda9b2beccc4566a541a766`.
4. **Backend workflow verifier** — validates candidate-based `/ready` routing rather than the obsolete single-URL literal.
5. **Production setup** — no execution-policy mutation, no dependency version mutation during setup, immutable `npm ci`, current XPS/PyMuPDF behavior, and 30/30 MB Cloud Run defaults.
6. **Browser exception reporting** — captures exception description, class, source location and stack frames instead of only `Uncaught`.
7. **Merge outer dynamic boundary** — Merge is no longer wrapped in the generic `next/dynamic(..., { ssr:false })` mapping.
8. **One Merge engine** — the real Merge UI and browser-PDF acceptance share `src/lib/merge-pdf-browser.ts`.
9. **One Merge limit source** — 30 files, 50 MB per file, 150 MB total.
10. **UTF-8 Merge copy** — broken `â€¦` / `Â·` strings are removed.
11. **Redirect deduplication** — historical aliases are declared once and generated into direct/root redirects.
12. **107-route browser coverage** — the Edge audit smoke-checks every canonical public tool route; `AJN_BROWSER_FULL_ROUTE_AUDIT=1` expands responsive coverage across all 107.

## Backend/runtime protections retained

- 75 conversion specs and 78 total backend capabilities.
- Child-process job isolation and timeout termination.
- Input signature/content validation and output structural validation.
- Non-root Cloud Run runtime (`USER 10001`).
- Headless Calibre Qt configuration without disabling the WebEngine sandbox.
- XPS conversion through PyMuPDF; Ghostscript is not required for XPS.
- `.gcloudignore` prevents local venv/cache/database/report files entering Cloud Build source uploads.

## Release gates

The R16 production runner requires, in order: local `/ready` 75/75, backend smoke/capability/full/HTTP acceptance, 78/78 manifest verification, R16 consistency, full repository `npm run check`, 107-route built runtime verification, mandatory Microsoft Edge audit, R16-only Git commit/push, Cloud Run deployment, production 75/75 + HTTP acceptance, live backend contract, Vercel production deployment, live route checks and a final Cloud Run 75/75 recheck.

A source package cannot certify the external Cloud Run, Vercel or Edge gates by itself. R16 is production-closed only when the supplied runner completes all of those gates on the Windows production workstation.
