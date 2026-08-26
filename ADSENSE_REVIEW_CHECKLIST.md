# AdSense Review Checklist

## Implemented in source

- Publisher: `ca-pub-4495802176396975`
- Homepage primary slot: `3648223351`
- Homepage secondary slot: `4849624383`
- Tool content slot: `1601180258`
- Valid root `ads.txt`
- Ownership meta tag
- Standard web AdSense only; no AMP ad code
- Ad requests restricted to `ajnpdf.com` and `www.ajnpdf.com`
- Manual placements occur after useful content and away from upload/process/download controls
- Legal, trust, status, account, error and internal routes are excluded
- Missing slots and localhost fail safely

## Required in the AdSense account

1. Deploy this exact production release first.
2. Confirm the site status can be reviewed and later becomes **Ready**.
3. Complete payment profile and any requested identity/address steps.
4. In **Privacy & messaging**, publish Google's certified consent message for applicable EEA, UK and Switzerland traffic.
5. Review Auto Ads. Prefer disabling Auto Ads for this tool application, or create exclusions so automatic placements cannot appear inside tool workspaces or near download controls.
6. Verify `https://www.ajnpdf.com/ads.txt` and the publisher ownership signal.
7. Test manual units only after consent on the live production domain.
8. Request review only after the real content, guides, legal pages, backend and public tools are deployed.

## Low-value-content corrections in this release

- Removed fabricated testimonials and counters.
- Removed unverified compliance, uptime and security badges.
- Replaced absolute “100% local/private” statements with processing-mode-specific language.
- Added original tool instructions, limitations, FAQs and related links before advertisements.
- Added five real workflow guides and controlled AJN-owned illustrations.
- Hidden unfinished converters from public navigation and SEO.

Ad approval is a Google account decision and cannot be guaranteed by source code.

## AJN Studio public-growth additions

- [ ] `/admin/media` and `/admin/analytics` are excluded from ad loading and indexing.
- [ ] Public image posts contain original useful captions, accurate alt text and no copied social-media content.
- [ ] Public media is not used to generate thin daily pages only for ads.
- [ ] `/developer`, `/ajn-studio` and `/discover` contain no fabricated popularity or ranking claims.
- [ ] Ad units remain absent from upload, processing, result, download, error, admin and legal surfaces.
