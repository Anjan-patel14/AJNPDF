# AJN PDF 3.1.0 R10.8.1 — Integration Verifier Hotfix

## Fixed

R10.8 correctly passed its package-side stability audit, but the same verifier was executed again from the live Git repository after the updater copied release-owned source. The verifier unconditionally tried to read `APPLY_TEST_PUSH_FRONTEND.ps1` from the repository root even though that updater is intentionally package-only and is not copied into the repository.

This caused the live integration gate to stop with `ENOENT` before ESLint, TypeScript, build, runtime SSR/header verification, commit and push.

R10.8.1 makes the stability verifier context-aware:

- package context: if `APPLY_TEST_PUSH_FRONTEND.ps1` exists, verify that the runtime SSR/header smoke runs before the Git commit;
- installed repository context: require `scripts/verify-r10-8-runtime.mjs`, but do not require the package-only updater file to exist in the repository;
- all other R10.8 stability, mobile, trust, icon, extension, backend-protection and production gates remain unchanged.

No backend source, `package.json`, `package-lock.json`, or live backend capability manifest is changed by this hotfix.
