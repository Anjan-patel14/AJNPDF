# AJN PDF Cloud Run eBook Fix R3.2

## Failure
Cloud Build's direct acceptance suite passed application import and reached
real conversions. Only these two failed:

- MOBI -> PDF
- AZW3 -> PDF

Calibre's direct PDF output path invokes Qt WebEngine/Chromium. In the
headless build container it attempted GPU/OpenGL/Vulkan initialization and
Chromium rejected execution as root.

## Fix
Do not disable Chromium sandboxing.

Use a two-stage conversion instead:

MOBI/AZW3
  -> Calibre ebook-convert
  -> intermediate EPUB
  -> EbookLib text extraction
  -> AJN ReportLab PDF renderer

Existing EPUB -> PDF is also centralized through the same helper.

PDF -> MOBI/AZW3 remains unchanged.

## Benefits
- no Qt WebEngine PDF rendering for MOBI/AZW3 -> PDF
- no GPU/OpenGL requirement for those outputs
- no global --no-sandbox security relaxation
- same bounded AJN output pipeline as EPUB -> PDF
- preserves Calibre only for formats AJN cannot decode natively
