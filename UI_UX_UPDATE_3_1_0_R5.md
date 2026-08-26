# AJN PDF 3.1.0 R5 — Professional Branded Tool Cards

This is a frontend-only release. The Python backend is intentionally unchanged.

## Implemented

- Added 107 unique branded tool artwork files, one for every public tool in the approved 107-tool catalogue.
- Replaced the generated website mark with the exact user-supplied AJN logo asset.
- Added matching AJN favicon/PWA assets.
- Reworked the main directory into compact horizontal cards rather than large square cards.
- Kept the existing light lavender/blue and dark premium orange/black themes.
- Added a small AJN brand badge; removed marketing badges from the main card surface.
- Kept tool name, concise description, processing mode and arrow action visible without expanding a card.
- Added the branded artwork to category directories, search results, related tools, 404 suggestions and tool workspace headers.
- Kept search/category filtering, existing routes, processing logic and backend integration unchanged.
- Tool imagery is loaded through Next Image so below-the-fold artwork can lazy load instead of downloading all 107 assets immediately.
- Hover/tap motion is intentionally short and respects `prefers-reduced-motion`.

## Card layout

Desktop: 3 horizontal cards per row at extra-large widths, 2 cards per row at medium widths.

Mobile: 1 full-width horizontal card per row with a compact media thumbnail, clear title and description.

## Visual direction

The interaction hierarchy follows the simple, task-first pattern common to leading PDF tool directories: recognizable tool action, concise label, short explanation and one clear route into the workflow. AJN PDF keeps its own artwork, logo, colors and visual identity.

## Verification

Run:

```powershell
node .\scripts\verify-professional-tool-art.mjs
node .\scripts\verify-premium-liquid-ui.mjs
node .\scripts\verify-backend-frozen.mjs
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```
