# AJN PDF 3.1.0 R4 — Premium Liquid UI/UX Update

This release is a frontend-only visual and interaction upgrade built on the AJN PDF 3.1.0 production source.

## Design system
- Light theme: lavender + clean blue with subtle gradients.
- Dark theme: premium orange + true black/charcoal surfaces.
- Rounded liquid/glass cards with restrained blur, borders and depth.
- Consistent button sizes, focus states, hover/press feedback and disabled behavior.
- Theme-aware tool icons, upload panels, progress cards and processing overlays.

## Mobile
- Compact mobile hero.
- Fixed safe-area-aware bottom navigation using only real existing routes: Home, Tools, Convert, Images, PDF.
- Improved touch targets and spacing.
- Bottom-navigation padding prevents content from being covered.

## Motion and loading
- Framer Motion entries use reduced-motion preferences.
- Liquid background shapes use lightweight CSS animations.
- Route skeletons and server-processing activity feedback from the R3 UX line are included on the frontend only.
- `prefers-reduced-motion` disables non-essential movement.

## Workflow components
- File dropzone redesigned with clear input guidance and theme-aware drag state.
- Progress card redesigned with accessible progressbar semantics.
- Tool workspace shell, theme control and processing badges refreshed.
- Existing tool processing functions and API contracts are intentionally unchanged.

## Backend protection
`backend/` is byte-for-byte identical to `AJN-PDF-3.1.0-BACKEND-HARDENED-FULL-PRODUCTION.zip`.
The included `BACKEND_UNCHANGED_SHA256.txt` and `scripts/verify-backend-frozen.mjs` provide a reproducible check.

## Release verification
Run:

```powershell
npm ci
npm run verify:premium-ui
npm run verify:backend-frozen
npm run lint
npm run typecheck
npm run build
```

To apply this frontend release to an existing AJN PDF Git clone, test, commit and push in one step, use `APPLY_TEST_PUSH_FRONTEND.ps1` from the extracted release folder.
