# AJN PDF Production Gates 2-15

This release uses one current production contract: 26 public PDF-focused workflows, canonical host `https://www.ajnpdf.com`, browser-local processing where declared, and temporary server processing for Protect PDF, Unlock PDF, and Repair PDF.

## Gate contract

| Gate | Contract | Automated verifier |
|---|---|---|
| 2 | Public PDF tool functionality and browser PDF operations | `verify-r24-public-tools`, browser image-to-PDF, R13 browser PDF acceptance, full editor browser suite |
| 3 | Canonical URLs, robots and sitemap integrity | sitemap generator + `verify-sitemap-indexing` + live gate |
| 4 | Unique tool metadata and search intent | R20 focused SEO + professional SEO |
| 5 | Useful tool-page content and disclosure | current product integrity verifier |
| 6 | Internal links and route architecture | `verify-links` |
| 7 | Organization/WebSite/WebApplication/Breadcrumb structured data | professional SEO + live page identity |
| 8 | Build/performance safeguards | current performance verifier + production build |
| 9 | Mobile/accessibility/language integrity | mobile-first + accessibility + i18n |
| 10 | Dependency, secret, privacy and trust hardening | dependency policy + secret scan + R18 + R17 |
| 11 | Backend contracts, health-aware server tools and capabilities | R16 + backend workflow + capability manifest + conversion accuracy + Docker gate |
| 12 | Consent-aware GA4/Web Vitals and privacy-safe analytics | current analytics verifier |
| 13 | Google/Bing technical search readiness | sitemap/indexability + live gate |
| 14 | Search-intent guides supporting core tools | SEO growth V2 |
| 15 | Release inventory and final regression | R19 + tool UX + final UI + lint + typecheck + production editor + runtime |

## Commands

Source checks only:

```powershell
npm ci --no-audit --no-fund
npm run verify:gates:source
```

Full local production acceptance:

```powershell
.\RUN_AJN_PDF_GATES_2_15.ps1
```

After the tested commit is deployed to the canonical domain:

```powershell
.\RUN_AJN_PDF_GATES_2_15.ps1 -SkipInstall -SkipPlaywright -Live
```

Google Search Console and Bing Webmaster Tools are external systems. Gate 13 verifies technical readiness and live indexability, but no source-code gate can guarantee indexing position or ranking. Submit the canonical sitemap and monitor coverage/search performance after deployment.

## Verified push

After the full local gate report is PASS and these files are inside the Git clone for `Anjan-patel14/AJNPDF`:

```powershell
.\PUSH_AJN_PDF_AFTER_GATES.ps1
```

The push script is fail-closed: it refuses to push unless the full gate report is PASS, uses the configured AJN PDF SSH key, never force-pushes, and verifies the final remote hash.
