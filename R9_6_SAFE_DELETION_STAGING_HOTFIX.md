# AJN PDF 3.1.0 R9.6 Safe Deletion Staging Hotfix

R9.5 completed the full source verification, zero-warning ESLint, TypeScript check, and optimized Next.js production build, then stopped while staging a cleanup path that was already absent from Git.

R9.6 changes only release staging safety:

- A deliberate cleanup path is staged only when Git currently tracks that path.
- Paths that are already absent or were never tracked are skipped cleanly instead of causing a pathspec failure.
- Existing tracked deletions are still staged with `git add -u`.
- Backend files, package manifests, lockfiles, and live backend capability manifests remain protected and are not copied or staged.
- R9.5 TypeScript, UI/UX, SEO, processing, search, i18n, accessibility, and tool logic are unchanged.
