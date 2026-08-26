# AJN PDF 3.1.0 — Backend Processing Workflow

## Request flow

1. Frontend checks `/ready`.
2. Frontend loads `/api/tools` and requires the exact tool to report `available: true`.
3. Frontend rechecks readiness immediately before processing.
4. FastAPI assigns/preserves `X-Request-ID`, applies request/rate limits and streams uploads to temporary files in 1 MB chunks.
5. Backend verifies extension plus format-aware file content before any converter runs.
6. Backend checks free working disk.
7. Conversion runs in a dedicated child Python process. Passwords for PDF security tools travel over worker stdin JSON, not command-line arguments.
8. If the deadline is exceeded, the worker process tree is terminated.
9. Generated output is checked for size, extension and structural validity.
10. Anonymous analytics are best-effort and cannot change the conversion result.
11. The response includes processing/tool/request headers and streams the result. Temporary work files are deleted after delivery.

## Shared resource limits

- Per-file upload: configured by `AJN_MAX_FILE_MB` (default 75 MB).
- Combined upload: `AJN_MAX_TOTAL_MB` (default 150 MB).
- Files per job: `AJN_MAX_UPLOAD_FILES` (default 50).
- Options JSON: maximum 20,000 characters.
- Generated output: `AJN_MAX_OUTPUT_MB` (default 500 MB).
- PDF pages: `AJN_MAX_PDF_PAGES` (default 300).
- Total PDF render work: `AJN_MAX_RENDER_MPIX` (default 600 MP).
- One image/frame: `AJN_MAX_IMAGE_PIXELS` (default 80 MP).
- Multi-frame/image count: `AJN_MAX_IMAGE_FRAMES` (default 120).
- In-memory multi-frame batch: `AJN_MAX_BATCH_MPIX` (default 240 MP).
- Minimum free disk reserve: `AJN_MIN_FREE_DISK_MB` (default 512 MB).

## Format validation

Inputs are checked before reaching third-party parsers: PDF signature/structure, image decoding and pixels, Office/ODF/ePub ZIP container markers and expansion size, legacy OLE signatures, RTF, JSON, XML, CSV, EML, eBook signatures and safe text decoding. SVG external href/url/@import resources are rejected.

Repair PDF intentionally has a narrower pre-check: a `%PDF-` signature is required, but damaged structure is allowed to reach pikepdf recovery. Unlock PDF accepts a structurally valid encrypted PDF without weakening validation for other PDF tools.

Outputs are checked before delivery: PDF validity/encryption policy, Office/ODF/ePub required container data, image decode/pixel limits, SVG/XML/JSON/CSV/RTF/eBook/text structure and the global output-size ceiling.

## Acceptance gates

`backend/full_acceptance_test.py` validates converter engines directly.

`backend/http_acceptance_test.py` validates the real HTTP path, including multipart uploads, `/ready`, live tool availability, processing headers, request IDs, downloaded outputs, invalid options, empty input, spoofed PDF content, multi-file misuse, Protect, wrong-password Unlock, successful Unlock, Repair and Compress. Dependency/deployment fixture exceptions are explicitly documented rather than silently passed.
