# AJN PDF 3.1.0 R11.3 — Verifier Compatibility Hotfix

R11.3 fixes a retained R10.9 release verifier that depended on an older R11 banner string instead of the actual declared backend-copy policy.

## Fixes

- Keeps the R10.9 admin helper verification enabled.
- Verifies `CONFIGURE_AJN_ADMIN_LOCAL.ps1` is still copied by the updater.
- Verifies the updater explicitly declares the only R11-owned backend paths: `backend/.env.example`, `backend/app/main.py`, and `backend/app/conversion_engine.py`.
- Keeps all other protected backend source frozen.
- Retains the R11.2 PowerShell StrictMode fix and balanced homepage hero typography.
- Does not disable or bypass any source, backend, Git, lint, TypeScript, build, or runtime gate.
