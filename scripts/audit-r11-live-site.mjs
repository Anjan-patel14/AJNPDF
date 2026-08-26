const base = (process.env.AJN_LIVE_BASE_URL || 'https://www.ajnpdf.com').replace(/\/$/, '');
const bare = 'https://ajnpdf.com';
let failures = 0;
const pass = (m) => console.log(`PASS: ${m}`);
const fail = (m) => { failures += 1; console.error(`FAIL: ${m}`); };

async function fetchText(url, init = {}) {
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), ...init });
  const text = await response.text().catch(() => '');
  return { response, text };
}
function hasAny(text, values) { return values.some((v) => text.toLowerCase().includes(v.toLowerCase())); }

const publicPages = [
  '/', '/about', '/privacy', '/faq', '/transparency', '/pdf-tools', '/conversion-tools', '/image-tools', '/pdf-utilities', '/limits', '/image-licensing', '/discover', '/merge-pdf', '/compress-pdf', '/pdf-to-word', '/image-to-pdf'
];
const staleClaims = [
  'zero-server-transit',
  'files are never uploaded',
  '100% private and local processing',
  '50k++',
  '50,000+',
  'ajnpdf1@gmail.com',
  'safe browsing verified',
  'made simple by ajn pdf.',
  'fast, clear file workflows.',
  'loading chunk'
];

console.log(`AJN PDF R11 LIVE AUDIT: ${base}`);

for (const pathname of publicPages) {
  try {
    const { response, text } = await fetchText(`${base}${pathname}`);
    if (response.status >= 200 && response.status < 400) pass(`${pathname} HTTP ${response.status}`); else fail(`${pathname} returned HTTP ${response.status}`);
    if (hasAny(text, staleClaims)) fail(`${pathname} still contains stale trust/error copy`); else pass(`${pathname} stale-copy scan`);
    if (pathname === '/') {
      if (text.includes('Free PDF Tools Online - Convert, Merge, Compress')) pass('homepage contains new SEO title'); else fail('homepage new SEO title not found');
      if (text.includes('Free PDF Tools Online - Convert, Merge, Compress, Edit &amp; ') || text.includes('Free PDF Tools Online - Convert, Merge, Compress, Edit & ')) pass('homepage contains new H1'); else fail('homepage new H1 not found');
    }
  } catch (error) {
    fail(`${pathname} fetch failed: ${error.message}`);
  }
}

try {
  const { response } = await fetchText(`${bare}/privacy`);
  const location = response.headers.get('location') || '';
  if ([301,302,307,308].includes(response.status) && location.startsWith('https://www.ajnpdf.com/')) pass('bare domain redirects to www canonical host');
  else fail(`bare-domain canonical redirect mismatch: status=${response.status} location=${location}`);
} catch (error) { fail(`bare-domain redirect check failed: ${error.message}`); }

for (const [oldPath, newPath] of [
  ['/tools/pdf-jpg','/pdf-to-jpg'],
  ['/tools/json-pdf','/json-to-pdf'],
  ['/tools/smart-read','/pdf-text'],
  ['/tools/pdf-ppt','/pdf-to-powerpoint'],
  ['/tools/-searchable']]) {
  try {
    const { response } = await fetchText(`${base}${oldPath}`);
    const location = response.headers.get('location') || '';
    if ([301,302,307,308].includes(response.status) && location.includes(newPath)) pass(`${oldPath} redirects to ${newPath}`);
    else fail(`${oldPath} redirect mismatch: status=${response.status} location=${location}`);
  } catch (error) { fail(`${oldPath} redirect check failed: ${error.message}`); }
}

try {
  const { response, text } = await fetchText(`${base}/sitemap.xml`);
  if (response.ok && /<urlset|<sitemapindex/i.test(text)) pass('sitemap.xml returns XML'); else fail(`sitemap.xml invalid HTTP=${response.status}`);
  if (!text.includes('/admin/')) pass('sitemap excludes admin routes'); else fail('sitemap exposes admin route');
  if (text.includes(`${base}/merge-pdf`)) pass('sitemap includes public tool routes'); else fail('sitemap missing merge-pdf');
} catch (error) { fail(`sitemap check failed: ${error.message}`); }

try {
  const { response, text } = await fetchText(`${base}/robots.txt`);
  if (response.ok && /sitemap:/i.test(text)) pass('robots.txt publishes sitemap'); else fail('robots.txt sitemap directive missing');
  if (text.includes('/admin/')) pass('robots.txt references admin exclusion'); else fail('robots.txt should disallow admin routes');
} catch (error) { fail(`robots check failed: ${error.message}`); }

try {
  const { response } = await fetchText(`${base}/admin/media`);
  const cc = (response.headers.get('cache-control') || '').toLowerCase();
  const xr = (response.headers.get('x-robots-tag') || '').toLowerCase();
  if (cc.includes('no-store')) pass('admin media sends no-store'); else fail('admin media no-store header missing');
  if (xr.includes('noindex')) pass('admin media sends X-Robots-Tag noindex'); else fail('admin media noindex header missing');
} catch (error) { fail(`admin header check failed: ${error.message}`); }

try {
  const { response } = await fetchText(`${base}/`);
  const required = ['content-security-policy','x-content-type-options','referrer-policy','permissions-policy'];
  for (const h of required) response.headers.get(h) ? pass(`homepage security header: ${h}`) : fail(`homepage security header missing: ${h}`);
} catch (error) { fail(`security-header check failed: ${error.message}`); }

if (failures) {
  console.error(`AJN PDF R11 LIVE AUDIT: FAIL (${failures} issue${failures === 1 ? '' : 's'})`);
  process.exit(1);
}
console.log('AJN PDF R11 LIVE AUDIT: PASS');
