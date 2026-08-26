import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
if (!fs.existsSync(nextBin)) {
  console.error(`FAIL: Next.js runtime was not found at ${nextBin}`);
  process.exit(1);
}
if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
  console.error('FAIL: .next production output is missing; run npm run build first.');
  process.exit(1);
}

const port = 40100 + (process.pid % 700);
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

let output = '';
child.stdout.on('data', (chunk) => { output += chunk.toString(); });
child.stderr.on('data', (chunk) => { output += chunk.toString(); });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pass = (message) => console.log(`PASS: ${message}`);
const fail = (message) => { throw new Error(message); };

async function request(pathname) {
  const response = await fetch(`${origin}${pathname}`, { redirect: 'manual' });
  return { response, text: await response.text() };
}

function redirectLocation(result) {
  const raw = result.response.headers.get('location') || '';
  if (!raw) return '';
  try { return new URL(raw, origin).pathname; } catch { return raw; }
}

try {
  let home;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) fail(`Next.js exited before readiness.\n${output.slice(-4000)}`);
    try {
      home = await request('/');
      if (home.response.ok) break;
    } catch {}
    await sleep(500);
  }
  if (!home?.response.ok) fail(`Homepage did not become ready on ${origin}.\n${output.slice(-4000)}`);
  pass('production server became ready');

  for (const pathname of ['/merge-pdf', '/pdf-to-word']) {
    const result = await request(pathname);
    if (!result.response.ok) fail(`${pathname} returned HTTP ${result.response.status}`);
    if (!result.text.includes('AJN PDF')) fail(`${pathname} did not render AJN PDF HTML`);
    pass(`${pathname} returns HTTP ${result.response.status}`);
  }

  const merge = await request('/merge-pdf');
  if (!merge.text.includes('https://www.ajnpdf.com/merge-pdf')) {
    fail('/merge-pdf HTML is missing the root canonical/schema URL');
  }
  if (merge.text.includes('https://www.ajnpdf.com/tools/merge-pdf')) {
    fail('/merge-pdf HTML still publishes a legacy /tools/ canonical/schema URL');
  }
  pass('Merge PDF HTML publishes root-level canonical/schema URLs only');

  const toolsDirectory = await request('/tools');
  if (![301, 308].includes(toolsDirectory.response.status)) {
    fail(`/tools returned ${toolsDirectory.response.status}; expected permanent redirect`);
  }
  if (redirectLocation(toolsDirectory) !== '/pdf-tools') {
    fail(`/tools redirects to ${redirectLocation(toolsDirectory) || '(missing)'}, expected /pdf-tools`);
  }
  pass('/tools permanently redirects to /pdf-tools');

  const legacy = await request('/tools/merge-pdf');
  if (![301, 308].includes(legacy.response.status)) {
    fail(`/tools/merge-pdf returned ${legacy.response.status}; expected permanent redirect`);
  }
  if (redirectLocation(legacy) !== '/merge-pdf') {
    fail(`/tools/merge-pdf redirects to ${redirectLocation(legacy) || '(missing)'}, expected /merge-pdf`);
  }
  pass('/tools/merge-pdf permanently redirects to /merge-pdf');

  const alias = await request('/tools/pdf-jpg');
  if (![301, 308].includes(alias.response.status)) {
    fail(`/tools/pdf-jpg returned ${alias.response.status}; expected permanent redirect`);
  }
  if (redirectLocation(alias) !== '/pdf-to-jpg') {
    fail(`/tools/pdf-jpg redirects to ${redirectLocation(alias) || '(missing)'}, expected /pdf-to-jpg`);
  }
  pass('legacy PDF/JPG alias permanently redirects directly to /pdf-to-jpg');

  const sitemap = await request('/sitemap.xml');
  if (!sitemap.response.ok) fail(`/sitemap.xml returned HTTP ${sitemap.response.status}`);
  if (!sitemap.text.includes('https://www.ajnpdf.com/merge-pdf')) {
    fail('sitemap.xml does not contain the root Merge PDF URL');
  }
  if (sitemap.text.includes('https://www.ajnpdf.com/tools/merge-pdf')) {
    fail('sitemap.xml still contains the legacy /tools/ Merge PDF URL');
  }
  pass('sitemap publishes root tool URLs and excludes legacy /tools/ URLs');

  console.log('AJN PDF R12 ROOT ROUTES / PRO NAV BUILT RUNTIME VERIFICATION: PASS');
  console.log('Real-browser keyboard/focus behavior, field Core Web Vitals and live Vercel redirects remain post-deploy checks.');
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  if (child.exitCode === null) child.kill('SIGTERM');
  await sleep(300);
  if (child.exitCode === null) child.kill('SIGKILL');
}
