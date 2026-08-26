# AJN PDF 3.1.0 R9.7 - Safe Directory Staging Hotfix

R9.6 completed the production source gates, ESLint, TypeScript and the optimized Next.js build, then stopped during Git staging because `public/tool-icons` was already absent/untracked and `git add -u -- public/tool-icons` treated that pathspec as an error.

R9.7 changes only the updater staging logic:

- Uses the existing `Stage-TrackedDeletion` guard for `public/tool-icons`.
- If legacy icon files are still Git-tracked, their deletion is staged.
- If the directory is already absent or has no tracked files, staging is skipped without failure.
- Backend, package files and live capability manifests remain protected.
- All R9 UI/UX, tool logic, SEO, i18n, processing and TypeScript fixes are unchanged.
