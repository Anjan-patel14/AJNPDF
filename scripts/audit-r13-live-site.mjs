import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ids = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'r13-public-tool-ids.json'), 'utf8'));
const base = (process.env.AJN_LIVE_BASE_URL || 'https://www.ajnpdf.com').replace(/\/$/, '');
const failures = [];
const warnings = [];
const pass = (message) => console.log(`PASS: ${message}`);
const fail = (message) => failures.push(message);

async function request(pathname) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${base}${pathname}`, {
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'user-agent': 'AJN-PDF-R13-Live-Audit/1.0' },
    });
    return { response, text: await response.text() };
  } finally { clearTimeout(timer); }
}
function locationPath(result) {
  const raw = result.response.headers.get('location') || '';
  if (!raw) return '';
  try { return new URL(raw, base).pathname; } catch { return raw; }
}
function canonicalFrom(html) {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return match?.[1] || '';
}
async function mapLimit(items, limit, worker) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      await worker(items[index], index);
    }
  }));
}

const rootResults = [];
const legacyResults = [];
console.log(`AJN PDF R13 live audit: ${base}`);

try {
  const home = await request('/');
  if (home.response.status !== 200) {
    fail(`/ returned ${home.response.status}`);
  } else if (!/name=["']ajn-release["'][^>]+content=["']3\.1\.0-r13["']/i.test(home.text)
      && !/content=["']3\.1\.0-r13["'][^>]+name=["']ajn-release["']/i.test(home.text)) {
    fail('production homepage does not expose the AJN PDF 3.1.0-r13 release marker; Vercel may still be serving an older deployment');
  } else {
    pass('production homepage confirms the AJN PDF 3.1.0-r13 deployment marker');
  }
} catch (error) { fail(`/: ${error}`); }

await mapLimit(ids, 8, async (id) => {
  try {
    const result = await request(`/${id}`);
    const canonical = canonicalFrom(result.text);
    const expected = `${base}/${id}`;
    const ok = result.response.status === 200 && canonical === expected && !result.text.includes(`${base}/tools/${id}`);
    rootResults.push({ id, status: result.response.status, canonical, ok });
    if (!ok) fail(`/${id}: HTTP ${result.response.status}, canonical ${canonical || '(missing)'}`);
  } catch (error) {
    rootResults.push({ id, status: 0, canonical: '', ok: false, error: String(error) });
    fail(`/${id}: ${error}`);
  }
});
if (rootResults.every((item) => item.ok)) pass(`all ${ids.length} root tool URLs return 200 with self canonicals`);

await mapLimit(ids, 8, async (id) => {
  try {
    const result = await request(`/tools/${id}`);
    const location = locationPath(result);
    const ok = [301, 308].includes(result.response.status) && location === `/${id}`;
    legacyResults.push({ id, status: result.response.status, location, ok });
    if (!ok) fail(`/tools/${id}: HTTP ${result.response.status}, location ${location || '(missing)'}`);
  } catch (error) {
    legacyResults.push({ id, status: 0, location: '', ok: false, error: String(error) });
    fail(`/tools/${id}: ${error}`);
  }
});
if (legacyResults.every((item) => item.ok)) pass(`all ${ids.length} /tools/* URLs permanently redirect directly to root slugs`);

const aliases = {
  '/tools/word-pdf': '/word-to-pdf', '/tools/pdf-word': '/pdf-to-word', '/tools/excel-pdf': '/excel-to-pdf', '/tools/pdf-excel': '/pdf-to-excel',
  '/tools/ppt-pdf': '/ppt-to-pdf', '/tools/jpg-pdf': '/jpg-to-pdf', '/tools/pdf-jpg': '/pdf-to-jpg', '/tools/heic-pdf': '/heic-to-pdf',
  '/tools/html-pdf': '/html-to-pdf', '/tools/xml-pdf': '/xml-to-pdf', '/tools/json-pdf': '/json-to-pdf', '/tools/txt-pdf': '/txt-to-pdf',
  '/tools/smart-read': '/pdf-text', '/tools/pdf-ppt': '/pdf-to-powerpoint',
};
for (const [source, target] of Object.entries(aliases)) {
  try {
    const result = await request(source);
    if (![301,308].includes(result.response.status) || locationPath(result) !== target) fail(`${source}: expected permanent redirect to ${target}, got ${result.response.status} ${locationPath(result) || '(missing)'}`);
  } catch (error) { fail(`${source}: ${error}`); }
}

try {
  const psd = await request('/psd-pdf');
  if (psd.response.status !== 410) fail(`/psd-pdf returned ${psd.response.status}; expected intentional 410`);
  else pass('retired PSD-to-PDF URL returns intentional 410');
} catch (error) { fail(`/psd-pdf: ${error}`); }

let sitemapStatus = 0;
try {
  const sitemap = await request('/sitemap.xml');
  sitemapStatus = sitemap.response.status;
  if (sitemap.response.status !== 200) fail(`/sitemap.xml returned ${sitemap.response.status}`);
  else {
    const missing = ids.filter((id) => !sitemap.text.includes(`${base}/${id}`));
    if (missing.length) fail(`sitemap missing: ${missing.slice(0, 12).join(', ')}`);
    if (sitemap.text.includes(`${base}/tools/`)) fail('sitemap contains legacy /tools/ URLs');
    if (!missing.length && !sitemap.text.includes(`${base}/tools/`)) pass(`sitemap contains all ${ids.length} root tools and zero /tools/ tool URLs`);
  }
} catch (error) { fail(`/sitemap.xml: ${error}`); }

const trustPaths = ['/', '/about', '/privacy', '/faq', '/transparency', '/pdf-tools'];
const stalePatterns = [/100%\s*(?:private|local)/i,/Unlimited file size/i,/50,?000\+/i,/50K\+\+/i,/Zero-Server-Transit/i,/files never leave/i,/files are never uploaded/i,/Safe Browsing Verified/i,/No servers/i,/zero server uploads/i];
for (const pathname of trustPaths) {
  try {
    const result = await request(pathname);
    if (result.response.status !== 200) { fail(`${pathname} returned ${result.response.status}`); continue; }
    for (const pattern of stalePatterns) if (pattern.test(result.text)) fail(`${pathname} contains stale claim ${pattern}`);
  } catch (error) { fail(`${pathname}: ${error}`); }
}

for (const pathname of ['/robots.txt','/image-sitemap.xml','/status','/limits','/blog']) {
  try {
    const result = await request(pathname);
    if (result.response.status !== 200) fail(`${pathname} returned ${result.response.status}`);
  } catch (error) { fail(`${pathname}: ${error}`); }
}

if (base === 'https://www.ajnpdf.com') {
  try {
    const bare = await fetch('https://ajnpdf.com/merge-pdf', { redirect: 'manual', headers: { 'user-agent': 'AJN-PDF-R13-Live-Audit/1.0' } });
    const location = bare.headers.get('location') || '';
    if (![301,308].includes(bare.status) || !location.startsWith('https://www.ajnpdf.com/merge-pdf')) fail(`bare-domain canonical redirect is incorrect: ${bare.status} ${location || '(missing)'}`);
    else pass('bare domain permanently redirects to www canonical host');
  } catch (error) { warnings.push(`bare-domain check unavailable: ${error}`); }
}

const report = {
  generatedAt: new Date().toISOString(),
  base,
  summary: {
    canonicalToolCount: ids.length,
    canonicalPass: rootResults.filter((item) => item.ok).length,
    legacyRedirectPass: legacyResults.filter((item) => item.ok).length,
    sitemapStatus,
    failures: failures.length,
    warnings: warnings.length,
  },
  rootResults,
  legacyResults,
  failures,
  warnings,
};
const liveReportDir = process.env.AJN_R13_LIVE_REPORT_DIR || root;
fs.mkdirSync(liveReportDir, { recursive: true });
fs.writeFileSync(path.join(liveReportDir, 'R13_LIVE_AUDIT_RESULT.json'), `${JSON.stringify(report, null, 2)}\n`);
const md = [
  '# AJN PDF R13 Live Audit', '',
  `Generated: ${report.generatedAt}`, `Base: ${base}`, '',
  `- Canonical tool pages: ${report.summary.canonicalPass}/${ids.length}`,
  `- Legacy redirects: ${report.summary.legacyRedirectPass}/${ids.length}`,
  `- Sitemap HTTP: ${sitemapStatus}`,
  `- Failures: ${failures.length}`,
  `- Warnings: ${warnings.length}`, '',
  '## Failures', ...(failures.length ? failures.map((item) => `- ${item}`) : ['- None']), '',
  '## Warnings', ...(warnings.length ? warnings.map((item) => `- ${item}`) : ['- None']), '',
  '## External gates not measured by this HTTP audit',
  '- Chrome/Edge rendered zoom and interaction QA',
  '- Field Core Web Vitals / INP',
  '- Consent-platform and AdSense visual behavior',
  '- Search Console recrawl timing and Chrome Web Store review'].join('\n');
fs.writeFileSync(path.join(liveReportDir, 'R13_LIVE_AUDIT_RESULT.md'), `${md}\n`);

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  for (const warning of warnings) console.warn(`WARN: ${warning}`);
  console.error(`AJN PDF R13 LIVE AUDIT: FAIL (${failures.length} issue(s)).`);
  process.exit(1);
}
for (const warning of warnings) console.warn(`WARN: ${warning}`);
console.log(`AJN PDF R13 LIVE AUDIT: PASS (${ids.length} canonical tool pages + ${ids.length} legacy redirects).`);
