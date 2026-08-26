import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const pass = (m) => console.log(`PASS: ${m}`);
const fail = (m) => { console.error(`FAIL: ${m}`); process.exitCode = 1; };
const check = (m, ok) => ok ? pass(m) : fail(m);

const layout = read('src/app/layout.tsx');
const seo = read('src/lib/seo-config.ts');
const nextConfig = read('next.config.ts');
const faq = read('src/app/faq/page.tsx');
const transparency = read('src/app/transparency/page.tsx');
const privacy = read('src/app/privacy/page.tsx');
const toolPolicy = read('src/lib/tool-policy.ts');
const toolEditorial = read('src/components/junction/tool-editorial-content.tsx');
const toolPage = read('src/app/(tool-pages)/[id]/page.tsx');
const sitemap = read('src/app/sitemap.ts');
const robots = read('src/app/robots.ts');
const errorPage = read('src/app/error.tsx');
const productionVerifier = read('scripts/verify-production.mjs');

const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:ts|tsx|js|jsx|json|css|mjs|md|txt)$/i.test(entry.name)) sourceFiles.push(full);
  }
}
walk(path.join(root, 'src'));
const sourceText = sourceFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

check('homepage SEO title targets free PDF tools', layout.includes('Free PDF Tools Online - Convert, Merge, Compress & Edit | AJN PDF'));
check('homepage meta description is truthful and task-oriented', /PDF/i.test(layout) && /convert/i.test(layout) && /merge/i.test(layout) && /compress/i.test(layout));
check('Open Graph and Twitter metadata use the new homepage title', (layout.match(/Free PDF Tools Online - Convert, Merge, Compress & Edit \| AJN PDF/g) || []).length >= 3);
check('canonical host is www.ajnpdf.com', seo.includes("export const SITE_URL = 'https://www.ajnpdf.com';"));
check('bare domain permanently redirects to www', nextConfig.includes("value: 'ajnpdf.com'") && nextConfig.includes("destination: 'https://www.ajnpdf.com/:path*'"));
check('stale Smart Read route redirects to canonical PDF text tool', nextConfig.includes("source: '/tools/smart-read'") && nextConfig.includes("destination: '/pdf-text'"));
check('legacy PDF-to-PPT route redirects to current converter', nextConfig.includes("source: '/tools/pdf-ppt'") && nextConfig.includes("destination: '/pdf-to-powerpoint'"));

const locales = ['en','hi','te','ta','kn'].map((code) => JSON.parse(read(`src/i18n/locales/${code}.json`)));
check('all five locales retain the R10.9 baseline and identical key structure', locales.every((d) => Object.keys(d).length >= 511) && locales.every((d) => Object.keys(d).join('\n') === Object.keys(locales[0]).join('\n')));
check('all five homepage title2 values are empty', locales.every((d) => d['home.title2'] === ''));
check('all five homepage H1 values include PDF plus meaningful task copy', locales.every((d) => /PDF/i.test(d['home.title1']) && d['home.title1'].replace(/PDF/ig, '').trim().length >= 3));

const forbidden = [
  'ajnpdf1@gmail.com',
  'instagram.com/ajnpdf.in',
  'Files Stay on Your Device | AJN Studio',
  'Zero-Server-Transit',
  '50K++',
  '50,000+',
  'Safe Browsing Verified',
  'Processed on your device — files are never uploaded',
  '100% private and local processing',
  'Unlimited file size',
  'Made Simple by AJN PDF.',
  'Fast, clear file workflows.',
  'ΓÇ',
  'â€”',
  'â€“'];
for (const value of forbidden) check(`forbidden/stale public copy absent: ${value}`, !sourceText.includes(value));
check('no global 115 percent zoom rule remains', !/zoom\s*:\s*1\.15/i.test(sourceText));

check('privacy distinguishes session and service-assisted processing', privacy.includes('Session and service-assisted processing') && privacy.includes('service-assisted workflows may send a file'));
check('FAQ uses scheduled temporary cleanup wording', faq.includes('scheduled for cleanup after the result is delivered'));
check('transparency uses scheduled cleanup wording', transparency.includes('scheduled for cleanup after delivery or an error'));
check('tool runtime editorial uses scheduled cleanup wording', toolEditorial.includes('scheduled for cleanup after the result is returned'));
check('server tool policy avoids absolute deletion guarantee', toolPolicy.includes('request workspace is scheduled for cleanup after the response') && !toolPolicy.includes('Files are removed after the response.'));

check('tool WebApplication schema publishes through AJN Studio entity', toolPage.includes("publisher: { '@id': `${SITE_URL}/ajn-studio#organization` }"));
check('tool WebApplication schema references developer author', toolPage.includes("author: { '@id': `${SITE_URL}/developer#anjan` }"));
check('tool WebApplication schema carries AJN PDF brand', toolPage.includes("brand: { '@type': 'Brand', name: AJN_BRAND.productName, url: SITE_URL }"));
check('sitemap only builds available public tools', sitemap.includes('BUILD_PUBLIC_TOOLS') && sitemap.includes('SEO_EXCLUDED_TOOL_IDS'));
check('robots publishes primary and image sitemaps', robots.includes('/sitemap.xml') && robots.includes('/image-sitemap.xml'));
check('admin responses are protected by no-store + noindex headers', nextConfig.includes("source: '/admin/:path*'") && nextConfig.includes("'no-store, max-age=0'") && nextConfig.includes("'noindex, nofollow'"));
check('error boundary includes one-shot stale chunk recovery', errorPage.includes('CHUNK_RELOAD_KEY') && errorPage.includes('window.location.reload()'));
check('production verifier enforces bare-to-www canonical redirect', productionVerifier.includes('Canonical bare-domain to www redirect is missing.'));
check('R11 live audit script exists', exists('scripts/audit-r11-live-site.mjs'));

if (process.exitCode) {
  console.error('AJN PDF R11 LIVE TRUST / PRODUCTION CLEANUP SOURCE VERIFICATION: FAIL');
  process.exit(process.exitCode);
}
console.log('AJN PDF R11 LIVE TRUST / PRODUCTION CLEANUP SOURCE VERIFICATION: PASS');
