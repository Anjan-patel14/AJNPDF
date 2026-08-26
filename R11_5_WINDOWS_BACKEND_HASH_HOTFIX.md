# AJN PDF 3.1.0 R11.5 — Windows backend hash verification hotfix

R11.5 retains the complete R11.4 cumulative integration and fixes a Windows-only false failure in the protected backend audit.

## Fix

- Protected backend source comparison now ignores only UTF-8 BOM and CRLF/LF line-ending differences.
- Any substantive source change still fails the frozen-backend gate.
- Diagnostic failures include short raw, normalized and expected SHA256 prefixes.
- The installer remains idempotent after interrupted R11 runs.
- No `git reset --hard`, `git clean` or force-push is used.

This specifically prevents a correct Windows checkout of files such as `backend/.dockerignore` and `backend/Dockerfile` from being rejected only because Git materialized CRLF instead of LF.
