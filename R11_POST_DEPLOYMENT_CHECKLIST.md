# AJN PDF R11 Post-Deployment Checklist

1. Run `node scripts/audit-r11-live-site.mjs` after the production deployment is live.
2. Confirm `https://ajnpdf.com/*` redirects permanently to `https://www.ajnpdf.com/*`.
3. Confirm homepage source shows the R11 H1/title/meta and no old AJN Studio local-only copy.
4. Confirm `/privacy`, `/about`, `/faq`, `/transparency`, `/pdf-tools` return the new production source.
5. Confirm `/sitemap.xml`, `/image-sitemap.xml`, `/robots.txt`, `/feed.xml` return 200 and use the www canonical host.
6. Confirm `/admin/media` and `/admin/analytics` send `X-Robots-Tag: noindex` and `Cache-Control: no-store`.
7. Confirm CSP, nosniff, Referrer-Policy and Permissions-Policy headers are present.
8. Test one browser-only tool, one temporary-server conversion, Protect PDF, Unlock PDF and Repair PDF with real files.
9. Test Chrome and Edge hard refresh and route navigation with zero hydration/chunk errors.
10. Test mobile widths 360/390/430 and 200% text zoom.
11. In Search Console, inspect homepage, `/privacy`, `/about`, `/faq`, `/transparency`, `/pdf-tools` and the formerly stale tool URLs; request indexing only after live tests pass.
12. Open Page Indexing -> Not indexed and classify the 49 URLs by reason instead of resubmitting every route.
13. Validate ImageObject fixes after Google recrawls Discover pages.
14. Verify production analytics/media admin secrets on the deployed backend; rotate any old exposed token.
15. Do not rely on container-local SQLite/media for durable publishing. Configure managed durable storage plus backup/restore before treating Discover history or analytics as persistent.
16. Complete AdSense/CMP browser QA and Chrome Web Store manual review only after the live audit passes.
