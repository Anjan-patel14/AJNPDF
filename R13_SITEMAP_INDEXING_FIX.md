# AJN PDF R13 Sitemap & Indexing Fix

This hotfix keeps the existing R13 root-route architecture and applies only sitemap/indexing hygiene:

- temporary backend capability outages no longer force established public tool pages to `noindex`;
- `/sitemap.xml` is deterministic and contains static pages, guides, and canonical root tool URLs only;
- every sitemap URL receives a Git-history-derived `lastModified` value;
- `/image-sitemap.xml` keeps `image:image` + `image:loc` and removes deprecated title/caption tags;
- `www.ajnpdf.com` remains the canonical host;
- `/tools/*` stays out of sitemaps and remains crawlable for permanent redirects;
- `/admin/` remains robots-disallowed as a discovery preference while authentication/authorization remains the security boundary;
- prebuild verification and live sitemap/runtime auditing are added.

No sitemap index, News sitemap, Video sitemap, hreflang routes, or fake priority engineering is added.
