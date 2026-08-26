# AJN PDF R13 Production Final Checklist

## Release-blocking local gates

- R13 / R12 / R11 / R10.8 / R10.9 / R9 source contracts
- 107 canonical root tool IDs and zero active `src/app/tools` route pages
- Historical alias policy including intentional PSD 410
- Five-locale key parity
- Stale universal-claim scan
- Capability manifest validation and exact unavailable-capability report
- ESLint
- TypeScript
- Real browser-local PDF merge/split/organize/rotate acceptance
- Next.js optimized production build
- Built-runtime 107 canonical pages + 107 legacy redirects + sitemap/canonicals
- Chrome/Edge headless layout audit when a local browser is available
- Backend source Git state unchanged by the frontend package

## Post-deploy live gates

- Homepage exposes `ajn-release=3.1.0-r13`
- www canonical host
- 107 root pages return 200 with self canonicals
- 107 `/tools/*` URLs return one-hop permanent redirects
- Historical aliases are intentional and direct
- `/psd-pdf` returns intentional 410
- sitemap has all root tools and no `/tools/` tool URLs
- public trust pages do not serve audited stale claims
- robots, image sitemap, status, limits,  and blog respond successfully
- Chrome and Edge rendered interaction QA
- 100/110/125/150/200% zoom/reflow QA
- mobile 320–412px, tablet and desktop layout QA
- Merge/Protect/Unlock/ real server-assisted workflow checks
- backend healthy/degraded/offline UI checks
- cancellation behavior against real requests
- Core Web Vitals measurement
- CMP / AdSense / CSP live verification
- Search Console updated sitemap and priority URL inspection

## External / operational items that may remain pending

- Google recrawl/index cleanup time
- Chrome Web Store external review
- durable migration of long-lived analytics/public-media data if those subsystems still use Cloud Run ephemeral storage
- future accounts, API, batch, PWA, paid plans and AI features
