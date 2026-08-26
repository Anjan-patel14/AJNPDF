import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const pass = (message) => console.log(`PASS: ${message}`);
const fail = (message) => failures.push(message);
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const check = (message, ok) => ok ? pass(message) : fail(message);

const ids = JSON.parse(read('scripts/r13-public-tool-ids.json'));
const globals = read('src/app/globals.css');
const navbar = read('src/components/landing/navbar.tsx');
const allTools = read('src/components/landing/all-tools-menu.tsx');
const hero = read('src/components/landing/hero.tsx');
const services = read('src/components/landing/services-grid.tsx');
const status = read('src/components/junction/backend-status.tsx');
const statusPage = read('src/app/status/page.tsx');
const shared = read('src/components/junction/_shared.tsx');
const activity = read('src/components/ajnpdf/processing-activity-provider.tsx');
const seo = read('src/lib/seo-strategy.ts');
const editorial = read('src/lib/tool-editorial.ts');
const buildPublic = read('src/lib/build-public-tools.ts');
const routes = read('src/lib/tool-routes.ts');
const nextConfig = read('next.config.ts');
const sitemap = read('src/app/sitemap.ts');
const packageJson = JSON.parse(read('package.json'));

check('canonical tool inventory remains substantial and unique', ids.length >= 90 && new Set(ids).size === ids.length);
check('root-level URL-neutral tool page exists', exists('src/app/(tool-pages)/[id]/page.tsx'));
check('legacy src/app/tools route folder is absent', !exists('src/app/tools'));
check('all public workflows remain routable even when an online capability is temporarily unavailable', buildPublic.includes('export const BUILD_PUBLIC_TOOLS = PUBLIC_TOOLS'));
check('reserved route protection includes retired PSD URL', routes.includes("'psd-pdf'"));
check('PSD historical URL has explicit redirect and 410 retired endpoint', nextConfig.includes("'psd-pdf': 'psd-pdf'") && nextConfig.includes('directLegacyToolRedirects') && exists('src/app/psd-pdf/route.ts') && read('src/app/psd-pdf/route.ts').includes('status: 410'));
check('all legacy tool URLs use permanent root redirects', nextConfig.includes("source: '/tools/:id'") && nextConfig.includes("destination: '/:id'") && nextConfig.includes('permanent: true'));
check('sitemap builds canonical root tool URLs', sitemap.includes('toolPath(tool.id)') && !sitemap.includes('`${SITE_URL}/tools/'));

check('global CSS zoom hack is absent', !/\bzoom\s*:/i.test(globals));
check('R13 single-brand visual tokens exist', globals.includes('--ajn-primary: #2563eb') && globals.includes('--ajn-success:') && globals.includes('--ajn-warning:') && globals.includes('--ajn-error:'));
check('R13 content-visibility reserves intrinsic card size', globals.includes('content-visibility: auto') && globals.includes('contain-intrinsic-size: auto'));
check('Show-more cards have subtle reveal motion', services.includes('ajn-tool-card-enter') && globals.includes('@keyframes ajn-r13-card-enter'));
check('reveal motion is disabled for reduced-motion users', globals.includes('@media (prefers-reduced-motion: reduce)') && globals.includes('.ajn-tool-card-enter'));
check('small-phone responsive hardening exists', globals.includes('@media (max-width: 430px)') && globals.includes('@media (max-width: 359px)'));

check('desktop navigation switches before cramped high-zoom widths', navbar.includes('min-[1180px]'));
check('desktop header retains Merge/Split/Compress quick links', navbar.includes("'merge-pdf'") && navbar.includes("'split-pdf'") && navbar.includes("'compress-pdf'"));
check('Convert menu includes priority to-PDF and from-PDF routes', ['jpg-to-pdf','word-to-pdf','excel-to-pdf','powerpoint-to-pdf','html-to-pdf','pdf-to-word','pdf-to-jpg','pdf-to-excel','pdf-to-powerpoint','pdf-to-png'].every((id) => navbar.includes(id)));
check('Convert menu supports Escape and outside-pointer close', navbar.includes("event.key === 'Escape'") && navbar.includes('pointerdown'));
check('All Tools has Documents grouping and live intent search', allTools.includes("'Documents'") && allTools.includes('scoreToolSearch'));
check('All Tools avoids eager route prefetch and restores body scroll', allTools.includes('prefetch={false}') && allTools.includes('previousOverflow') && allTools.includes('router.prefetch'));
check('All Tools keeps keyboard focus inside the dialog', allTools.includes("event.key === 'Tab'") && allTools.includes('querySelectorAll<HTMLElement>'));

