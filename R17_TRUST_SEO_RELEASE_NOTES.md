# AJN PDF R17 — Trust, Policy & Indexing Quality Closure

Base production commit: `085ee7250d4b753d49f0a53397c2c00a3fe7f342`

## What R17 changes

- Preserves the R16 canonical architecture (`www`, root tool routes, `/tools/:id -> /:id`).
- Corrects the stale File Processing Policy that still described 75 MB/file, 150 MB/request and a five-minute limit.
- Sources policy copy from the current centralized production constants (30 MB/file, 30 MB/request for the server-backed default; Merge keeps its separate browser-native policy).
- Updates the public security contact to `anjandev325@gmail.com`.
- Adds one shared hybrid-processing disclosure so future trust copy has a single wording source.
- Adds a modern processing-model section to About.
- Adds `/discover/guides`, a curated internal-linking and documentation hub for priority PDF, conversion, image, security and trust workflows.
- Keeps the R16 sitemap core-page invariant unchanged; the guide hub is discovered through strong internal links from About and every canonical tool editorial page.
- Adds a link from every tool editorial section back to the Discover guide library.
- Adds `verify:r17-trust-seo` and wires it into the existing `npm check`.
- Adds regression checks against stale universal claims such as `55+`, blanket `200 MB`, `100% local`, `zero-server-transit`, `files never leave`, and `no servers` on trust pages.
- Does not modify the backend, Cloud Run source, conversion registry, security engine, canonical redirect architecture, or existing 107-tool workspace implementation.

## Why this is the correct post-R16 change

Google Search Console data dated 14 Aug 2026 includes historical `/tools/...`, non-`www`, redirects and old cached copy. R16 went live on 17 Aug 2026 with canonical root routes and canonical-only sitemaps. R17 therefore strengthens trust content and internal crawl paths instead of changing URLs again.

## Search Console actions that remain manual

Search Console settings are not changed by this source package. In GSC:

1. Keep/submit only:
   - `https://www.ajnpdf.com/sitemap.xml`
   - `https://www.ajnpdf.com/image-sitemap.xml`
2. Remove webpage URLs that were incorrectly submitted as sitemaps (`/`, `/merge-pdf`, `/pdf-tools`, `/status`) and remove the incorrect `/robot.txt` submission.
3. Keep intentional permanent `/tools/... -> /...` redirects.
4. Inspect the three real `Redirect error` URLs and the three 404 URLs individually.
5. Request indexing only for a small priority set after R17 is live; do not manually submit all 107 tools.

## Deployment model

`R17_TRUST_SEO_SETUP_AND_DEPLOY.ps1`:

- works from a clean temporary Git worktree,
- leaves the user's dirty main worktree and stash untouched,
- requires the exact known production base commit before applying,
- uses `npm.cmd ci`, never `npm install`,
- runs R17 verification, R16 consistency, secrets, then the existing full `npm check`,
- pushes one normal fast-forward commit with `Anjan Kumar <anjandev325@gmail.com>`,
- checks the already-deployed Cloud Run backend but does not redeploy it,
- deploys only the frontend to Vercel using `--archive=tgz`,
- verifies critical live trust, guide, tool, sitemap and robots routes.
