# AJN PDF 3.1.0 R10.6 - Ignored Extension ZIP Staging Hotfix

R10.5 passed the live capability check, zero-warning ESLint, TypeScript, the optimized
Next.js production build, and the final backend byte-integrity check. It then stopped while
staging the public Chrome extension download ZIP because the repository intentionally ignores
`*.zip`.

R10.6 changes only the release updater staging policy:

- `public/downloads/AJN-PDF-CHROME-EXTENSION-1.0.0.zip` is staged with `git add -f`.
- No other ignored ZIP is force-added.
- Backend, package.json, package-lock.json, and both live capability manifests remain protected.
- All retained R10/R9 verification, lint, typecheck, build, backend-integrity, staging-safety,
  commit and push gates remain in place.
- Existing unstaged frontend work is still backed up before release-owned files are copied.

This does not weaken `.gitignore`; it creates one intentional exception for the deployable
public Chrome extension package.