check('hero uses fluid balanced H1 instead of fixed oversized title', hero.includes('clamp(') && hero.includes('max-w-[900px]') && !hero.includes('5.2rem'));
check('homepage progressive rendering stays at 18 tools per step', services.includes('INITIAL_VISIBLE_TOOLS = 18') && services.includes('VISIBLE_STEP = 18'));
check('mobile directory uses one-column base grid', services.includes('grid-cols-1'));

check('status exposes checking/operational/degraded/unavailable states', ['checking','operational','degraded','unavailable'].every((state) => status.includes(`'${state}'`) || status.includes(`"${state}"`)));
check('status displays last-checked time and capability counts', status.includes('lastCheckedAt') && status.includes('availableConversionTools') && statusPage.includes('autoRefreshMs={30000}'));
check('status uses icon + label + color state marker', status.includes('StateIcon') && status.includes('ajn-status-dot') && status.includes('data-state={displayState}'));

check('tool workspace keeps safety limits internal without common limit panels', shared.includes('getToolLimitProfile') && !shared.includes('ToolRuntimeFactsInline') && !shared.includes('aria-label="Upload limits"') && !shared.includes('effectiveMaxFile'));
check('online tools are disabled before upload when service is unavailable', shared.includes('serviceBlocked') && shared.includes('<fieldset disabled={serviceBlocked}'));
check('on-device tools remain independent from online availability', shared.includes('usePdfBackendStatus(serverMode ? 30000 : 0, serverMode)'));
check('primary tool actions are normalized to AJN blue', shared.includes('linear-gradient(135deg,#2563EB,#1D4ED8)') && shared.includes('delete customStyle.background'));

check('processing overlay has immediate cancelling state', activity.includes('"cancelling"') && activity.includes('processing.cancelling') && activity.includes('abortController.current?.abort()'));
check('processing does not invent numeric percentage when none is reported', activity.includes('typeof activity.progressPct === "number"') && activity.includes('styles.progressBar'));
check('completion uses a restrained success check icon', activity.includes('<CheckCircle2 />') && !activity.toLowerCase().includes('confetti'));

check('priority SEO titles use natural high-intent copy', seo.includes('Merge PDF Online - Combine PDF Files | AJN PDF') && seo.includes('Compress PDF Online - Reduce PDF Size | AJN PDF'));
check('generic SEO descriptions avoid the old keyword-stuffed template', !seo.includes('online helps with'));
check('generic editorial copy avoids the awkward utility template', !editorial.includes('is an AJN PDF utility for'));
check('temporary cleanup wording is scheduled rather than an absolute instant-delete promise', editorial.includes('scheduled for cleanup'));

const localeDir = path.join(root, 'src/i18n/locales');
const localeFiles = ['en','hi','te','ta','kn'];
const localeObjects = localeFiles.map((lang) => JSON.parse(fs.readFileSync(path.join(localeDir, `${lang}.json`), 'utf8')));
const localeKeys = localeObjects.map((obj) => Object.keys(obj).sort());
const localeParity = localeKeys.every((keys) => JSON.stringify(keys) === JSON.stringify(localeKeys[0]));
check('five UI locale dictionaries have identical key structure', localeParity);
check('R13 cancelling/status copy exists in all five locales', localeObjects.every((obj) => obj['processing.cancelling'] && obj['processing.cancellingDescription'] && obj['status.degraded']));

