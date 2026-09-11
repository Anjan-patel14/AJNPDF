# AJN PDF Scan + Word + Table Editor Fix

Scope: local AJN PDF `/edit-pdf` editor only. No Git push, Vercel, deployment, billing, or live-backend changes.

## Implemented
- OCR word cleanup no longer discards moderately confident recognized text solely because of a strict confidence/style heuristic.
- Word replacement uses one persistent edit transaction: typing no longer creates an undo snapshot per keystroke; blur/Escape commits one history entry.
- Replacement text boxes expand for longer text instead of clipping immediately.
- Table-aware text sizing keeps edited OCR table content within the detected cell width/height boundary.
- Added Table OCR mode alongside Word and Line modes.
- Table detection looks for continuous horizontal/vertical rules rather than aligned text columns alone.
- Grid rules are removed only from the OCR working image; the visible/original PDF table remains unchanged.
- OCR results are mapped to row/column cells and recognized words in the same cell are grouped into one editable cell value.
- Unread table text-like regions remain manual replacement targets rather than being filled with invented text.
- Added batch actions for recognized scan text and recognized table text.
- Added optional cyan table-cell guides and row/column metadata in the properties panel.
- Existing digital editing, image editing, undo/redo, page operations, export validation, secure redaction, and same-page `/edit-pdf` workflow are preserved.

## Verification included
- TypeScript/TSX syntax transpile: PASS in packaging environment.
- Editor source contract verifier: PASS.
- Browser test syntax: PASS.
- Added a one-page image-only synthetic table PDF fixture.
- Production browser E2E now includes real Table OCR detection, table-cell edit bounds, and table export validity.

The full Windows production build + Tesseract.js browser OCR test must run on the target Windows installation because the packaged source intentionally excludes node_modules and generated `.next` output. `RUN_EDIT_PDF_LOCAL.ps1` performs that verification before opening the local editor.

## Technical limitation
OCR reconstructs editable text from pixels. Exact original fonts and perfect recognition cannot be guaranteed for every low-quality scan. Unread regions are deliberately left for manual replacement instead of inventing content.
