# AJN PDF 3.1.0 R12 — Root Tool Routes + Professional Navigation

## Release goal

R12 removes `/tools/` from public tool URLs and makes AJN PDF navigation faster and easier to scan without changing the internal tool registry or backend processing contracts.

## Public URL model

Canonical tool URLs now use the site root:

- `/merge-pdf`
- `/split-pdf`
- `/compress-pdf`
- `/pdf-to-word`
- `/jpg-to-pdf`

The Next.js source stays organized with the URL-neutral route group `src/app/(tool-pages)/[id]`.

All historical `/tools/<id>` URLs permanently redirect to their root equivalents. Known historical aliases redirect directly to the canonical root slug to avoid redirect chains. `/tools` itself redirects to `/pdf-tools`.

## Header and all-tools navigation

The global header now provides one-click desktop access to Merge PDF, Split PDF and Compress PDF, a focused Convert menu, an  & Scan shortcut, Search, Language and a nine-dot All Tools launcher.

The All Tools launcher opens a responsive searchable mega-menu over the current public tool registry. Results are grouped by workflow family and support intent-style searches such as `combine pdf`, `make pdf smaller`, `scan text`, `photo pdf`, `word`, `spreadsheet`, `slides`, `password`, and `reorder pages`.

Hundreds of tool links are not eagerly prefetched. A tool route is prefetched when the user points to or focuses it, keeping the menu responsive without creating a large navigation burst.

On mobile the header stays compact and the All Tools launcher becomes an icon-first full-height panel.

## SEO and routing migration

R12 updates tool metadata, canonical URLs, WebApplication/Breadcrumb structured data, sitemap tool URLs, related-tool links, homepage links, search results, editorial/blog links, analytics route detection and Chrome extension tool links to root-level URLs.

The migration keeps permanent redirects for old URLs so existing bookmarks, backlinks and indexed URLs continue to resolve.

## Chrome extension

The extension now opens `https://www.ajnpdf.com/<tool-id>` directly. Both extension ZIP copies are rebuilt from the current extension source so the downloadable package matches the website route model.

## Safety

R12 is a frontend/navigation release. The installer does not overwrite backend source, backend Docker files, environment files, capability manifests, or production secrets.

The Windows updater creates a safety patch/status snapshot before changing files, backs up overwritten R12-owned files, runs source gates, ESLint, TypeScript and a Next.js production build, runs built-runtime redirect/canonical checks, stages only the declared frontend release surface, refuses unrelated staged files, and never uses `git reset --hard`, `git clean`, or force-push.

## Runtime acceptance

After a successful build the R12 runtime verifier checks:

- `/tools` permanently redirects to `/pdf-tools`.
- `/tools/merge-pdf` permanently redirects to `/merge-pdf`.
- `/tools/pdf-jpg` permanently redirects directly to `/pdf-to-jpg`.
- Merge PDF HTML publishes the root canonical/schema URL only.
- `sitemap.xml` contains root tool URLs and does not publish legacy `/tools/` tool URLs.

Live Vercel/browser QA remains the final deployment check for keyboard/focus behavior, hydration console output and field Core Web Vitals.
