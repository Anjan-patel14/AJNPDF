# AJN PDF 3.1.0 R6.1 — Backend Frozen Verification Hotfix

This hotfix keeps the R6 polished light UI unchanged and fixes a false-positive safety failure in `scripts/verify-backend-frozen.mjs`.

The previous verifier recursively treated legitimate local runtime artifacts under `backend/` as source changes, including `.venv`, `tessdata`, SQLite files, acceptance-test output, fixtures and `__pycache__`.

R6.1 now:

- verifies SHA-256 only for the 18 protected backend source files in `BACKEND_UNCHANGED_SHA256.txt`;
- ignores runtime-generated backend artifacts that are not part of that source manifest;
- still fails if any protected backend source file is missing or changed;
- still refuses to stage any `backend/` file before commit/push;
- still does not copy `backend/`, `package.json`, `package-lock.json`, or the generated backend capability manifest.

The UI, 107 tool icons, compact horizontal cards, transparent AJN logo, light-only theme and existing tool workflows remain the R6 versions.
