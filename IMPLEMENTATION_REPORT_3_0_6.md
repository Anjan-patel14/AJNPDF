# AJN PDF 3.0.6 — Premium Tool UX + Five-Language Production Update

## Release scope

This release combines three production requirements into one source tree:

1. Premium AJN visual system with mobile-first tool discovery.
2. Unified, user-friendly tool workflow and customization behavior.
3. Five-language UI foundation: English, Hindi, Telugu, Tamil and Kannada.

## Major implementation changes

### Premium UI system
- Reusable premium blue/red wave, ring, dot and glow background layers.
- Unified premium cards, borders, shadows and responsive spacing.
- Mobile-first home experience: search, filters and tool cards are prioritized before marketing content.
- Compact mobile workspaces and dark-mode-compatible semantic surfaces.

### Tool UX and customization
- Shared workflow: Upload → Customize → Process → Download.
- Shared uploader now supports click, keyboard, input selection and true `dataTransfer.files` drag/drop.
- Legacy drag-event-to-input-event casts removed.
- Old developer wording such as Synthesis, Calibration, Buffer, Purge, Prune and Inject removed from public tool UI.
- Fake email/download-link delivery removed.
- Fake precise server-conversion percentages replaced with honest stage-based progress.
- ZIP extractor limited to ZIP with archive entry and expanded-size safety limits.
- Watermark PDF copy aligned to its real text-watermark implementation and unrelated metadata call removed.
- Add Text: direct page positioning; coordinates remain Advanced.
- Add Image: direct drag/resize, opacity, rotation, page preview and respected output filename.
- Sign PDF: Draw / Type / Upload modes plus direct drag/resize page placement and respected output filename.

### Five-language UI foundation
Supported UI languages:
- English (`en`)
- हिन्दी / Hindi (`hi`)
- తెలుగు / Telugu (`te`)
- தமிழ் / Tamil (`ta`)
- ಕನ್ನಡ / Kannada (`kn`)

Implementation:
- One global `LanguageProvider`.
- Language stored as `ajn-language`.
- Instant language changes without intentionally clearing selected files or tool settings.
- 364 matching shared translation keys in every language.
- Tool names/descriptions/aliases localized separately from stable tool IDs/routes.
- Shared navigation, search, upload, customization, processing, result, error, consent and accessibility wording translated.
- Legacy-screen compatibility bridge translates known older UI phrases while those screens are progressively migrated to direct keys.
- Technical format identifiers such as PDF, JPG, PNG, DOCX, XLSX, PPTX, MB and DPI remain recognizable.

### Backend production hardening
- Backend version synchronized to 3.0.6.
- `/ready` is no longer an alias of `/health`.
- Readiness checks SQLite integrity, writable media storage, writable temporary area, free disk and conversion registry state.
- `AJN_MIN_FREE_DISK_MB=512` is generated in local production setup.
- Backend HTTP errors include stable machine-readable error codes.
- Frontend server-conversion/security tools translate stable backend error codes into friendly UI messages.
- Optional dependency-gated tools remain fail-closed instead of taking the whole service down.

### Dependency maintenance gate
The clean package preserves the previously installable baseline lock so `npm ci` is deterministic. The Windows production setup then:
1. runs `npm ci`,
2. installs exact `next@15.5.21`,
3. aligns `eslint-config-next@15.5.20`,
4. verifies both installed versions,
5. runs the complete AJN verification/lint/typecheck/build gate.

This two-stage approach is intentional because the artifact-building environment could not retrieve the maintenance packages from its package mirror. The target Windows setup is the authoritative dependency/build verification environment.

## Source verification completed in the packaging environment

PASS:
- 252 TypeScript/TSX files parsed with zero syntax diagnostics.
- Python backend compiled successfully.
- SEO/AdSense source verifier.
- Phase 1 strong-tool verifier.
- Production/security source verifier.
- Trust/content verifier.
- Internal link verifier.
- Final UI verifier.
- Conversion/ registry verifier (74 conversion/ tools registered).
- SEO growth verifier.
- Theme/analytics/privacy verifier.
- Brand/media verifier.
- Final production verifier.
- Accessibility source verifier.
- Mobile-first source verifier.
- Five-language i18n verifier (364 identical shared keys per language).
- Tool UX/customization verifier.
- Source secret/runtime-artifact scan.

## Final target-Windows gates still required

The source package must not be called fully production-validated until `SETUP_FULL_PRODUCTION.ps1` completes on the target Windows environment and prints:

`AJN PDF PRODUCTION SETUP PASSED`

That setup performs the gates that could not be truthfully completed in this packaging environment:
- exact maintenance dependency install,
- ESLint against installed target dependencies,
- semantic TypeScript typecheck,
- Next.js optimized production build,
- target Windows Python dependencies,
- target Windows /LibreOffice conversion smoke and full acceptance,
- live capability export from the actual machine,
- backend `/health`, real `/ready`, `/api/tools`, and frontend runtime checks.

## Deployment/operational work that remains outside source packaging
- Production hosting, DNS and TLS.
- Real persistent storage and backup/restore drill.
- Physical-device mobile QA and manual screen-reader/zoom QA.
- Production Search Console/sitemap/Core Web Vitals validation.
- Google-certified CMP/AdSense production review where required.
- Ghostscript/XPS/PostScript licensing and dependency decision.
- Higher-scale process isolation/shared rate limiting if the service is deployed as multiple replicas.

