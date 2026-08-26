# AJN PDF 3.0.8 — Clean Production Fix

This release fixes the remaining strict-lint failures reported by the AJN PDF 3.0.7 Windows production run.

## Fixed
- Removed all 30 confirmed unused catch bindings from the affected tool workspaces.
- Restored `use client` as the first statement in Add Numbers, Crop PDF, Delete Pages, Flatten PDF and Watermark PDF.
- RuntimeImage now requires and renders an explicit `alt` attribute.
- Preserved strict ESLint `--max-warnings 0`; warnings are not globally disabled.
- Preserved the Sign PDF stable drawing-engine fix and Add Image exported placement/size fix.
- Scoped suppression of only two known EbookLib 0.18 deprecation/future warnings around `read_epub`.
- Optional Ghostscript absence is now informational while XPS/PostScript remain fail-closed.
- Version gates synchronized to 3.0.8.

## Production authority
A target Windows run must still complete lint, TypeScript, Next.js production build, /LibreOffice acceptance, health/readiness and live capability checks before release.
