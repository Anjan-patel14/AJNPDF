# AJN PDF Edit PDF — OCR Auto Style Match V4

## Scope

This update focuses on scanned/image PDF text replacement. A scan contains pixels rather than reusable PDF font objects, so exact recovery of an unknown original font is not always technically possible. V4 therefore performs automatic best-match reconstruction from the source pixels and any OCR font metadata that is available, while keeping manual controls available.

## Automatic source-style reconstruction

When an OCR/native source text hit is converted to editable text, AJN PDF now automatically preserves or estimates:

- recognized source text and word/line/table-cell geometry;
- foreground text colour using RGB colour-distance clustering, including coloured text and light text on dark backgrounds;
- local background colour for the source cover;
- source font size using Tesseract hOCR `x_fsize` when available, blended with pixel glyph-height metrics;
- font family using OCR font metadata when available and normalized PDF/common font aliases, otherwise closest common browser font metrics;
- regular/bold using source glyph ink density plus font candidate matching;
- upright/italic using source-pixel shear analysis plus OCR metadata when available;
- conservative horizontal scaling so replacement text visually follows the original word width;
- line height and baseline placement;
- table-cell width/height boundaries.

Tesseract is requested to provide hOCR font information. The parser accepts `x_fsize`, `x_font`, bold and italic hints where the installed OCR build exposes them. The visual matcher remains the fallback when metadata is absent.

## Editing behaviour

Source-backed text starts in **AUTO** style mode. Typing changes the text but keeps the matched family, weight, italic state, colour and original matched size. If the replacement is longer than the available source/table-cell area, AJN PDF shrinks it only as much as required. Short text is not artificially stretched to fill the old word box.

Manual changes to family, size, colour, bold, italic, line spacing or letter spacing switch the object to **MANUAL** style mode. **Re-match font + size + color from original** samples the original raster again and restores automatic matching.

The canvas preview now applies the same horizontal scale used by export, reducing preview/export differences.

## Regression coverage

The V4 browser suite includes a fully raster/image-only PDF fixture containing:

- blue bold text;
- red italic text;
- white bold text on a dark background;
- regular black text.

The browser test verifies that OCR conversion enables automatic style matching, chooses a usable family and size, keeps blue text blue-ish, keeps bold text bold, keeps white-on-dark text light, detects the italic sample, auto-fits a longer replacement without enlarging past the source size, and keeps the AUTO style state while typing.

## Important limitation

For a raster scan, the original font file/name generally is not embedded in the PDF. AJN PDF can estimate the closest available font from OCR metadata, geometry and pixel appearance, but it must not promise exact arbitrary-font recovery. Digital/native PDFs can preserve substantially more font metadata when it is actually present.
