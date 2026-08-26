# AJN PDF 3.1.0 R13 — Production Final Hardening

R13 is a cumulative **frontend, routing, workflow UX, verification and growth hardening** release built on the R12 root-route architecture. It does not replace the current production Docker configuration, backend capability manifests, production secrets or environment files.

## Implemented in source

- Canonical root tool URLs remain the only public 200 tool pages; `/tools/*` is redirect compatibility only.
- All 107 public tools remain addressable even when a server dependency is temporarily unavailable; capability state controls processing, not SEO route existence.
- Retired historical PSD-to-PDF has an intentional 410 endpoint instead of an unrelated redirect.
- Compact professional header, 1180px desktop breakpoint, direct Merge/Split/Compress links, complete Convert menu and searchable nine-dot All Tools dialog.
- Fluid hero/grid CSS with no global `zoom`, small-phone guards, one-column phone cards, progressive 18-tool reveal, `content-visibility` reservation and reduced-motion behavior.
- One AJN blue primary-action system with explicit success/warning/error/disabled tokens and stronger selected filter state.
- `/status` has Checking, Operational, Degraded and Unavailable states, last-checked information and capability counts.
- Tool workspaces surface actual per-tool upload limits before selection and prevent server-assisted uploads while the backend is unavailable; browser-local tools remain usable.
- Cancellation has explicit Cancelling/Cancelled states and uses the existing request/engine abort path where supported. Numerical progress is only shown when a real value exists.
- Priority SEO titles/descriptions were rewritten naturally; generic SEO descriptions no longer use keyword-stuffed “helps with” templates.
- Existing tool/editorial copy was cleaned of audited universal local-only claims and six-language  wording was aligned with the supported set.
- Eight new practical guides were added, for 13 substantive guides total, with unique metadata and contextual tool/guide linking.
- R13 automated source, built-runtime, live-route, capability, browser-PDF and optional real Chrome/Edge layout audits were added.
- R13 release marker `ajn-release=3.1.0-r13` allows the post-deploy audit to prove that Vercel is serving the intended release.

## Production-final rule

A local build PASS is not a live production PASS. R13 may be committed and pushed after local gates pass, but the release report must keep live deployment, browser rendering, field Core Web Vitals, consent/AdSense behavior, Search Console recrawl and external Chrome Web Store review as PENDING until each has actually been verified.
