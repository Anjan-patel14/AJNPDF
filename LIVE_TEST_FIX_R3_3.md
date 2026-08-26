# AJN PDF R3.3 — Live Backend Test Fix

The production Cloud Run service is already deployed and healthy.

R3.3 changes only `TEST_CLOUD_RUN_BACKEND.ps1`.

Fixes:
- adds `-UseBasicParsing` to avoid the Windows PowerShell script-parsing warning
- stops sending unnecessary multipart `options_json` JSON in /DOCX requests
- relies on backend defaults (`options_json={}`,  language `eng`)
- captures HTTP status and server error body instead of hiding it behind curl `-f`
- uses `${Label}`-safe interpolation via `$($Label)`
- generates a large high-contrast  fixture
- validates recognized  content
- tests Scanned PDF -> Word directly
- keeps Protect, Unlock, Repair, DOCX -> PDF, PDF -> DOCX, CORS, health, ready and capability checks

No Cloud Build or Cloud Run redeployment is required.
