# AJN PDF 3.0.4 production-hardening report

This source update closes implementation-level blockers from the AJN PDF 3.0.3 pending audit while keeping deployment-only work explicit.

## Implemented in source

- Windows LibreOffice resolution accepts `soffice.exe` only, not `soffice.COM`.
- LibreOffice conversions use isolated profiles, bounded timeouts, process-tree cleanup, retry, stable-output waiting and PDF validation.
- Searchable-PDF  no longer depends on 's optional `pdf` config file. It explicitly enables PDF rendering, prefers a normal output file, validates the generated one-page PDF, and falls back to binary stdout.
-  work files are cleaned and the full acceptance test now checks for /LibreOffice temporary leftovers, validates output signatures/containers and fails when an available tool has no generated fixture (except explicitly documented binary-format/manual cases).
- `/api/tools` now represents all 78 backend-dependent capabilities: 75 conversion/ workflows plus Protect, Unlock and Repair.
- Capability export schema v2 includes counts, backend version, generation time and a SHA-256 capability fingerprint.
- Production frontend builds fail closed until a current machine-specific capability manifest exists.
- Public navigation, global search, related tools, home counts and tool workspaces use dependency-aware build availability rather than source registration alone.
- Legacy mega-menu conversion aliases were changed to canonical tool routes and unavailable capability links are filtered out.
- Search modal has dialog semantics, Escape handling, tab-focus containment and accessible control labels.
- File dropzone supports keyboard activation and an accessible name; progress UI exposes live/progressbar semantics.
- Dark compatibility includes translucent `bg-white/95` legacy surfaces and preserves reduced-motion/high-contrast behavior.
- ODS → PDF and ODP → PDF are now real dependency-aware LibreOffice conversions, closing missing OpenDocument coverage.
- Setup validates `/health`, `/ready`, `/api/tools`, exact LibreOffice executable selection, capability export, no remaining `soffice` process, and the final frontend build.
- Windows dependency cleanup retries locked `node_modules`/`.next` removal before failing with an actionable message, and it stops only AJN PDF/port-specific Node processes instead of terminating unrelated Node workloads.
- Runtime SQLite backup uses SQLite's online backup API; restore performs integrity checks.
- Source secret/runtime-artifact scanning and a clean production packaging script are included.

## Intentionally not faked

The source package cannot by itself prove the user's Windows installation, real browser/device rendering, production DNS/TLS/CORS, cloud resource limits, external monitoring, backup restore on the production host, Search Console indexing, Google's CMP/AdSense review, or real Core Web Vitals. Those remain launch gates and must be verified in the target environment after the 3.0.4 Windows acceptance run passes.

Ghostscript-backed XPS/PostScript/EPS workflows remain dependency-gated until licensing and installation are deliberately approved. The build hides dependency-unavailable server tools instead of advertising them as working.

## R3 Windows lint-launcher hardening
- Replaced direct `npx.cmd` spawning with `node.exe node_modules/eslint/bin/eslint.js`.
- Preserves ESLint 9 legacy `.eslintrc` mode via `ESLINT_USE_FLAT_CONFIG=false`.
- Surfaces child-process launch errors instead of silently returning exit code 1.
