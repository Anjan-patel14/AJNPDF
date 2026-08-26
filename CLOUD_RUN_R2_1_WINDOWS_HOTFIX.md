# AJN PDF Cloud Run Production R2.1 — Windows gcloud Hotfix

This hotfix changes only `DEPLOY_CLOUD_RUN_BACKEND.ps1`.

It fixes Windows PowerShell treating harmless `gcloud.ps1` stderr/status output (for example `Encryption: Google-managed key`) as a terminating error under `$ErrorActionPreference=Stop`.

Changes:
- Prefer the native `gcloud.cmd` launcher on Windows.
- Use process exit codes as the source of truth.
- Make Artifact Registry detection idempotent using a list check.
- Preserve all R2 Cloud Run cost, health, security, conversion and verification settings.

No frontend files, package.json, package-lock.json, backend conversion logic or Vercel configuration are changed.
