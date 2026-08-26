import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ids = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'r13-public-tool-ids.json'), 'utf8'));
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
if (!fs.existsSync(nextBin)) {
  console.error(`FAIL: Next.js runtime was not found at ${nextBin}`);
  process.exit(1);
}
if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
  console.error('FAIL: .next production output is missing; run npm run build first.');
  process.exit(1);
}

const port = 41400 + (process.pid % 500);
const origin = `http://127.0.0.1:${port}`;
const standaloneServer = path.join(root, '.next', 'standalone', 'server.js');
const useStandalone = fs.existsSync(standaloneServer);
const child = spawn(
  process.execPath,
  useStandalone ? [standaloneServer] : [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)],
  {
    cwd: useStandalone ? path.dirname(standaloneServer) : root,
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port), HOSTNAME: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

let serverOutput = '';
child.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
child.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const failures = [];
const passes = [];
const pass = (message) => { passes.push(message); console.log(`PASS: ${message}`); };
const fail = (message) => failures.push(message);

async function request(pathname) {
  const response = await fetch(`${origin}${pathname}`, { redirect: 'manual', headers: { 'user-agent': 'AJN-PDF-R13-Runtime-Audit/1.0' } });
  return { response, text: await response.text() };
}
function locationPath(result) {
  const raw = result.response.headers.get('location') || '';
  if (!raw) return '';
  try { return new URL(raw, origin).pathname; } catch { return raw; }
}
function canonicalFrom(html) {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return match?.[1] || '';
}
async function mapLimit(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

// R21 is PDF-only. Historical conversion aliases now retire to the PDF directory,
// while the former PSD/image route hands off to the separate AJN IMG product.
const retiredPdfAliases = [
  'word-pdf','pdf-word','excel-pdf','pdf-excel','ppt-pdf','jpg-pdf','pdf-jpg','heic-pdf',
  'html-pdf','xml-pdf','json-pdf','txt-pdf','smart-read','pdf-ppt',
];
const r21HistoricalRedirects = Object.fromEntries([
  ...retiredPdfAliases.flatMap((slug) => [[`/${slug}`, '/pdf-tools'], [`/tools/${slug}`, '/pdf-tools']]),
  ['/psd-pdf', '/img'],
  ['/tools/psd-pdf', '/img'],
]);

try {
  let home;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Next.js exited before readiness.\n${serverOutput.slice(-5000)}`);
    try {
      home = await request('/');
      if (home.response.ok) break;
    } catch {}
    await sleep(400);
  }
  if (!home?.response.ok) throw new Error(`Homepage did not become ready on ${origin}.\n${serverOutput.slice(-5000)}`);
  pass('production server became ready');
  const releaseSource = fs.readFileSync(path.join(root, 'src', 'app', 'layout.tsx'), 'utf8');
  const expectedRelease = releaseSource.match(/['"]ajn-release['"]\s*:\s*['"]([^'"]+)['"]/i)?.[1] || '';
  const homepageRelease = (
    home.text.match(/<meta[^>]+name=["']ajn-release["'][^>]+content=["']([^"']+)["']/i)
    || home.text.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']ajn-release["']/i)
  )?.[1] || '';

  if (!expectedRelease) {
    fail('source metadata is missing the AJN release marker');
  } else if (!homepageRelease) {
    fail(`homepage is missing the AJN ${expectedRelease} release marker`);
  } else if (homepageRelease !== expectedRelease) {
    fail(`homepage release marker mismatch: expected ${expectedRelease}, got ${homepageRelease}`);
  } else {
    pass(`homepage carries the AJN PDF ${expectedRelease} release marker`);
  }

  const rootResults = [];
  await mapLimit(ids, 10, async (id) => {
    try {
      const result = await request(`/${id}`);
      const canonical = canonicalFrom(result.text);
      const expectedCanonical = `https://www.ajnpdf.com/${id}`;
      const ok = result.response.status === 200 && canonical === expectedCanonical && !result.text.includes(`https://www.ajnpdf.com/tools/${id}`);
      rootResults.push({ id, status: result.response.status, canonical, ok });
      if (!ok) fail(`/${id}: status=${result.response.status}, canonical=${canonical || '(missing)'}`);
    } catch (error) {
      rootResults.push({ id, status: 0, canonical: '', ok: false, error: String(error) });
      fail(`/${id}: request failed: ${error}`);
    }
  });
  if (rootResults.every((item) => item.ok)) pass(`all ${ids.length} canonical root tool pages return 200 with self canonicals`);

  const legacyResults = [];
  await mapLimit(ids, 10, async (id) => {
    try {
      const result = await request(`/tools/${id}`);
      const location = locationPath(result);
      const ok = [301, 308].includes(result.response.status) && location === `/${id}`;
      legacyResults.push({ id, status: result.response.status, location, ok });
      if (!ok) fail(`/tools/${id}: status=${result.response.status}, location=${location || '(missing)'}`);
    } catch (error) {
      legacyResults.push({ id, status: 0, location: '', ok: false, error: String(error) });
      fail(`/tools/${id}: request failed: ${error}`);
    }
  });
  if (legacyResults.every((item) => item.ok)) pass(`all ${ids.length} legacy /tools/* URLs permanently redirect in one hop to root slugs`);

  const redirectFailuresBefore = failures.length;
  for (const [source, target] of Object.entries(r21HistoricalRedirects)) {
    const result = await request(source);
    const location = locationPath(result);
    if (![301, 308].includes(result.response.status) || location !== target) {
      fail(`${source}: expected R21 permanent redirect to ${target}, got ${result.response.status} ${location || '(missing)'}`);
    }
  }
  if (failures.length === redirectFailuresBefore) {
    pass('historical conversion aliases retire directly to /pdf-tools and PSD hands off directly to /img');
  }

  const toolsDir = await request('/tools');
  if (![301, 308].includes(toolsDir.response.status) || locationPath(toolsDir) !== '/pdf-tools') fail(`/tools directory redirect is incorrect: ${toolsDir.response.status} ${locationPath(toolsDir)}`);
  else pass('/tools permanently redirects to /pdf-tools');

  const sitemap = await request('/sitemap.xml');
  if (sitemap.response.status !== 200) fail(`/sitemap.xml returned ${sitemap.response.status}`);
  else {
    const missing = ids.filter((id) => !sitemap.text.includes(`https://www.ajnpdf.com/${id}`));
    if (missing.length) fail(`sitemap is missing canonical tool URLs: ${missing.slice(0, 12).join(', ')}`);
    if (/https:\/\/www\.ajnpdf\.com\/tools\//i.test(sitemap.text)) fail('sitemap still publishes legacy /tools/ URLs');
    if (!missing.length && !/https:\/\/www\.ajnpdf\.com\/tools\//i.test(sitemap.text)) pass(`sitemap contains all ${ids.length} root tool URLs and zero legacy /tools/ tool URLs`);
  }

  const trustPaths = ['/', '/about', '/privacy', '/faq', '/transparency', '/pdf-tools'];
  const stalePatterns = [/100%\s*(?:private|local)/i,/Unlimited file size/i,/50,?000\+/i,/50K\+\+/i,/Zero-Server-Transit/i,/files never leave/i,/files are never uploaded/i,/Safe Browsing Verified/i,/No servers/i,/zero server uploads/i];
  for (const pathname of trustPaths) {
    const result = await request(pathname);
    if (result.response.status !== 200) { fail(`${pathname} returned ${result.response.status}`); continue; }
    for (const pattern of stalePatterns) if (pattern.test(result.text)) fail(`${pathname} contains stale claim ${pattern}`);
  }
  if (!failures.some((item) => trustPaths.some((pathname) => item.startsWith(`${pathname} `)))) pass('built public trust pages contain none of the audited stale universal claims');

  const report = {
    generatedAt: new Date().toISOString(),
    origin,
    canonicalTools: rootResults,
    legacyTools: legacyResults,
    historicalRedirects: r21HistoricalRedirects,
    failures,
  };
  const builtReportPath = process.env.AJN_R13_BUILT_REPORT || path.join(root, 'R13_BUILT_RUNTIME_REPORT.json');
  fs.mkdirSync(path.dirname(builtReportPath), { recursive: true });
  fs.writeFileSync(builtReportPath, `${JSON.stringify(report, null, 2)}\n`);

  if (failures.length) {
    for (const failure of failures) console.error(`FAIL: ${failure}`);
    throw new Error(`R13 built runtime verification failed with ${failures.length} issue(s).`);
  }
  console.log(`AJN PDF R13 BUILT RUNTIME VERIFICATION: PASS (${ids.length} root pages + ${ids.length} legacy redirects + R21 historical redirects).`);
  console.log('Real Chrome/Edge rendering, field Core Web Vitals, CMP/AdSense behavior and public Vercel deployment remain live-environment gates.');
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  if (child.exitCode === null) child.kill('SIGTERM');
  await sleep(300);
  if (child.exitCode === null) child.kill('SIGKILL');
}
