import fs from 'node:fs';

const BASE = (process.env.AJN_LIVE_BASE_URL || 'https://www.ajnpdf.com').replace(/\/$/, '');
const BACKEND = (process.env.AJN_BACKEND_URL || 'https://ajn-pdf-api-580158856470.asia-south1.run.app').replace(/\/$/, '');
const CANONICAL = 'https://www.ajnpdf.com';
const ids = JSON.parse(fs.readFileSync('scripts/r13-public-tool-ids.json', 'utf8'));
const failures = [];
const pass = (msg) => console.log(`PASS: ${msg}`);
const fail = (msg) => { failures.push(msg); console.error(`FAIL: ${msg}`); };

async function request(url, init = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'user-agent': 'AJN-PDF-Gates-Live/1.0', ...(init.headers || {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function mapLimit(items, limit, worker) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      await worker(items[index]);
    }
  }));
}

function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&').trim());
}

console.log(`AJN PDF live gates: frontend=${BASE} backend=${BACKEND}`);

try {
  const root = await request(`${BASE}/`);
  root.status === 200 ? pass(`homepage HTTP ${root.status}`) : fail(`homepage HTTP ${root.status}`);
} catch (error) { fail(`homepage request failed: ${error}`); }

try {
  const robots = await request(`${BASE}/robots.txt`);
  const text = await robots.text();
  if (robots.status !== 200) fail(`robots.txt HTTP ${robots.status}`);
  else if (!text.includes(`${CANONICAL}/sitemap.xml`) || !text.includes(`${CANONICAL}/image-sitemap.xml`) || !/Disallow:\s*\/admin\//i.test(text)) fail('robots.txt canonical sitemap/private-route policy mismatch');
  else pass('robots.txt canonical sitemap/private-route policy');
} catch (error) { fail(`robots.txt request failed: ${error}`); }

let sitemapUrls = [];
try {
  const response = await request(`${BASE}/sitemap.xml`);
  const xml = await response.text();
  if (response.status !== 200) fail(`sitemap.xml HTTP ${response.status}`);
  sitemapUrls = sitemapLocs(xml);
  const set = new Set(sitemapUrls);
  const expected = ids.map((id) => `${CANONICAL}/${id}`);
  if (!expected.every((url) => set.has(url))) fail('sitemap.xml is missing one or more public tool URLs');
  else if (set.has(`${CANONICAL}/pricing`)) fail('sitemap.xml still contains retired /pricing');
  else if (sitemapUrls.some((url) => !url.startsWith(`${CANONICAL}/`) && url !== `${CANONICAL}/`)) fail('sitemap.xml contains a noncanonical host');
  else pass(`sitemap.xml includes all ${ids.length} public tool URLs (${sitemapUrls.length} total URLs)`);
} catch (error) { fail(`sitemap.xml request failed: ${error}`); }

try {
  const response = await request(`${BASE}/image-sitemap.xml`);
  response.status === 200 ? pass('image-sitemap.xml HTTP 200') : fail(`image-sitemap.xml HTTP ${response.status}`);
} catch (error) { fail(`image-sitemap request failed: ${error}`); }

await mapLimit(ids, 5, async (id) => {
  try {
    const response = await request(`${BASE}/${id}`);
    const html = await response.text();
    const head = /<head\b[\s\S]*?<\/head>/i.exec(html)?.[0] || '';
    const canonical = `${CANONICAL}/${id}`;
    const ok = response.status === 200 &&
      /<title>[^<]*AJN PDF<\/title>/i.test(head) &&
      head.includes('rel="canonical"') && head.includes(`href="${canonical}"`) &&
      !/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(head) &&
      html.includes(`tool-schema-${id}`);
    ok ? pass(`/${id} indexable canonical tool page`) : fail(`/${id} live SEO identity mismatch (HTTP ${response.status})`);
  } catch (error) { fail(`/${id} request failed: ${error}`); }
});

for (const route of ['/pdf-tools','/trust','/status','/blog','/blog/merge-pdf-on-android','/blog/compress-pdf-for-email','/blog/edit-pdf-on-android','/blog/split-pdf-on-android']) {
  try {
    const response = await request(`${BASE}${route}`);
    response.status === 200 ? pass(`${route} HTTP 200`) : fail(`${route} HTTP ${response.status}`);
  } catch (error) { fail(`${route} request failed: ${error}`); }
}

if (BASE === CANONICAL) {
  try {
    const response = await request('https://ajnpdf.com/', { redirect: 'manual' });
    const location = response.headers.get('location') || '';
    if (![301, 308].includes(response.status) || !location.startsWith(CANONICAL)) fail(`non-www redirect mismatch: HTTP ${response.status}, location=${location || '(missing)'}`);
    else pass('non-www redirects permanently to canonical www host');
  } catch (error) { fail(`non-www redirect check failed: ${error}`); }
}

for (const pathname of ['/health','/ready','/api/tools']) {
  try {
    const response = await request(`${BACKEND}${pathname}`);
    if (response.status !== 200) { fail(`backend ${pathname} HTTP ${response.status}`); continue; }
    if (pathname === '/ready') {
      const payload = await response.json();
      payload?.status === 'ok' ? pass('backend /ready status ok') : fail(`backend /ready status ${payload?.status || '(missing)'}`);
    } else if (pathname === '/api/tools') {
      const payload = await response.json();
      const tools = Array.isArray(payload?.tools) ? payload.tools : [];
      const required = ['protect-pdf','unlock-pdf','repair-pdf'];
      required.every((id) => tools.some((tool) => tool.id === id && tool.available === true))
        ? pass('backend security workflows advertised available')
        : fail('backend security workflows are not all available');
    } else pass('backend /health HTTP 200');
  } catch (error) { fail(`backend ${pathname} request failed: ${error}`); }
}

if (failures.length) {
  console.error(`AJN PDF LIVE GATES: FAIL (${failures.length} issue(s))`);
  process.exit(1);
}
console.log(`AJN PDF LIVE GATES: PASS (${ids.length} public tools + SEO + backend)`);
