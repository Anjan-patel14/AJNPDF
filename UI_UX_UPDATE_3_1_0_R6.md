# AJN PDF 3.1.0 R6 — Polished Light UI/UX

## Scope
Frontend-only refinement of the R5 branded icon-card release. Backend processing code is frozen and is not copied or staged by the updater.

## R6 changes
- Light-only public UI. Dark-mode controls are removed and first-paint bootstrap forces light mode.
- Header/site AJN logo uses a transparent-background derivative while the approved original logo bytes remain preserved in `public/brand/ajn-logo.png`.
- 107 tool artworks remain mapped one-to-one to the canonical tool IDs.
- Tool artwork files are resized/compressed for card usage; total artwork payload is under 1 MB in the release package.
- The old baked-in white circular logo plate in tool artwork is visually covered and the transparent AJN mark is re-overlaid without a white background.
- Main cards are compact horizontal cards: 64×48 px artwork on phones and 72×54 px on larger screens.
- Card height reduced to about 82–88 px with 14–16 px radius, subtle border/shadow and a small action affordance.
- Per-card Framer Motion layout animation and pointer-tracking glow were removed from the 107-tool grid to reduce work and visual noise.
- Search, category directory, related recommendations, 404 suggestions and tool-workspace artwork sizes were reduced.
- Header logo no longer has a white container/border plate.
- Mobile remains one full-width horizontal tool card per row; tablet/desktop scale to two/three columns.
- Keyboard focus, reduced-motion behavior, mobile bottom navigation and existing processing-mode labels remain intact.

## Functionality preserved
- All public tool routes remain linked through the existing tool registry.
- Search and category filtering logic are preserved.
- Browser/server processing-mode labeling is preserved.
- Existing tool workspaces and file-processing logic are not replaced.
- Backend capability manifest in the user's Git repository is preserved instead of copied from this ZIP.
- Existing package.json/package-lock.json are preserved, including the user's Vercel dependency/lockfile repair.

## Validation included
- `verify-r6-polished-ui.mjs`
- backend frozen hash check
- links
- accessibility source guardrails
- mobile-first R6 card contract
- five-language i18n
- tool UX/customization checks
- light-only theme + analytics checks
- code-quality guard
- capability manifest verification
- ESLint
- TypeScript
- production Next.js build

The updater only commits and pushes after these configured gates succeed on the user's existing Git clone.
