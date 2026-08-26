# AJN PDF 3.1.0 R8 — Premium Pro Workspace UI/UX

Frontend-only release. Existing backend state is captured from the target Git checkout before the update and must remain byte-for-byte unchanged during copy, verification, build, commit and push.

## User-facing changes

- Removed technical processing-mode labels from tool cards and normal tool workspace surfaces.
- Removed visible processing seconds/timestamps such as `0.0s` from result/progress UI.
- Added a full-page document-processing experience with a document stack, scanning line, staged progress copy and subtle wave background.
- The full-page processing experience is triggered for service-assisted requests and local AJN engine jobs.
- Preserved honest detailed file-handling information in policy/security pages and moved tool-specific handling detail into a low-emphasis disclosure.
- Added persistent desktop tool-directory layout choices: 2-column, compact 4-column and list. Mobile remains one horizontal card per row.
- Removed the repeated processing-mode line from every tool card.
- Kept the 107-tool simple professional vector icon system; cards use compact artwork and do not repeat the AJN logo.
- Added original AJN document/workspace visuals and subtle wave shapes instead of large decorative circles; removed unused legacy visual components.
- Added clearer homepage actions and premium task-focused copy.
- Added result sharing: native file share where supported, with current-tool link sharing/copy fallback. Shared result flows and server conversion results expose Share beside Download.
- Simplified homepage, About, FAQ, Status, Transparency and guide-directory copy; removed defensive or developer-facing wording from normal user surfaces.
- Light-only UI and transparent AJN website logo remain enforced.

## Safety and verification

The Windows updater:

1. Verifies the R8 release source.
2. Verifies release-package backend provenance.
3. Captures SHA-256 of every Git-tracked backend file in the user's current repository.
4. Copies frontend source only; it does not copy `backend/`, `package.json`, `package-lock.json`, or the generated backend-capability manifest.
5. Verifies backend byte integrity after frontend copy and after the production build.
6. Runs routes, accessibility, mobile-first, five-language structure, tool workflow, light-theme/analytics, code-quality, capability, ESLint, TypeScript and Next.js production-build gates.
7. Refuses to stage any backend file.
8. Commits and pushes only after all gates pass.

## Release scope

No backend source behavior, backend dependencies, credentials, signing configuration or deployment secrets are intentionally changed by R8.
