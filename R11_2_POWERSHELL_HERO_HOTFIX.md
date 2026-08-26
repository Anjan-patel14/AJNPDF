# AJN PDF 3.1.0 R11.2 — PowerShell StrictMode + Hero Balance Hotfix

- Fixes the R11 updater safety gate when `git status` returns exactly one backend path. PowerShell may unwrap a one-item result to a scalar, so the call is now explicitly wrapped with `@(...)` before `.Count` is read.
- Keeps the backend frozen baseline audit enabled; no backend verification is bypassed.
- Refines the homepage desktop H1 from the oversized 5.2rem cap to a balanced 4.15rem cap with slightly calmer tracking and line height.
- Keeps the SEO H1 text unchanged: `Free PDF Tools Online - Convert, Merge, Compress, Edit & `.
- Preserves all R11/R11.1 trust, canonical, locale, schema, Chrome extension, backend and Git safety behavior.
