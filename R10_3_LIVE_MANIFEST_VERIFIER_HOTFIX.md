# AJN PDF 3.1.0 R10.3 - Live Capability Manifest Verifier Hotfix

## Why R10.2 stopped

R10.2 correctly preserved the production repository's live capability manifests, but the retained R9 source verifier still applied the **release-bundle rule** while running inside the installed Git repository. That created a contradiction:

- downloadable release bundle: must **not** ship generated backend capability manifests;
- installed production repository: must **retain** its real generated capability manifests.

The R10.2 log therefore stopped before lint, typecheck, build, staging, commit, or push.

## R10.3 correction

`verify-r9-final-production.mjs` is now context-aware:

- outside a Git repository (release bundle), capability manifests remain forbidden;
- inside the installed Git repository, both live manifests must remain present;
- their actual timestamps/counts/backend capability data are still validated by the existing `npm run verify:capabilities` gate later in the updater.

The updater still excludes both live capability manifests from copy and staging, and still protects backend, `package.json`, and `package-lock.json`.

R10.3 can safely be run after the interrupted R10.2 attempt. It creates another pre-existing frontend safety backup, reapplies the release-owned frontend/extension files, removes interrupted R10.1/R10.2 hotfix metadata from the target, and only commits/pushes after every production gate passes.
