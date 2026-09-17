# AJN PDF AdSense Review Checklist

Updated: 17 September 2026

## Implemented in source

- Publisher account signal: `ca-pub-4495802176396975`
- Root `ads.txt`: `google.com, pub-4495802176396975, DIRECT, f08c47fec0942fa0`
- AdSense ownership meta tag in global metadata
- Canonical host: `https://www.ajnpdf.com`
- Apex `ajnpdf.com` permanently redirects to the `www` host
- Ad requests are limited to eligible public content/tool pages on the production host
- Manual ad units are outside upload, processing and download controls
- Legal, admin and internal application surfaces are not intended for ads
- Current privacy copy distinguishes browser processing from temporary online processing
- Public PDF tools expose original instructions, limitations, practical tips and FAQs
- Legacy image/conversion routes are redirected away from the focused PDF catalog
- PDF tool artwork now uses simple, consistent Lucide line icons instead of decorative/raster card artwork

## Low-value-content cleanup in this release

- Near-duplicate Merge guides redirect to the stronger canonical Merge guide.
- Near-duplicate Compress guides redirect to the stronger compression guide.
- Near-duplicate Edit guides redirect to the primary PDF editor guide.
- Near-duplicate Split guides redirect to the retained page-extraction guide.
- Redirected duplicate guides were removed from `sitemap.xml`.
- Thin utility routes such as `/status`, `/changelog` and `/discover/guides` are excluded from the sitemap and return `X-Robots-Tag: noindex, follow`.
- Redirect-only routes such as `/pricing` and `/ajn-studio` are not submitted in the sitemap.
- Sitemap entries now focus on canonical public PDF tools, substantial guides, trust/legal pages and core product pages.

## Google requirements that still need account-side setup

1. In AdSense → **Privacy & messaging**, publish a Google-certified CMP message for applicable EEA, UK and Switzerland traffic before personalized ad serving.
2. Review Auto Ads. For a PDF application, prefer manual placements or configure exclusions so ads never appear inside upload, processing, result or download interaction areas.
3. Confirm `https://www.ajnpdf.com/ads.txt` returns HTTP 200 and the exact publisher line above.
4. Confirm the live production site is the same release that passed CI.
5. In Search Console, inspect the homepage plus Merge PDF, Compress PDF, Edit PDF and Split PDF after deployment. Confirm Google sees rendered content and the expected canonical URL.
6. Resubmit the sitemap after the redirects are live.
7. Allow Google to recrawl the changed pages before requesting another AdSense review.
8. Only then tick **I confirm that I have fixed the issues** in AdSense.

## Manual quality check before review

- Open at least 10 public tools on mobile and desktop.
- Confirm upload, processing, result and download actions work and do not overlap ads.
- Confirm no placeholder text, test counters, fake testimonials, fabricated reviews or unsupported security claims are visible.
- Confirm About, Contact, Privacy, Terms, Cookies and File Processing Policy are reachable from normal navigation/footer paths.
- Confirm the site does not advertise old image/OCR/converter catalogs as part of the current AJN PDF public product.
- Confirm duplicate guide URLs return permanent redirects to the intended canonical article.

## Commands

Start local preview:

```powershell
powershell -ExecutionPolicy Bypass -File .\START_AJN_PDF_LOCAL.ps1
```

Run the AdSense/SEO release checks:

```powershell
powershell -ExecutionPolicy Bypass -File .\CHECK_ADSENSE_SEO_READY.ps1
```

AdSense approval is ultimately a Google review decision and cannot be guaranteed by source code alone.
