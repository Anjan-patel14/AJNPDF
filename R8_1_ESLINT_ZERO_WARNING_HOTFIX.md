# AJN PDF 3.1.0 R8.1 — ESLint zero-warning hotfix

This hotfix keeps the R8 premium workspace UI unchanged and fixes the two zero-warning release blockers:

- `scripts/verify-r8-premium-pro-ui.mjs`: removed the unused `sharedLifecycle` assignment while preserving the marker verification call.
- `src/components/junction/_shared.tsx`: stopped destructuring the unused `processingMode` prop in `ToolWorkspace`; the prop remains in `WorkspaceProps` for caller compatibility.

No backend file is copied or staged by the updater. The updater captures the current tracked backend state before applying the frontend and verifies byte integrity before and after the production build.