const guidePages = [];
const blogRoot = path.join(root, 'src/app/blog');
for (const entry of fs.readdirSync(blogRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const page = path.join(blogRoot, entry.name, 'page.tsx');
  if (fs.existsSync(page)) guidePages.push(path.relative(root, page).split(path.sep).join('/'));
}
check('growth system retains a practical guide library', guidePages.length >= 9);
check('every guide page publishes self-referencing metadata helper', guidePages.every((rel) => read(rel).includes('guideMetadata')));
check('sitemap retains priority non-retired growth guides', ['reduce-pdf-size-keep-quality','pdf-accessibility-basics','document-security-aes256'].every((slug) => sitemap.includes(`/blog/${slug}`)));

const forbidden = [
  /100%\s*private/i,
  /100%\s*local/i,
  /Unlimited file size/i,
  /50,?000\+/i,
  /50K\+\+/i,
  /Zero-Server-Transit/i,
  /files never leave/i,
  /files are never uploaded/i,
  /Safe Browsing Verified/i,
  /Standard Compliant/i,
  /No servers/i,
  /zero server uploads/i,
];
const visibleFiles = [];
for (const top of ['src/app','src/components','src/lib/tools-data.ts','src/lib/tool-editorial.ts','src/lib/seo-strategy.ts','src/i18n/locales']) {
  const start = path.join(root, top);
  const walk = (target) => {
    const stat = fs.statSync(target);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(target)) walk(path.join(target, entry));
      return;
    }
    if (/\.(?:ts|tsx|json)$/i.test(target)) visibleFiles.push(target);
  };
  walk(start);
}
const stale = [];
for (const file of visibleFiles) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  const text = fs.readFileSync(file, 'utf8');
  for (const pattern of forbidden) if (pattern.test(text)) stale.push(`${rel}: ${pattern}`);
}
check('visible production source contains none of the audited stale universal claims', stale.length === 0);
if (stale.length) fail(`stale claim matches: ${stale.slice(0, 12).join(' | ')}`);

const freeForeverHits = visibleFiles
  .map((file) => ({ file, text: fs.readFileSync(file, 'utf8') }))
  .filter(({ text }) => /free forever/i.test(text));
check('free forever appears only in the reviewed anti-claim educational context', freeForeverHits.length === 1 && path.relative(root, freeForeverHits[0].file).split(path.sep).join('/') === 'src/app/blog/best-free-pdf-editor/page.tsx' && /should not be hidden behind a permanent/i.test(freeForeverHits[0].text));

const staleToolRefs = [];
for (const top of ['src','chrome-extension']) {
  const base = path.join(root, top);
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(?:ts|tsx|js|jsx|json)$/i.test(entry.name)) {
        const rel = path.relative(root, full).split(path.sep).join('/');
        if (rel === 'src/lib/tool-routes.ts') continue;
        const text = fs.readFileSync(full, 'utf8');
        if (text.includes('/tools/')) staleToolRefs.push(rel);
      }
    }
  };
  walk(base);
}
check('public source contains no navigational /tools/ links', staleToolRefs.length === 0);
if (staleToolRefs.length) fail(`legacy /tools/ references: ${staleToolRefs.join(', ')}`);

check('R13 source/runtime/live/capability scripts are registered', packageJson.scripts?.['verify:r13'] === 'node scripts/verify-r13-production-final.mjs' && packageJson.scripts?.['verify:r13-runtime'] === 'node scripts/verify-r13-runtime.mjs' && packageJson.scripts?.['audit:r13-live'] === 'node scripts/audit-r13-live-site.mjs' && packageJson.scripts?.['report:r13-capabilities'] === 'node scripts/report-r13-capabilities.mjs');
check('Next production server hides framework header and keeps compression enabled', nextConfig.includes('poweredByHeader: false') && nextConfig.includes('compress: true'));

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  console.error(`AJN PDF R13 source verification failed with ${failures.length} issue(s).`);
  process.exit(1);
}
console.log(`AJN PDF R13 SOURCE VERIFICATION: PASS (${ids.length} canonical tools, ${guidePages.length} guides, ${localeKeys[0].length} shared locale keys)`);
