# AJN PDF 3.0.9 — TypeScript Production Fix

## Fixed from the 3.0.8 Windows production run

- Restored the Images → PDF helper to draw each source image at x=0/y=0 using the image page dimensions.
- Preserved the Add Image to PDF helper's real x/y/width/height placement used by the visual editor.
- Fixed the PDF compression worker error boundary to safely derive a message from an unknown caught value.
- Preserved strict zero-warning ESLint, flat config, five-language UI, mobile-first layout, tool UX guardrails, capability gating, readiness checks,  and LibreOffice hardening.
- Release/version gates synchronized to 3.0.9.

## Windows authority

The target Windows production setup remains the authority for npm dependency installation, strict ESLint, semantic TypeScript checking, Next.js production build, Windows /LibreOffice acceptance, capability export and runtime health/readiness checks.
