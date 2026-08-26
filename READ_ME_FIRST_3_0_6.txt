AJN PDF 3.0.6 — PREMIUM UX + FIVE-LANGUAGE PRODUCTION PACKAGE

This is a clean source package.

IMPORTANT:
1. Put the ZIP in your Windows Downloads folder.
2. Run the one-command PowerShell installer supplied with the release.
3. Save/close any LibreOffice work before setup; the installer closes stale soffice processes.
4. The installer creates a fresh Desktop production folder.
5. Do not call production validation complete until the exact final line appears:

   AJN PDF PRODUCTION SETUP PASSED

The clean ZIP intentionally does NOT include:
- node_modules
- .next
- backend/.venv
- local .env.local files
- runtime SQLite databases
- acceptance output
- logs/temp files
- admin secrets

The clean frontend capability manifest is intentionally fail-closed. Windows setup audits the actual backend and exports the live machine capability manifest before the production frontend build.

See IMPLEMENTATION_REPORT_3_0_6.md for completed work and remaining deployment gates.
