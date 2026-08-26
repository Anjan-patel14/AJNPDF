# AJN PDF 3.1.0 R6.2 — Current Backend Baseline Hotfix

## Why R6.1 stopped
R6.1 compared the user's repository backend source files against a historical checksum manifest from the release package. The user's current repository legitimately had newer backend source content in files such as `.dockerignore`, `Dockerfile`, and `app/conversion_engine.py`, so the static historical comparison failed even though the frontend updater did not modify those files.

## R6.2 safety model
R6.2 uses the backend that is already in the user's Git checkout as the source of truth for the frontend-only session:

1. Before copying any frontend file, it enumerates every Git-tracked file under `backend/`.
2. It writes a fresh SHA-256 baseline for the CURRENT bytes into `BACKEND_UNCHANGED_SHA256.txt`.
3. It applies only `src/`, selected `public/` frontend assets, and frontend verification files.
4. It rechecks the backend immediately after frontend copy and again after lint/typecheck/build.
5. Any byte change to a tracked backend file during the run aborts the update.
6. Untracked runtime artifacts such as `.venv`,  language files, SQLite databases, fixtures, acceptance output, and `__pycache__` do not create false failures.
7. Git staging explicitly excludes `backend/`, and the updater aborts if any backend file is staged.

This preserves existing backend work without rolling it backward and still proves that R6.2 does not alter backend files.
