# AJN PDF 3.0 Production Deployment

## 1. Frontend environment

Deploy the Next.js project and configure:

```env
NEXT_PUBLIC_APP_URL=https://www.ajnpdf.com
NEXT_PUBLIC_PDF_BACKEND_URL=https://api.ajnpdf.com
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-4495802176396975
NEXT_PUBLIC_ADSENSE_SLOT_HOME_PRIMARY=3648223351
NEXT_PUBLIC_ADSENSE_SLOT_HOME_SECONDARY=4849624383
NEXT_PUBLIC_ADSENSE_SLOT_TOOL_CONTENT=1601180258
NEXT_PUBLIC_ADSENSE_SLOT_BLOG_CONTENT=
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
```

Use `https://www.ajnpdf.com` as the canonical host. The included Next.js redirect sends `ajnpdf.com` to the canonical host.

## 2. Backend environment

Deploy `backend/Dockerfile` with a persistent volume mounted at `/app/data`.

```env
AJN_MAX_FILE_MB=75
AJN_MAX_TOTAL_MB=150
AJN_ALLOWED_ORIGINS=https://www.ajnpdf.com,https://ajnpdf.com
AJN_ENABLE_HSTS=true  # set only after HTTPS is verified stable
AJN_RATE_LIMIT_PER_MINUTE=30
AJN_ANALYTICS_RATE_LIMIT_PER_MINUTE=120
AJN_ADMIN_RATE_LIMIT_PER_MINUTE=10
AJN_MAX_CONCURRENT_JOBS=4
AJN_PROCESSING_TIMEOUT_SECONDS=300
AJN_ANALYTICS_ENABLED=true
AJN_ANALYTICS_RETENTION_DAYS=90
AJN_ANALYTICS_ADMIN_TOKEN=generate-a-long-random-token
AJN_MEDIA_ADMIN_TOKEN=generate-a-different-long-random-token
AJN_TRUST_PROXY_HEADERS=false
AJN_TRUSTED_PROXY_IPS=127.0.0.1,::1
AJN_ANALYTICS_DB=/app/data/ajn_analytics.sqlite3
AJN_PUBLIC_MEDIA_DB=/app/data/ajn_public_media.sqlite3
AJN_PUBLIC_MEDIA_ROOT=/app/data/public_media
AJN_PUBLIC_IMAGE_MAX_MB=12
AJN_PUBLIC_IMAGE_MAX_PIXELS=50000000
```

Enable proxy headers only when the hosting provider's trusted proxy addresses are explicitly configured. Conversion uploads use temporary directories and must not be written to persistent storage.

## 3. Capability manifest

Run `backend/export_capabilities.py` in the deployment environment before the frontend production build. The generated manifest controls which server-assisted tools appear in public navigation, static paths and the sitemap. Dependency-missing tools remain unavailable and do not receive advertisement placements.

## 4. Persistent data

Persist and back up:

- `/app/data/ajn_analytics.sqlite3`
- `/app/data/ajn_public_media.sqlite3`
- `/app/data/public_media`

The package includes `BACKUP_RUNTIME_DATA.ps1` and `RESTORE_RUNTIME_DATA.ps1` for local Windows data. Use provider snapshots or an external durable store in production.

## 5. AdSense

The source includes the publisher ID, three configured slots, ownership metadata, root `ads.txt`, page exclusions and consent-aware loading. Google account configuration is still required:

1. Add and verify `ajnpdf.com` in AdSense.
2. Configure Privacy & messaging or another Google-certified CMP where required.
3. Confirm `/ads.txt` is public and authorized.
4. Test consent choices and production-domain ad requests.
5. Request review only after public tools, original content and legal pages are live.

The source intentionally does not send a static domain-allowlist CSP header because Google documents that AdSense domains change and supports strict nonce-based CSP integration. Add a nonce-based CSP only after implementing and testing it with Next.js and the deployed AdSense tag.

## 6. Required post-deployment tests

- `/health`, `/ready` and `/api/tools`
- A real file for every publicly available tool
-  in English, Hindi, Telugu, Tamil, Kannada and Malayalam
- Protect, Unlock and Repair PDF
- Office and eBook conversions
- Backend timeout, rate-limit and unavailable states
- `/developer`, `/ajn-studio`, `/discover`, `/admin/media` and `/admin/analytics`
- `/ads.txt`, `/robots.txt`, `/sitemap.xml`, `/image-sitemap.xml` and `/feed.xml`
- Dark/light themes at 100%, 110%, 125% and 150% zoom
- Mobile widths 360, 390 and 430 pixels
- Search Console indexing and real Core Web Vitals
