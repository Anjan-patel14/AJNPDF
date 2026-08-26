# AJN PDF 3.0.7 — Zero-Warning Production Cleanup

This release is based on the 3.0.6 R2 premium UX/i18n source and the real Windows production log from 2026-08-09.

## Fixed from the Windows log

- Fixed the `SignPdf.tsx` TypeScript nullability blocker by capturing a stable drawing-engine reference before processing.
- Removed the 297 reported unused import/variable warnings from the source.
- Centralized the 25 intentional runtime/blob/data image previews through `RuntimeImage`, with one documented optimizer exception instead of scattered `<img>` warnings.
- Migrated from deprecated `.eslintrc.json` usage to `eslint.config.mjs`.
- Removed `ESLINT_USE_FLAT_CONFIG=false` from the Windows-safe lint launcher.
- Lint now uses `--max-warnings 0`; any future warning fails production setup.
- Fixed a real Add Image to PDF bug: shared helper coordinates and requested width/height are now applied to the exported PDF.
- Kept the stronger `/ready` fix from 3.0.6 R2.
- Preserved five-language UI, premium mobile-first tools, /LibreOffice hardening, capability gating, SEO, analytics privacy and secret scanning.

## Validation performed in packaging environment

- 252 TypeScript/TSX files parse with zero syntax errors.
- TypeScript compiler unused-symbol diagnostics: zero.
- Python backend source compilation: pass.
- AJN SEO, Phase 1, production, trust, links, final UI, conversions, growth SEO, theme/analytics, brand/media, final production, accessibility, mobile-first, i18n, tool UX and secret guards: pass.
- Code-quality guard: pass.

## Final authoritative Windows gate

`SETUP_FULL_PRODUCTION.ps1` remains authoritative for npm install, Next.js 15.5.21 maintenance pin, eslint-config-next 15.5.20 alignment, zero-warning ESLint, semantic TypeScript, optimized Next build, real Windows conversion acceptance, runtime capability export, /health, /ready and /api/tools.
