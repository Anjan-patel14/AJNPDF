import fs from 'node:fs';

const frontend = (process.env.AJN_LIVE_BASE_URL || 'https://ajnpdff.vercel.app').replace(/\/$/, '');
const backend = (process.env.AJN_BACKEND_URL || 'https://ajn-pdf-api-580158856470.asia-south1.run.app').replace(/\/$/, '');
const ids = JSON.parse(fs.readFileSync('scripts/r13-public-tool-ids.json', 'utf8'));
const failures = [];

async function request(url, init = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store', headers: { 'user-agent': 'AJN-PDF-R24-Live-Smoke/1.0', ...(init.headers || {}) } });
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

function pass(message) { console.log(`PASS: ${message}`); }
function fail(message) { failures.push(message); console.error(`FAIL: ${message}`); }

try {
  const home = await request(`${frontend}/`);
  home.ok ? pass(`frontend ${home.status}`) : fail(`frontend returned ${home.status}`);
} catch (error) { fail(`frontend request failed: ${error}`); }

await mapLimit(ids, 5, async (id) => {
  try {
    const response = await request(`${frontend}/${id}`);
    if (response.status !== 200) return fail(`/${id} returned ${response.status}`);
    const text = await response.text();
    if (!/<html/i.test(text) || /404[^<]{0,40}not found/i.test(text)) return fail(`/${id} did not return a valid tool page`);
    pass(`/${id}`);
  } catch (error) { fail(`/${id}: ${error}`); }
});

let readyPayload = null;
for (const pathname of ['/health', '/ready', '/api/tools']) {
  try {
    const response = await request(`${backend}${pathname}`);
    if (!response.ok) { fail(`${pathname} returned ${response.status}`); continue; }
    if (pathname === '/ready') readyPayload = await response.clone().json().catch(() => null);
    if (pathname === '/api/tools') {
      const payload = await response.json().catch(() => ({}));
      const tools = Array.isArray(payload.tools) ? payload.tools : [];
      const security = ['protect-pdf','unlock-pdf','repair-pdf'];
      if (!security.every(id => tools.some(tool => tool.id === id && tool.available === true))) fail('/api/tools security workflows are not all available');
      else pass('/api/tools security workflows available');
    } else {
      pass(pathname);
    }
  } catch (error) { fail(`${pathname}: ${error}`); }
}
if (readyPayload && readyPayload.status !== 'ok') fail(`/ready status is ${readyPayload.status || '(missing)'}`);

try {
  const origin = new URL(frontend).origin;
  const response = await request(`${backend}/api/pdf/protect`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  const allowOrigin = response.headers.get('access-control-allow-origin');
  const allowMethods = response.headers.get('access-control-allow-methods') || '';
  if (!response.ok || allowOrigin !== origin || !allowMethods.includes('POST')) fail(`CORS preflight failed: HTTP ${response.status}, origin=${allowOrigin || '(missing)'}`);
  else pass(`CORS preflight permits ${origin}`);
} catch (error) { fail(`CORS preflight request failed: ${error}`); }

if (failures.length) {
  console.error(`AJN PDF R24 LIVE SMOKE: FAIL (${failures.length} issue(s))`);
  process.exit(1);
}
console.log(`AJN PDF R24 LIVE SMOKE: PASS (${ids.length}/20 public routes + backend + CORS)`);
