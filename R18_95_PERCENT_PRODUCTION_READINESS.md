# AJN PDF R18 — 95% Technical Production Readiness

## Objective
R18 closes measurable production-consistency gaps without pretending that code changes alone create iLovePDF-level brand authority.

## Closed in R18
- Align backend fallback request limits with the live/frontend 30 MB / 30 MB contract.
- Remove stale claims that every tool visibly shows numeric processing limits.
- Keep safety limits enforced internally and retain the dedicated `/limits` policy page.
- Remove the remaining visible `Maximum 40 MB` helper from Compress PDF.
- Make Compare PDF validate the file extension, safety size and real `%PDF-` header instead of depending on browser MIME metadata.
- Approve the exact locked `unrs-resolver` install-script version and make the dependency verifier derive that version from `package-lock.json`.
- Harden GitHub production CI with dependency, secret, trust, UX, mobile, i18n, accessibility and R18 regression gates.
- Retain the R17.2 same-origin PDF.js worker regression protection.
- Update release metadata to R18.

## Intentionally not claimed as complete
These require separate evidence or product work and are not hidden by the 95% technical-readiness label:
- Google Search Console recrawl/index cleanup of historical cached `/tools/*` and old trust copy.
- Structure-preserving PDF compression comparable with mature commercial PDF engines.
- High-fidelity PDF-to-Word/Excel editable reconstruction and advanced table recognition.
- Native mobile/desktop apps, cloud-drive integrations, external security certifications and long-term brand authority.

## R18.1 quality milestone
Prioritize representative conversion fixtures and output-quality scoring for Compress PDF, PDF to Word, PDF to Excel,  and Compare PDF before claiming a 9.5/10 overall market-product rating.
