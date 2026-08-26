import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const fail = (msg) => { console.error(`FAIL: ${msg}`); process.exitCode = 1; };
const pass = (msg) => console.log(`PASS: ${msg}`);

const core = read('src/lib/pdf-backend.ts');
if (!core.includes("DEFAULT_SERVICE_URL = 'https://ajn-pdf-api-rswf5f4f3q-el.a.run.app'")) fail('current AJN PDF production endpoint fallback is missing'); else pass('production endpoint fallback is present');
if (!core.includes("host === 'ajnpdf.com' || host === 'www.ajnpdf.com'")) fail('website-origin misconfiguration guard is missing'); else pass('website-origin API URL misconfiguration is rejected');
if (!core.includes('SERVICE_CANDIDATES') || !core.includes('activeServiceUrl')) fail('live endpoint failover logic is missing'); else pass('live endpoint selection/failover logic is present');
if (!core.includes("message: 'Ready to use.'")) fail('premium neutral readiness copy is missing'); else pass('neutral readiness copy is present');

const status = read('src/app/status/page.tsx');
const sitemap = read('src/app/sitemap.ts');
const sitemapRootShape = sitemap.includes('toolPath(tool.id)') &&
  (sitemap.includes('url: `${SITE_URL}${pathname}`') || sitemap.includes('url: `${SITE_URL}${toolPath(tool.id)}`')) &&
  !sitemap.includes('/tools/');
if (!sitemapRootShape) fail('canonical root-tool sitemap generation is missing'); else pass('canonical root-tool sitemap generation is retained');
if (!status.includes('data-ajn-release="3.1.0-r14.1"')) fail('R14.1 live deployment marker is missing'); else pass('R14.1 live deployment marker is present');
if (!status.includes('AJN PDF live status')) fail('premium status heading is missing'); else pass('premium status heading is present');

const publicFiles = [
  'src/app/acceptable-use/page.tsx',
  'src/app/admin/analytics/page.tsx',
  'src/app/admin/media/page.tsx',
  'src/app/blog/best-free-pdf-editor/page.tsx',
  'src/app/blog/browser-native-architecture/page.tsx',
'src/app/blog/how-to-merge-pdfs-online-safely/page.tsx',
'src/app/blog/-digital-archiving/page.tsx',
  'src/app/blog/page.tsx',
  'src/app/cookies/page.tsx',
  'src/app/data-deletion/page.tsx',
  'src/app/developer/page.tsx',
  'src/app/faq/page.tsx',
  'src/app/file-processing-policy/page.tsx',
  'src/app/file-processing-policy/layout.tsx',
  'src/app/limits/page.tsx',
'src/app/privacy/page.tsx',
  'src/app/security/page.tsx',
  'src/app/status/layout.tsx',
  'src/app/status/page.tsx',
  'src/app/terms/page.tsx',
  'src/app/transparency/page.tsx',
  'src/components/about/capability-summary.tsx',
  'src/components/ajn/tool-runtime-facts.tsx',
  'src/components/junction/ProtectPdf.tsx',
  'src/components/junction/RepairPdf.tsx',
  'src/components/junction/ServerConversionTool.tsx',
  'src/components/junction/UnlockPdf.tsx',
  'src/components/junction/_shared.tsx',
  'src/components/junction/backend-status.tsx',
  'src/lib/admin-diagnostics.ts',
  'src/lib/brand.ts',
  'src/lib/conversion-tools.ts',
  'src/lib/seo-strategy.ts',
  'src/lib/tool-capabilities.ts',
  'src/lib/tool-editorial.ts',
  'src/lib/tool-policy.ts'];

const forbiddenVisible = [
  /server-assisted/i,
  /processing service/i,
  /conversion service/i,
  /processing server/i,
  /server jobs?/i,
  /server tools?/i,
  /server workflow/i,
  /temporary server/i,
  /running backend/i,
  /backend status/i,
  /server-processed/i,
  /server-side/i];

for (const rel of publicFiles) {
  if (!exists(rel)) { fail(`required R14 file missing: ${rel}`); continue; }
  const text = read(rel);
  for (const pattern of forbiddenVisible) {
    if (pattern.test(text)) fail(`${rel} still contains public technical phrase ${pattern}`);
  }
}
if (!process.exitCode) pass('public workflow copy contains no audited infrastructure terminology');

const staleClaims = [
  /Files Stay on Your Device/i,
  /Zero-Server-Transit/i,
  /No servers/i,
  /files are never uploaded/i,
  /100% private and local processing/i,
  /50K\+\+/i,
  /50,000\+/i,
  /Safe Browsing Verified/i,
  /Unlimited file size/i];
for (const rel of publicFiles) {
  const text = read(rel);
  for (const pattern of staleClaims) if (pattern.test(text)) fail(`${rel} reintroduces stale claim ${pattern}`);
}
if (!process.exitCode) pass('audited stale privacy/scale claims remain absent');

const policy = `${read('src/app/privacy/page.tsx')}\n${read('src/app/file-processing-policy/page.tsx')}\n${read('src/app/transparency/page.tsx')}`;
if (!/upload(?:ed)? the selected file|selected file.*upload/i.test(policy)) fail('truthful temporary upload disclosure is missing'); else pass('truthful temporary upload disclosure is retained');
if (!/scheduled for cleanup|schedule cleanup/i.test(policy)) fail('temporary cleanup disclosure is missing'); else pass('temporary cleanup disclosure is retained');

const localeDir = path.join(root, 'src/i18n/locales');
const langs = ['en','hi','te','ta','kn'];
const localeKeys = langs.map((lang) => Object.keys(JSON.parse(fs.readFileSync(path.join(localeDir, `${lang}.json`), 'utf8'))).sort());
const reference = JSON.stringify(localeKeys[0]);
for (let i = 0; i < langs.length; i += 1) {
  if (JSON.stringify(localeKeys[i]) !== reference) fail(`${langs[i]} locale keys do not match English`);
  if (localeKeys[i].length < 518) fail(`${langs[i]} locale key count fell below R13 baseline`);
}
if (!process.exitCode) pass(`five-language key parity retained (${localeKeys[0].length} keys)`);

const en = JSON.parse(read('src/i18n/locales/en.json'));
for (const key of ['backend.service','backend.ready','backend.notConfigured','backend.offline','processing.server','runtime.secureService']) {
  const value = String(en[key] || '');
  if (/backend|server|processing service|conversion service/i.test(value)) fail(`English UI key ${key} still exposes technical infrastructure wording`);
}
if (!process.exitCode) pass('English status/workflow labels use neutral premium copy');

const css = read('src/app/globals.css');
if (/html\s*\{[^}]*\bzoom\s*:/is.test(css)) fail('global CSS zoom rule was reintroduced'); else pass('global CSS zoom remains absent');

if (process.exitCode) {
  console.error('AJN PDF R14 premium workflow verification failed.');
  process.exit(process.exitCode);
}
console.log('AJN PDF R14.1 PREMIUM WORKFLOW / LIVE ENDPOINT SOURCE VERIFICATION: PASS');
