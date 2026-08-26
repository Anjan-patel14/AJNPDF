# AJN PDF Cloud Run Backend Production R2

## Purpose

This patch converts AJN PDF into a production hybrid architecture:

- **Vercel:** Next.js frontend only.
- **Browser:** local PDF/image utilities where practical.
- **Google Cloud Run:** temporary server-assisted PDF security, Office, OpenDocument, eBook, image/document conversion workflows.
- **No paid conversion APIs:** processing uses the existing open-source/native engine stack.
- **Free-first controls:** Cloud Run scales to zero, request-based CPU throttling is enabled, concurrency is 1, and maximum instances defaults to 1.

## Server tool families

### PDF security
- Protect PDF — AES-256 via pikepdf.
- Unlock PDF — requires the current valid password and explicit authorization.
- Repair PDF — attempts structural recovery of readable PDFs.

###  / scanning
- Scanned PDF -> Text
- Scanned PDF -> Word
- Scanned PDF -> Searchable PDF
- Image -> Text
- Image -> Word
- Image -> Searchable PDF
- Camera Scan -> PDF
- Receipt -> PDF
- Document Scanner -> PDF
- Handwriting Image -> Text (best effort)

 languages installed in the container:
- English
- Hindi
- Telugu
- Tamil
- Kannada
- Malayalam
-  orientation/script detection

### Microsoft Office / OpenDocument
- DOC/DOCX -> PDF
- XLS/XLSX -> PDF
- PPT/PPTX -> PDF
- ODT/ODS/ODP -> PDF
- PDF -> DOCX/XLSX/PPTX and related text/document outputs

LibreOffice Writer/Calc/Impress are installed in the Cloud Run image.

### eBooks
- EPUB -> PDF
- PDF -> EPUB
- MOBI <-> PDF
- AZW3 <-> PDF

Calibre `ebook-convert` is installed in the image.

### Image / document conversions
- Image formats -> PDF
- PDF pages -> JPG/JPEG/PNG/WebP/TIFF/BMP/GIF/SVG/ZIP variants
- TXT/RTF/HTML/Markdown/XML/JSON/CSV -> PDF
- EML/MSG -> PDF
- URL -> PDF (readable snapshot; JavaScript-heavy pages are not promised to be pixel-identical)

### Dependency-gated
- XPS -> PDF remains disabled unless an approved MuPDF/Ghostscript-compatible engine is supplied.
- PostScript processing is not enabled in this release.
- This is intentional to avoid making unsupported licensing/runtime claims.

## Reliability controls

1. Cloud Build installs all native dependencies.
2. Docker build fails if Python/native engines are missing.
3. `smoke_test.py`, `capability_audit.py`, and `full_acceptance_test.py` run **during image build**.
4. Cloud Run deploy health-check waits for the startup probe.
5. Startup probe uses `/ready`.
6. Liveness probe uses `/health`.
7. Live deployment verifies `/health`, `/ready`, and `/api/tools`.
8. Critical capabilities must be marked available before deployment is accepted.
9. `TEST_CLOUD_RUN_BACKEND.ps1` performs real multipart HTTP processing tests after deployment.
10. Temporary processing stays in ephemeral storage and is cleaned by the backend response workflow.

## Cost controls

Default deployment:
- region: `asia-south1`
- CPU: 2 vCPU
- memory: 4 GiB
- request-based CPU throttling
- minimum instances: 0
- maximum instances: 1
- concurrency: 1
- request timeout: 300 seconds
- processing worker timeout: 270 seconds
- analytics disabled initially
- no Cloud SQL / Redis / GPU / paid  API

## File limits

Server-assisted multipart requests are deliberately limited to:
- 30 MB per file
- 30 MB combined request payload
- 30 MB output
- 30 uploaded files maximum at the API layer
- frontend server tools enforce the same 30 MB request model

This leaves headroom under common HTTP/1 platform request limits. A future >30 MB workflow should use direct object-storage upload rather than proxying large request bodies through the processing endpoint.

## Frontend reliability changes in R2

- Protect/Unlock/Repair validation changed from 50 MB to 30 MB to match the production server.
- Server conversion screens reject >30 MB combined multi-file selections before upload.
- Frontend server request timeout is aligned to ~295 seconds rather than aborting security operations at ~190 seconds while Cloud Run is still processing.
- The frontend continues to use `/ready` and `/api/tools` as the source of truth for server availability.

## Production request workflow

```text
User chooses server-assisted tool
        |
        v
Next.js checks Cloud Run /ready + /api/tools
        |
        v
Frontend validates format/count/30 MB limits
        |
        v
HTTPS multipart request to Cloud Run
        |
        v
FastAPI validates content/signatures/options
        |
        v
Temporary work directory
        |
        v
Isolated worker process
        |
        +--> pikepdf/PyMuPDF
        +-->  
        +--> LibreOffice
        +--> Calibre
        +--> Poppler/ImageMagick/Cairo
        |
        v
Output validation
        |
        v
HTTPS download response
        |
        v
Temporary files removed
        |
        v
Cloud Run scales back toward zero
```

## Vercel

Vercel must remain **Next.js frontend only**. Do not re-enable Vercel Services/FastAPI.

After Cloud Run deployment, set:

```env
NEXT_PUBLIC_PDF_BACKEND_URL=https://YOUR-CLOUD-RUN-SERVICE.run.app
```

Then redeploy the Vercel frontend.

## Required success markers

Build/deployment:

```text
AJN PDF CLOUD RUN BACKEND PASSED
```

Live acceptance:

```text
AJN PDF LIVE BACKEND CRITICAL TESTS PASSED
```

Only after both markers should the server-assisted tools be considered production-enabled.
