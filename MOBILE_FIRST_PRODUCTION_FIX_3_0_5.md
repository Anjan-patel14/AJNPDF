# AJN PDF 3.0.5 — mobile-first production update

## Implemented

- Phone homepage now begins with the public tool directory immediately below the fixed navigation.
- The desktop/tablet hero and format strip remain unchanged at `md` and larger widths.
- Mobile gets its own sticky tool search and horizontally scrollable category filter.
- Mobile tool cards use a compact two-column layout with larger tap targets and reduced visual noise.
- Tool availability continues to come from the generated backend capability manifest.
- Fixed the `processing-animation` hook dependency warning by moving the log sequence to a stable module constant.
- Added `verify:mobile-first` to the full production check pipeline.
- Setup now opens only the main website after success instead of launching many QA tabs.

## Production truth

Ghostscript-gated XPS/PostScript workflows remain unavailable unless Ghostscript licensing/installation is intentionally enabled. External deployment, DNS/TLS, Search Console, Core Web Vitals, CMP/AdSense review, and physical-device QA remain deployment gates rather than source-code claims.
