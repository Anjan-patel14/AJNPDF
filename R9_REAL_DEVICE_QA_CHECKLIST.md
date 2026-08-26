# AJN PDF R9 real-device launch checklist

Run after the automated Windows release gates pass.

- Chrome desktop: home, search, all filters, Comfortable/Compact/List, at least one tool in every category.
- Edge desktop: same core smoke test and real file download.
- Android Chrome at 360px and a normal device width: horizontal cards, sticky search/filters, bottom navigation, no horizontal overflow.
- 200% browser zoom: navigation, upload controls, action buttons and result controls remain usable.
- Keyboard only: search, filters, file picker, settings, process, download/share and reset all have visible focus.
- Screen reader smoke test: tool headings, upload area, progress status, error message and result actions are announced meaningfully.
- Processing: no seconds counter; real percentage only where measurable; indeterminate state otherwise; Cancel only when actual cancellation is available.
- Files: valid small file, large supported file, invalid extension, damaged file, encrypted PDF and unsupported content.
- Network: server unavailable/timeout produces a clear retryable message and does not lose selected settings unnecessarily.
- Results: custom output names, real downloads, native share where supported, copy-tool-link fallback where file sharing is unavailable.
- Ads: no-consent and unfilled states do not leave permanent blank design gaps.
- Search Console after deploy: inspect home plus representative tool/category URLs, submit sitemap and monitor indexing/Core Web Vitals.
