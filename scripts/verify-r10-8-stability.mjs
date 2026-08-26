import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const failures = [];
const check = (label, ok) => {
  if (ok) console.log(`PASS: ${label}`);
  else { console.error(`FAIL: ${label}`); failures.push(label); }
};

const home = read('src/app/page.tsx');
const hero = read('src/components/landing/hero.tsx');
const grid = read('src/components/landing/services-grid.tsx');
const layout = read('src/app/layout.tsx');
const activity = read('src/components/ajnpdf/processing-activity-provider.tsx');
const shared = read('src/components/junction/_shared.tsx');
const facts = read('src/components/ajn/tool-runtime-facts.tsx');
const limits = read('src/lib/tool-limits.ts');
const backendClient = read('src/lib/pdf-backend.ts');
const status = read('src/components/junction/backend-status.tsx');
const statusPage = read('src/app/status/page.tsx');
const footer = read('src/components/landing/main-footer.tsx');
const sitemap = read('src/app/sitemap.ts');
const seo = read('src/lib/seo-strategy.ts');
const nextConfig = read('next.config.ts');
const updaterExists = exists('APPLY_TEST_PUSH_FRONTEND.ps1');
const updater = updaterExists ? read('APPLY_TEST_PUSH_FRONTEND.ps1') : '';
const css = read('src/app/globals.css');
const sourceText = [home, hero, grid, layout, activity, shared, facts, limits, backendClient, status, footer, sitemap, seo, nextConfig, css,
  ...['en','hi','te','ta','kn'].map((code) => read(`src/i18n/locales/${code}.json`))].join('\n');

check('homepage renders one responsive Hero component', (home.match(/<Hero\s*\/>/g) || []).length === 1 && !home.includes('MobileHomeHero'));
check('homepage exposes exactly one primary search id', (home.match(/id="home-tool-search"/g) || []).length === 1 && !home.includes('mobile-home-tool-search'));
const removedTagline = ['Made Simple', 'by AJN PDF.'].join(' ');
check('old secondary AJN PDF tagline is removed from active source', !sourceText.includes(removedTagline));
check('root HTML is deterministic light markup without pre-hydration theme mutation', layout.includes('data-theme="light"') && layout.includes("style={{ colorScheme: 'light' }}") && !layout.includes('ajn-theme-bootstrap') && !layout.includes('suppressHydrationWarning'));
check('homepage processing provider no longer injects a global API preconnect', !activity.includes("rel = 'preconnect'") && !activity.includes('rel="preconnect"'));
check('mobile tool directory progressively renders 18 initial workflows', grid.includes('INITIAL_VISIBLE_TOOLS = 18') && grid.includes('VISIBLE_STEP = 18') && grid.includes('filteredTools.slice(0,visibleCount)'));
check('search still ranks the full workflow registry before progressive slicing', grid.indexOf('BUILD_PUBLIC_TOOLS.map') < grid.indexOf('filteredTools.slice') && grid.includes('searchScore'));
check('off-screen tool cards use content-visibility', css.includes('.ajn-progressive-tool-card') && css.includes('content-visibility: auto'));
check('per-tool runtime facts are mounted in the shared tool workspace', shared.includes('<ToolRuntimeFactsInline toolId={toolId} />'));
check('tool limit profiles use existing production policy instead of one invented global limit', limits.includes("getToolPolicy") && limits.includes("policy.maxFiles") && limits.includes("policy.maxFileSizeMb"));
check('server limit defaults are documented from current 3.1.0 backend defaults', ['maxFileSizeMb: 75','maxTotalSizeMb: 150','maxPdfPages: 300','maxImageMegapixels: 80','processingTimeoutSeconds: 300'].every((v) => limits.includes(v)));
check('server tool facts re-check the live readiness endpoint', facts.includes('checkPdfBackendHealth') && facts.includes('health.maxFileMb') && facts.includes('health.maxTotalMb') && facts.includes('health.processingTimeoutSeconds'));
check('backend readiness client exposes live limits and available conversion counts', ['maxFileMb','maxTotalMb','maxConcurrentJobs','processingTimeoutSeconds','conversionTools','availableConversionTools'].every((v) => backendClient.includes(v)));
check('status UI surfaces live backend capacity facts', status.includes('health.maxFileMb') && status.includes('health.availableConversionTools'));
check('status page auto-refreshes the live readiness check every 30 seconds', status.includes('window.setInterval') && statusPage.includes('autoRefreshMs={30000}'));
check('/limits production information page exists', exists('src/app/limits/page.tsx') && read('src/app/limits/page.tsx').includes('Fair-use and abuse protection'));
check('/ guide exists without fabricated universal accuracy percentage', exists('src/app//page.tsx') && read('src/app//page.tsx').includes('does not publish an unsupported universal accuracy percentage'));
check('product footer does not publish personal social handles as AJN PDF brand channels', !footer.includes('AJN_BRAND.social.instagram') && !footer.includes('AJN_BRAND.social.youtube'));
check('limits and  pages are linked from footer and sitemap', footer.includes("'/limits'") && footer.includes("'/'") && sitemap.includes('/limits') && sitemap.includes('/'));
check('security header set includes CSP, HSTS, nosniff, referrer, permissions and COOP', ['Content-Security-Policy','Strict-Transport-Security','X-Content-Type-Options','Referrer-Policy','Permissions-Policy','Cross-Origin-Opener-Policy'].every((v) => nextConfig.includes(v)));
check('HSTS is production-default but preload remains explicit opt-in', nextConfig.includes("process.env.AJN_ENABLE_HSTS !== 'false'") && nextConfig.includes("process.env.AJN_HSTS_PRELOAD === 'true'"));
check('Trusted Types is not forced before ad/analytics compatibility QA', !nextConfig.includes("require-trusted-types-for"));
check('tool SEO description generator includes tool-specific name/use case/benefit inputs', seo.includes('tool.name') && seo.includes('const useCase =') && seo.includes('const benefit ='));
check('all five UI locale dictionaries contain identical shared-key structures with at least the R10.8 baseline', (() => {
  const flatten = (obj, prefix = '', out = {}) => { for (const [k,v] of Object.entries(obj)) { const key = prefix ? `${prefix}.${k}` : k; if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v,key,out); else out[key]=v; } return out; };
  const dicts = ['en','hi','te','ta','kn'].map((code) => Object.keys(flatten(JSON.parse(read(`src/i18n/locales/${code}.json`)))).sort());
  return dicts[0].length >= 510 && dicts.slice(1).every((keys) => JSON.stringify(keys) === JSON.stringify(dicts[0]));
})());
const removedMetaName = ['next', 'size', 'adjust'].join('-');
check('no source-owned obsolete size-adjust metadata remains', !sourceText.includes(removedMetaName));
check('ad zones reserve layout and suppress scroll anchoring', css.includes('.ajn-ad-zone') && css.includes('contain: layout style') && /overflow-anchor:\s*none/.test(css));
check('built-production SSR/header verifier is present; package updater orders it before commit when available', exists('scripts/verify-r10-8-runtime.mjs') && (!updaterExists || (updater.includes('verify-r10-8-runtime.mjs') && updater.indexOf('verify-r10-8-runtime.mjs') < updater.indexOf('git -C $RepoPath commit -m'))));

if (failures.length) {
  console.error(`AJN PDF R10.8 stability verification failed: ${failures.length} gate(s).`);
  process.exit(1);
}
console.log('AJN PDF R10.8 STABILITY / MOBILE / TRUST SOURCE VERIFICATION: PASS');
console.log('27 source gates passed. Runtime browser QA remains required for hydration console, Core Web Vitals, CSP/ads and real-file workflows.');
