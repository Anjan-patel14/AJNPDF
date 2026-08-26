# AJN PDF Search and Analytics Setup

## Environment variables

- `NEXT_PUBLIC_APP_URL=https://www.ajnpdf.com`
- `NEXT_PUBLIC_PDF_BACKEND_URL=https://api.ajnpdf.com`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=` optional HTML-tag token
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID=` optional GA4 web measurement ID

## Search Console

1. Add and verify the `ajnpdf.com` domain property using DNS.
2. Test the homepage, category hubs and highest-priority tools with URL Inspection.
3. Submit `https://www.ajnpdf.com/sitemap.xml`.
4. Review indexing exclusions before requesting broad indexing.
5. Monitor queries and pages; use actual impression data to update titles and content.

## Analytics

1. Create a GA4 property and Web data stream only if desired.
2. Put its `G-...` measurement ID in the production environment.
3. Confirm no optional measurement request occurs before consent.
4. Use Search Console as the source of truth for Google Search performance and analytics for on-site behavior.
5. Use `/admin/analytics` for privacy-minimized conversion, page and Web Vitals aggregates.

## Brand and image discovery

- [ ] Verify `/developer` ProfilePage and portrait preview.
- [ ] Verify `/ajn-studio` Organization structured data.
- [ ] Verify `/discover` CollectionPage and an individual ImageObject page.
- [ ] Submit `/image-sitemap.xml` alongside `/sitemap.xml`.
- [ ] Verify `/feed.xml`.
- [ ] Confirm public media is delivered from the canonical AJN PDF domain.
- [ ] Inspect AJN, AJN PDF and AJN Studio branded pages in Search Console.
