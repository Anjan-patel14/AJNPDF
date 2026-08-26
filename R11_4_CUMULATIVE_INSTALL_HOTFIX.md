# AJN PDF 3.1.0 R11.4 — Cumulative Install Integration Hotfix

R11.4 fixes the release integration gap that could let package-side audits pass while the installed repository retained older R10.8/R10.9 prerequisite files.

## Fixes

- Synchronizes the complete packaged `src`, `scripts`, and `chrome-extension` frontend/verifier surfaces before installed audits.
- Includes `APPLY_TEST_PUSH_FRONTEND.ps1` itself, so installed R10.9 compatibility checks inspect the current updater rather than an older repository copy.
- Includes sitemap, admin, Discover, limits//status, runtime-facts, SEO strategy, and other retained R10.8/R10.9 prerequisites.
- Makes interrupted R11 reruns idempotent for the three declared backend release-owned files: an already-dirty file is allowed only when it exactly matches the release bytes.
- Creates the safety patch/status backup before backend conflict validation.
- Keeps staged-work protection, backend frozen auditing, ESLint, TypeScript, production build, runtime smoke, safe staging, commit, and non-force push.

No `git reset --hard`, `git clean`, or force-push is used.
