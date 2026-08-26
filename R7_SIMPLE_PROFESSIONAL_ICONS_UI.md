# AJN PDF 3.1.0 R7 — Simple Professional Icons + Polished Homepage

R7 is a frontend-only UI/UX release built on the verified R6.2 production baseline.

## What changed

- Replaced the 107 heavy raster tool-card artworks with a lightweight vector icon system rendered from source.
- 34 action tools use distinct dedicated glyphs.
- 73 conversion tools use distinct source → target format pairs, so no two production tool icons are identical.
- Removed the repeated AJN badge/logo from every tool card. The approved transparent AJN logo remains in website branding only.
- Reduced tool icon wells to compact square sizes: 48px on phone cards and 52px on larger cards.
- Kept horizontal cards, one full-width card per row on phones, two columns on tablet, and three columns on large desktop.
- Simplified card shadows, borders and hover movement for a cleaner professional look.
- Updated the homepage hero to:
  - Smart • Fast • Effortless
  - Powerful PDF Tools.
  - 
  - Convert, organize, edit, protect, sign and process your files with professional tools designed for speed and simplicity.
- Replaced the older promotional hero illustration with a compact four-step Upload → Process → Preview → Download workflow panel.
- Preserved the light-only UI, transparent AJN website logo, search, categories, accessibility, analytics and mobile navigation.

## Functionality preserved

The update does not replace tool processors or backend logic. Existing production workflows remain in place for upload, conversion, visual PDF editing, signing, watermarking, output naming, progress reporting and downloads.

The updater does not copy `backend\`, `package.json`, `package-lock.json`, or `src/generated/backend-capabilities.json`. It captures the current Git-tracked backend state before the frontend update and verifies byte integrity again after copy and after the production build.

## Release gates

The updater stops before commit/push if any configured gate fails:

- R7 icon/UI source verifier
- current backend byte-integrity verifier
- routes and internal links
- accessibility guardrails
- mobile-first layout
- five-language i18n structure
- tool UX/workflow checks
- light-only theme and analytics checks
- code-quality guardrails
- deployment capability manifest
- ESLint
- TypeScript
- Next.js production build

Only after all gates pass does it stage frontend changes, verify that no backend path is staged, commit, and push the current branch.
