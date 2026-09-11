# Edit PDF — Gate 1 + export/reopen persistence checkpoint

Gate 1 status: **PASS on the user Windows machine.**

Confirmed runtime passes from the 2026-09-10 production browser run:

- cold first `/edit-pdf` request returned 200
- digital PDF upload opened the same-page editor
- real page preview rendered
- page navigation and zoom passed
- native digital text select/edit passed
- Add Text passed
- Add/Move/Resize Image passed
- delete image + undo/redo passed
- rotate/reorder/delete page passed
- digital PDF export produced a parseable two-page PDF

The first run then failed only at the **reopen searchable-text assertion**. The exporter drew zero-letter-spacing text one glyph at a time, which can make PDF.js expose the exported phrase as isolated character text items instead of one `ADDED NOTE` hit.

This checkpoint fixes that by:

- writing ordinary zero-tracking, 1.0-scale vector text as one PDF text operation, improving searchability/editability after reopen;
- retaining per-glyph drawing only when custom letter spacing or horizontal scaling actually requires it;
- verifying reopened searchable text by normalized PDF.js text hits rather than requiring one exact text-item segmentation;
- skipping repeat `npm ci` and Playwright Chromium download when they are already installed.

Run `RUN_EDIT_PDF_LOCAL.ps1` to rebuild and continue the production browser suite through digital reopen, scanned OCR, OCR export/reopen, repeated route requests, and zero-fatal-error checks.

No Git push. No Vercel. No deployment. No live billing.
