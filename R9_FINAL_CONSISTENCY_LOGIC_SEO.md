# AJN PDF 3.1.0 R9 — final consistency, logic and SEO update

R9 is a frontend-only production update built from the R8.3 source line. It does not modify the Python backend, package.json, package-lock.json, or the target repository's verified backend capability manifests.

## Product and UI
- Hero: “Work Smarter with Powerful PDF Tools. Fast, clear file workflows.”
- 100+ wording is used for marketing while the live directory can show the exact available count.
- Decorative wave, blob, radial glow and large circle layers were removed from public page backgrounds and tool cards; surfaces now use restrained white/neutral gradients.
- Plain-white tool icon surfaces remain; mobile cards are compact horizontal rows.
- Desktop directory offers Comfortable, Compact and List layouts, and remembers the selection.
- Search adds intent aliases, token scoring and small typo tolerance.
-  & Scan, Edit, Organize and Security intent filters supplement the primary categories.
- Legacy giant tool radii and excessive drop-zone treatments were reduced to the shared product surface system.
- Older legal-page wave artwork and unused legacy decorative CSS were flattened to simple neutral backdrops.
- Unused legacy product/architecture visuals with outdated processing wording were removed; the social preview now uses the current Work Smarter / 100+ positioning.
- Public dark-mode class variants and global dark CSS were removed; the site remains light-only.

## Processing and workflow logic
- Merge, Split, Compress, Images to PDF and PDF to JPG use the shared full-page processing lifecycle.
- Additional local image//archive tools dispatch the same lifecycle around final processing work.
- Remaining timer-simulated progress in Smart Read, Meme Maker, Resize Image and Reduce Image is removed.
- Real progress percentages are displayed only when a tool reports measurable progress; otherwise the status is indeterminate.
- Server requests can be aborted when the request owns its AbortController; engine jobs expose Cancel when a real job ID exists.
- Crop PDF no longer invokes Split PDF, uses actual page dimensions, and applies crop boxes in one processing path.
- Share result distinguishes native “Share file” from a “Tool link copied” fallback.
- Empty/unfilled AdSense units collapse after Google reports an unfilled slot.

## Copy and SEO
- Main tool copy was reduced to plain user-facing language; audited developer-style phrases were removed from visible tool content.
- Tool JSON-LD uses WebApplication + BreadcrumbList and removes synthetic HowTo/FAQ rich-result markup and invented completion time.
- Root SearchAction was removed because the declared target did not represent a dedicated searchable results URL.
- Tool titles avoid duplicating the global “| AJN PDF” template.
- Robots, canonical metadata, sitemap generation, Search Console verification wiring and Web Vitals analytics remain in place.
- No ratings, testimonials, user counts, “No limits”, “100% secure”, or ranking guarantees are fabricated.
- SEO implements descriptive unique titles, crawlable canonical URLs, sitemaps, WebSite/SoftwareApplication/Breadcrumb structured data, Search Console verification wiring and Web Vitals measurement; no #1-ranking promise is made.

## Release gates
The Windows updater runs R9 source verification, backend byte-integrity checks, routes, accessibility guardrails, mobile layout, five-language parity, tool workflow verification, theme/analytics, code quality, SEO gates, live capability verification, ESLint, TypeScript and a production Next.js build before commit/push.

Manual rendered QA on real browsers and devices remains a required launch gate.
