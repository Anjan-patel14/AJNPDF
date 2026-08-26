# AJN PDF Cloud Run backend deployment patch

## Why this patch exists
AJN PDF browser/local tools can stay on Vercel. Server-assisted PDF security, Office, eBook and conversion tools require a long-running container with native binaries. Vercel Functions are not a reliable fit for the AJN PDF processing contract because file payloads and native engines exceed the practical serverless-function model.

## Production split
- Vercel: Next.js frontend only
- Google Cloud Run: FastAPI + LibreOffice +  + Calibre + Poppler + ImageMagick
- XPS/PostScript remains dependency-gated until its external-engine licensing decision is made.

## Cloud Run first-release file limit
The backend is configured to 30 MB total request/output for the first release. Cloud Run documents a 32 MiB maximum HTTP/1 request size. A future direct-to-Cloud-Storage upload flow can raise this without proxying the file body through the HTTP service.

## Steps
1. Extract this patch over the AJN-PDF-GITHUB repository.
2. Commit and push the patch.
3. Install Google Cloud CLI if needed, sign in and select the billing-enabled project.
4. Run `./DEPLOY_CLOUD_RUN_BACKEND.ps1`.
5. Copy the printed Cloud Run URL.
6. In Vercel set `NEXT_PUBLIC_PDF_BACKEND_URL` to that Cloud Run URL.
7. Redeploy Vercel.
8. Run `./TEST_CLOUD_RUN_BACKEND.ps1`.

The deploy script uses asia-south1 by default, 2 vCPU, 4 GiB memory, concurrency 1, 300 second request timeout, min instances 0 and max instances 3.
