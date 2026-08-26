# AJN PDF 3.1.0 R9.2 Verifier Context Hotfix

R9.2 fixes a release-verifier context bug discovered during the Windows R9.1 update.

- The release package must not contain generated backend capability manifests.
- The target Git repository must preserve its existing live `src/generated/backend-capabilities.json`.
- The R9 source verifier now distinguishes release-package mode from target-repository mode by the presence of `.git`.
- In release-package mode, bundled capability manifests remain forbidden.
- In target-repository mode, the existing live source capability manifest is required and accepted.
- The updater still does not copy, stage, or modify backend capability manifests.
- Backend, package.json and package-lock.json protections remain unchanged.
- All R9 UX, processing, search, sharing, SEO, accessibility and logic changes are unchanged.
