import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file);
let failures = 0;
const check = (label, condition) => condition
  ? console.log(`PASS: ${label}`)
  : (console.error(`FAIL: ${label}`), failures++);

const sitemap = read('src/app/sitemap.ts');
const seo = read('src/lib/seo-config.ts');
const robots = read('src/app/robots.ts');
const next = read('next.config.ts');
const manifest = read('src/generated/sitemap-lastmod.ts');
const generator = read('scripts/generate-sitemap-lastmod.mjs');
const ids = JSON.parse(read('scripts/r13-public-tool-ids.json'));

const core = [...sitemap.matchAll(/\{\s*path:\s*["']([^"']+)["']/g)].map((match) => match[1]);
const manifestPaths = new Set(
  [...manifest.matchAll(/^\s*"([^"]+)":\s*"/gm)].map((match) => match[1]),
);
const excludedBody = seo.match(/SEO_EXCLUDED_TOOL_IDS\s*=\s*new Set\(\[([\s\S]*?)\]\)/)?.[1] || '';
const excluded = new Set([...excludedBody.matchAll(/'([^']+)'/g)].map((match) => match[1]));
const toolIds = ids.filter((id) => !excluded.has(id));

check('canonical SITE_URL is www', seo.includes("export const SITE_URL = 'https://www.ajnpdf.com';"));
check('sitemap deterministic/no live media fetch', !sitemap.includes('fetchPublicMediaPosts') && !sitemap.includes('mediaPosts'));
check('sitemap uses content lastmod', sitemap.includes('getSitemapLastModified'));
check('no legacy /tools sitemap URL', !sitemap.includes('/tools/'));
check('static sitemap paths are detected', core.length >= 20);
check('static paths unique', core.length === new Set(core).size);
check('robots publishes sitemap', robots.includes('sitemap.xml'));
check('backend CSP resolver is centralized', next.includes('configuredPdfBackendCandidates'));
check('generic retired /tools redirect remains safe', next.includes('publicToolLegacyRedirects') && next.includes("source: '/tools/:id'") && next.includes("destination: '/pdf-tools'"));
check('lastmod generator exists', exists('scripts/generate-sitemap-lastmod.mjs'));
check(
  'lastmod generator backfills routes when git history is unavailable',
  generator.includes('existingFallback')
    && generator.includes('existingEntries')
    && generator.includes('backfilled missing sitemap routes')
    && !generator.includes('process.exit(0)'),
);
check('runtime auditor exists', exists('scripts/audit-sitemap-runtime.mjs'));
check('manifest covers static routes', core.every((path) => manifestPaths.has(path)));
check('manifest covers indexable tools', toolIds.every((id) => manifestPaths.has(`/${id}`)));

if (failures) process.exit(1);
console.log(`AJN PDF sitemap/indexing source audit: PASS (${core.length} static + ${toolIds.length} tools).`);
