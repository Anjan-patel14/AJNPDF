# AJN PDF 3.0.4 searchable PDF Windows fix

- Replaced temporary-file PDF output with  binary PDF streaming through `stdout`.
- This avoids Windows builds that return success but do not leave the requested output-base PDF on disk.
-  still creates the multilingual searchable layer with its embedded GlyphLessFont.
- Each streamed page is validated as a one-page PDF before being saved and merged.
- PyMuPDF performs deterministic multi-page merging and the acceptance suite verifies the  text layer.
- `chardet==5.2.0` remains pinned to avoid Requests dependency warnings.
- Backend and package version are 3.0.4 so setup cannot reuse the older 3.0.1 backend process.
