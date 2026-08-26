# AJN PDF 3.1.0 R11.1 backend baseline hotfix

This hotfix corrects the frozen-backend checksum manifest for the intentionally updated `backend/.env.example` production-origin defaults. It also extends the updater safety check so pre-existing tracked changes to `backend/.env.example` are never overwritten silently.

No verifier is disabled. The backend frozen audit remains enforced.
