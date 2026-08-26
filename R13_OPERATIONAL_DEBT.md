# AJN PDF R13 Operational Debt / Non-blocking Infrastructure Work

R13 intentionally does not rewrite the production backend or provision cloud resources from a frontend release package.

## Durable media / analytics

Temporary PDF-processing work files are allowed to be ephemeral. Long-lived public media, media metadata or analytics must not be described as durable if they still depend on Cloud Run `/tmp` or an ephemeral SQLite database.

Preferred future architecture:

- object storage for published media and thumbnails;
- durable database for public-media metadata;
- durable analytics store for long-lived analytics;
- migration/export procedure before changing storage;
- preserve current admin authentication contract without placing tokens in source.

## Admin/security external checks

Production admin/media/analytics secrets must be distinct where intended, rotated after any exposure, stored in deployment secret/environment configuration, never committed and never printed in public logs. Missing/wrong tokens should return 401 and admin pages should remain noindex/no-store.

## External release dependencies

Google recrawling, field Core Web Vitals, CMP/AdSense behavior and Chrome Web Store review cannot be truthfully completed by a source ZIP alone. The R13 installer/auditors report them as pending until the deployed environment is available.
