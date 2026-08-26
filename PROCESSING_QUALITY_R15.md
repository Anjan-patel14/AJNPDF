# AJN PDF Processing Quality R15

This release hardens AJN PDF's user-facing , PDF/document conversion, and image processing paths. MCP is deliberately outside this scope and no MCP source file is modified by this branch.

## Product rule

A tool is not considered successful merely because a file was created. A production PASS requires:

1. The input structurally matches the claimed format.
2. The processor completes inside an isolated job workspace.
3. The generated file has the correct extension and real format signature/container.
4. The generated file opens successfully.
5. The content is useful for the requested job.
6. Temporary artifacts are cleaned.
7. Errors are actionable and do not expose internal traces to the user.

## Implemented in R15

### 

- English, Telugu, Hindi, Tamil, Kannada and Malayalam continue to use installed  language packs.
- Requested  languages are validated before processing.
- EXIF orientation normalization.
-  orientation/script detection when enough text is present.
- Projection-based small-angle deskew.
- Auto contrast, optional denoise, sharpen and configurable contrast.
-  confidence aggregation.
- Very-low-information  results fail with a useful scan-quality message instead of fake success.
- Digital PDF pages use native text; low-text/scanned pages automatically fall back to  for PDF-to-text/Word quality paths.
- Searchable PDF creation uses orientation/deskew preparation and validates the final PDF/text layer in acceptance tests.

### PDF to Word

- Native page text is read in sorted layout order.
- Font sizes are used to infer headings.
- Bold/italic information is carried into DOCX runs where available.
- Centered blocks are detected conservatively.
- Page breaks are preserved.
- Embedded images are carried into Word when useful and bounded by a safe count.
- Scanned/low-text pages automatically use  instead of producing empty Word files.

### PDF to Excel / CSV

- PyMuPDF table detection is used for structured table extraction.
- Every detected table becomes a real worksheet with useful column widths.
- PDF-to-CSV exports detected tables rather than arbitrary page lines.
- If no structured table is found, AJN PDF now fails clearly by default instead of generating a misleading line-dump spreadsheet.
- `allow_unstructured=true` remains an explicit opt-in fallback for XLSX where a caller intentionally wants page/line/text rows.

### PDF to image

- Page selection accepts values such as `2`, `1-3`, `1,4,7-9` or an integer list.
- DPI and output quality are bounded.
- Render workload is bounded before excessive memory use.
- Multi-page GIF/TIFF and per-page ZIP output are validated.
- AVIF/HEIC encoding failure returns a real capability error; no renamed fallback file is returned.

### Image to PDF / scan to PDF

- EXIF orientation is respected.
- Page size options: `auto`, `a4`, `letter`.
- Orientation options: `auto`, `portrait`, `landscape`.
- Configurable margin (`margin_mm`), DPI and quality.
- Images are fitted proportionally and centered.
- Scan workflows use the  preparation pipeline for readability.
- Multi-frame/image workloads are bounded.
- SVG continues through the established CairoSVG-safe legacy path.

### Browser image tools

The local `_imageUtils.ts` engine now:

- refuses unsupported export formats instead of silently returning JPEG;
- supports only browser-verifiable JPG/JPEG, PNG and WEBP output;
- rejects damaged/empty images;
- caps canvas dimensions and total pixels;
- validates resize and crop dimensions;
- preserves transparent canvas behavior for PNG/WEBP and uses white only for JPEG;
- bounds compression quality, watermark opacity/font size, photo adjustments and enhancement scale;
- prevents invalid blur/crop regions;
- fits meme text within the source width;
- validates the Blob MIME type returned by the browser encoder.

## Existing production safety retained

- Streaming upload limits.
- Per-file and combined upload limits.
- PDF page and image pixel limits.
- ZIP/OpenXML structural validation.
- PDF/image/text output validation.
- Worker subprocess isolation.
- Processing timeout and process termination.
- Per-job temporary directories.
- LibreOffice isolated user profiles and retry.
- Calibre timeout.
- URL-to-PDF public-network/redirect validation.
- Rate limits and disk-space readiness checks.

## Release gates

`backend/processing_quality_acceptance_test.py` verifies semantic outcomes, not just file creation:

- PDF -> Text contains expected source text.
- PDF -> Word is a real DOCX with expected editable text.
- PDF -> Excel contains actual detected table values.
- Image -> PDF is valid and sized sanely.
-  output contains expected words/numbers.
- Searchable PDF contains a searchable/selectable  text layer.
- PDF -> PNG page-range selection exports only requested pages.
- PDF -> Excel refuses prose-only PDFs by default.

The production Docker image runs both the existing full acceptance suite and the new semantic quality acceptance suite before the image can complete successfully.

## Production classification rule

Visible server tools should be classified as one of:

- `PRODUCTION`: dependency and real-output acceptance pass.
- `LIMITED`: valid output with a documented fidelity limitation.
- `DEPENDENCY MISSING`: hidden/disabled until the required runtime exists.
- `BROKEN`: never expose to users.
- `BROWSER ONLY`: local engine; must pass frontend type/build/runtime gates.

## Important limitations

No converter can guarantee pixel-perfect editability for arbitrary PDFs. AJN PDF therefore uses the most useful truthful behavior:

- PDF -> Word prioritizes editable structure and readable layout.
- PDF -> Excel only claims structured extraction when a table is detected.
- PDF -> PowerPoint keeps each PDF page as a slide image to preserve appearance.
- Searchable PDF preserves a rendered page appearance while adding  searchability;  accuracy still depends on scan quality and language data.
- Browser Canvas cannot reliably encode HEIC/AVIF across supported browsers, so local image conversion never pretends to do so. Server capability should be used where an actual codec is available.

## MCP scope

MCP authentication, MCP transport and MCP tools are not changed by this processing branch.
