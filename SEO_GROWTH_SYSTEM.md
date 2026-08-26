# AJN PDF SEO Growth System

## Objective
Build sustainable organic discovery for working PDF, document, image and  workflows. This system does not promise a first-place ranking. Google decides crawling, indexing and ranking, and deployment quality plus real authority are still required.

## 1. ICP and job mapping

| Segment | Primary jobs | High-priority entry pages |
|---|---|---|
| Students and applicants | Merge assignments, compress applications, convert scans, create PDFs from images | Merge PDF, Compress PDF, Scanned PDF to Word, JPG to PDF |
| Professionals and office teams | Convert office files, extract tables, organize and secure PDFs | Word to PDF, PDF to Excel, Organize PDF, Protect PDF |
| Small businesses and operations | Process receipts, email files, searchable archives and invoices | Receipt to PDF, EML to PDF, Searchable PDF, Compress PDF |
| Creators and marketing teams | Convert image formats, export PDF pages and combine assets | PNG to PDF, PDF to PNG, WEBP to PDF, Images to PDF |

## 2. Search intent architecture

- Transactional: one canonical page per working tool.
- Informational: original workflow guides that explain preparation, processing, validation and limitations.
- Comparison: honest evaluation pages based on capabilities, privacy labels and output testing—not attacks on competitors.
- Troubleshooting: error explanations, dependency requirements and output-quality guides.

Every public tool receives a generated primary keyword, related terms, question topics, audience mapping, canonical URL, unique title, description, FAQ, HowTo steps, SoftwareApplication data and related internal links.

## 3. On-page SEO

- One descriptive H1 per page.
- Unique title and meta description generated from the actual tool registry.
- File requirements, instructions, use cases, limitations and FAQs rendered server-side.
- Breadcrumb, FAQ, HowTo and software application structured data.
- Category hubs for Conversion, Image and PDF intent clusters.
- AJN-owned Open Graph image and descriptive alternative text.
- No fake usage numbers, fake reviews, compliance badges or guaranteed output claims.

## 4. Content engine

Published pages stay limited to reviewed, useful guides. `src/lib/content-engine.ts` contains the editorial queue and quality gate. New pages must provide real examples, screenshots, limitations, related tools and a reason to exist beyond targeting a keyword.

Recommended cadence after launch:

1. Update one high-impression tool page each week using Search Console query data.
2. Publish one fully reviewed workflow guide every two weeks.
3. Refresh screenshots and output examples whenever a converter changes.
4. Consolidate or noindex pages that remain thin, duplicated or unsupported.

## 5. Internal linking

- Category hub → tool pages.
- Tool page → six contextually related tools.
- Tool page → two relevant guides.
- Guide → primary tool, supporting tools and relevant security/processing policies.
- Footer → category hubs, guides, trust and legal pages.
- Legacy duplicate URLs permanently redirect to one canonical page.

## 6. Authority and backlinks

Backlinks cannot be created automatically in source code. The included authority plan focuses on legitimate assets: conversion compatibility reports,  language test sets, public output-quality methodology, developer documentation and useful guides. Avoid purchased links, automated directory spam and fake mentions.

## 7. Technical and UX SEO

- Next.js static generation for public tool pages.
- Canonical HTTPS domain and permanent www redirect.
- Generated robots and sitemap.
- Private/admin routes blocked from indexing.
- Responsive layouts for mobile and browser zoom.
- Reduced-motion support.
- Local images and optimized fonts.
- Core Web Vitals field collection after optional consent.
- No advertisements inside upload, processing, result or download controls.

## 8. CRO system

The anonymous funnel measures:

- Page view
- Tool open
- Tool start
- Tool complete
- Tool error
- Download
- Conversion backend success/failure
- Core Web Vitals

Use the private `/admin/analytics` page to find high-traffic pages with low starts, high starts with low successful outputs, and successful outputs with low downloads. Improve instructions and controls before increasing advertising.

## 9. External setup required

- Deploy `https://www.ajnpdf.com` and the Python API over HTTPS.
- Verify the domain in Google Search Console.
- Submit `https://www.ajnpdf.com/sitemap.xml`.
- Add a GA4 web stream ID only if optional analytics is desired.
- Configure a Google-certified consent solution where applicable.
- Validate structured data and live URLs.
- Monitor Search Console queries, pages, countries, indexing and Core Web Vitals.

## 10. Success metrics

Track non-branded impressions, indexed working-tool pages, click-through rate, successful output rate, download rate, repeat usage, LCP, INP and CLS. Rankings are outcomes—not configuration settings.
