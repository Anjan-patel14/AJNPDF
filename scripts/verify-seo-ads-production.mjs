import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);
const failures = [];
const check = (label, ok) => ok ? console.log(`PASS: ${label}`) : failures.push(label);

const consent = read('src/lib/google-consent.ts');
const cookie = read('src/components/ui/cookie-consent.tsx');
const ga = read('src/components/analytics/google-analytics.tsx');
const site = read('src/components/analytics/site-analytics.tsx');
const ads = read('src/components/adsense-unit.tsx');
const loader = read('src/components/adsense-script-loader.tsx');
const next = read('next.config.ts');
const env = read('.env.example');
const layout = read('src/app/layout.tsx');
const sitemap = read('src/app/sitemap.ts');
const toolPage = read('src/app/(tool-pages)/[id]/page.tsx');
const workflow = read('.github/workflows/live-smoke.yml');
const seoAds = read('scripts/verify-seo-ads.mjs');

check('Consent Mode v2 defines all four Google consent signals',
  ['analytics_storage','ad_storage','ad_user_data','ad_personalization'].every((x) => consent.includes(x)));
check('Consent defaults are denied before optional analytics loading',
  consent.includes("'consent', 'default'") && ga.includes('installGoogleConsentDefault()'));
check('Consent choice updates Google consent state',
  cookie.includes('updateGoogleConsent(value)'));
check('GA4 remains privacy-first and requires accepted optional consent',
  ga.includes("consent !== 'accepted'") && ga.includes('allow_google_signals: false') && ga.includes('allow_ad_personalization_signals: false'));
check('Client error monitoring sends classifications only after consent',
  site.includes("'client_error'") && site.includes('classifyClientError') && !site.includes('error_message'));
check('Ad requests are near-viewport lazy loaded',
  ads.includes('IntersectionObserver') && ads.includes("rootMargin: '600px 0px'") && ads.includes('nearViewport'));
check('AdSense script is production-host and consent gated',
  loader.includes("host === 'ajnpdf.com'") && loader.includes("host === 'www.ajnpdf.com'") && loader.includes("ajn_cookie_consent"));
check('Preview/staging deployments are noindex by response header',
  next.includes('isIndexableDeployment') && next.includes('X-Robots-Tag') && next.includes('noindex, nofollow, noarchive'));
check('Google and Bing verification are environment-driven',
  layout.includes('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION') && layout.includes('NEXT_PUBLIC_BING_SITE_VERIFICATION') &&
  env.includes('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=') && env.includes('NEXT_PUBLIC_BING_SITE_VERIFICATION='));
check('AdSense public environment overrides are documented',
  env.includes('NEXT_PUBLIC_ADSENSE_CLIENT=') && env.includes('NEXT_PUBLIC_ADSENSE_SLOT_TOOL_CONTENT='));
check('Sitemap remains registry/inventory driven',
  sitemap.includes('BUILD_PUBLIC_TOOLS') && sitemap.includes('toolPath(tool.id)'));
check('Duplicate PDF utilities directory is retired to canonical PDF tools directory',
  next.includes("{ source: '/pdf-utilities', destination: '/pdf-tools', permanent: true }") &&
  !exists('src/app/pdf-utilities/page.tsx') &&
  !sitemap.includes('path:"/pdf-utilities"'));
check('Tool schema has no fabricated aggregate rating',
  toolPage.includes("'WebApplication'") && toolPage.includes("'BreadcrumbList'") && !toolPage.includes('aggregateRating'));
check('Live frontend verifier exists', exists('scripts/verify-live-frontend-production.mjs'));
check('Hourly live workflow keeps backend monitoring optional',
  workflow.includes("cron: '17 * * * *'") && workflow.includes('AJN_BACKEND_MONITOR_ENABLED'));
check('Old SEO/ads verifier no longer hard-codes 95 public tools',
  !seoAds.includes('Expected 95 current public tools'));

if (failures.length) {
  console.error('AJN PDF PRODUCTION SEO/ADS/ANALYTICS FOUNDATION: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('AJN PDF PRODUCTION SEO/ADS/ANALYTICS FOUNDATION: PASS');