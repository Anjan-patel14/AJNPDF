# AJN PDF R3.1.1 — Local Verification Fix

R3.1 correctly patches cross-platform dependency detection, but its helper
then imported `backend.app.conversion_engine` using the user's local Windows
Python environment.

That import requires backend-only packages such as `pikepdf`. Those packages
are intentionally installed in the Cloud Run Docker image and do not need to
be installed into the local Next.js/frontend workstation.

R3.1.1 changes verification policy:

LOCAL WINDOWS
- py_compile source syntax
- verify platform guard text
- run JS conversion registry guards
- no backend dependency import

CLOUD BUILD
- install requirements.txt
- import FastAPI/backend modules
- verify native engines
- run full_acceptance_test.py

POST DEPLOY
- /health
- /ready
- /api/tools
- TEST_CLOUD_RUN_BACKEND.ps1 live HTTP processing tests
