import fs from 'node:fs';

const BASE = (process.env.AJN_LIVE_BASE_URL || 'https://www.ajnpdf.com').replace(/\/$/, '');
const CANONICAL = 'https://www.ajnpdf.com';
const ids = JSON.parse(fs.readFileSync('scripts/r13-public-tool-ids.json', 'utf8'));
const failures = [];
const pass = (message) => console.log(`PASS: ${message}`);
const fail = (message) => { failures.push(message); console.error(`FAIL: ${message}`); };

async function request(url, init = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'user-agent': 'AJN-PDF-Frontend-Production-Monitor/1.0', ...(init.headers || {}) },
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

try {
  const response = await request(`${BASE}/`);
  const html = await response.text();
  if (response.status !== 200) fail(`homepage HTTP ${response.status}`);
  else if (!html.includes('google-adsense-account')) fail('homepage missing AdSense ownership meta');
  else pass('homepage HTTP 200 + AdSense ownership meta');
} catch (error) { fail(`homepage request failed: ${error}`); }

try {
  const response = await request(`${BASE}/robots.txt`);
  const text = await response.text();
  if (response.status !== 200) fail(`robots.txt HTTP ${response.status}`);
  else if (!text.includes(`${CANONICAL}/sitemap.xml`)) fail('robots.txt missing canonical sitemap');
  else pass('robots.txt canonical sitemap');
} catch (error) { fail(`robots.txt request failed: ${error}`); }

try {
  const response = await request(`${BASE}/ads.txt`);
  const text = (await response.text()).trim();
  const expected = 'google.com, pub-4495802176396975, DIRECT, f08c47fec0942fa0';
  if (response.status !== 200) fail(`ads.txt HTTP ${response.status}`);
  else if (text !== expected) fail('ads.txt content mismatch');
  else pass('ads.txt publisher record');
} catch (error) { fail(`ads.txt request failed: ${error}`); }

try {
  const response = await request(`${BASE}/sitemap.xml`);
  const xml = await response.text();
  const urls = new Set(sitemapLocs(xml));
  const missing = ids.filter((id) => !urls.has(`${CANONICAL}/${id}`));
  if (response.status !== 200) fail(`sitemap.xml HTTP ${response.status}`);
  else if (missing.length) fail(`sitemap missing tool URLs: ${missing.join(', ')}`);
  else pass(`sitemap contains all ${ids.length} current public tool URLs`);
} catch (error) { fail(`sitemap request failed: ${error}`); }

await mapLimit(ids, 5, async (id) => {
  try {
    const response = await request(`${BASE}/${id}`);
    const html = await response.text();
    const head = /<head\b[\s\S]*?<\/head>/i.exec(html)?.[0] || '';
    const canonical = `${CANONICAL}/${id}`;
    const ok =
      response.status === 200 &&
      /<title>[^<]*AJN PDF<\/title>/i.test(head) &&
      head.includes('rel="canonical"') &&
      head.includes(`href="${canonical}"`) &&
      !/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(head) &&
      html.includes(`tool-schema-${id}`);
    ok ? pass(`/${id}`) : fail(`/${id} production SEO identity mismatch`);
  } catch (error) { fail(`/${id}: ${error}`); }
});

for (const route of ['/pdf-tools','/privacy','/cookies','/file-processing-policy','/blog']) {
  try {
    const response = await request(`${BASE}${route}`);
    response.status === 200 ? pass(`${route} HTTP 200`) : fail(`${route} HTTP ${response.status}`);
  } catch (error) { fail(`${route}: ${error}`); }
}

if (failures.length) {
  console.error(`AJN PDF FRONTEND PRODUCTION MONITOR: FAIL (${failures.length})`);
  process.exit(1);
}
console.log(`AJN PDF FRONTEND PRODUCTION MONITOR: PASS (${ids.length} tool routes + SEO + ads.txt)`);