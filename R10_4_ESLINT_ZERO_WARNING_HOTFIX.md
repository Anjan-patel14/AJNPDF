# AJN PDF 3.1.0 R10.4 - ESLint Zero-Warning Hotfix

R10.4 is a frontend-only continuation hotfix for the R10 Chrome Extension production release.

## Fixed

- Removed eight unused Lucide icon imports from `src/app/admin/analytics/page.tsx`:
  `BarChart3`, `Clock3`, `Database`, `Download`, `MousePointerClick`, `ImageIcon`, `Search`, and `Sparkles`.
- Stopped destructuring the unused `badge` prop in `src/components/junction/ImageToPdfTool.tsx` while preserving the existing `Props` contract for callers.
- Added `scripts/verify-r10-4-eslint-hotfix.mjs` so these exact zero-warning regressions are checked before files are copied and again before the live ESLint gate.
- Updated the release helper banner/staging labels and commit message for R10.4.
- Preserved all R10.3 live-manifest handling, R10 Chrome Extension functionality, R9 product/SEO polish, package/lockfile protection, and backend byte-integrity protection.

## Important

This package does not claim that the live Git repository has already passed ESLint, TypeScript, Next.js build, commit, or push. `APPLY_TEST_PUSH_FRONTEND.ps1` runs those gates on the user's real repository and stops before commit/push if any gate fails.
