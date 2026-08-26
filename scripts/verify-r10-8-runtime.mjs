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
  console.error('FAIL: .next production output is missing; run the production build first.');
  process.exit(1);
}

const port = 39000 + (process.pid % 900);
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
const count = (text, token) => text.split(token).length - 1;
const fail = (message) => { throw new Error(message); };
const pass = (message) => console.log(`PASS: ${message}`);

async function get(pathname) {
  const response = await fetch(`${origin}${pathname}`, { redirect: 'manual' });
  return { response, text: await response.text() };
}

try {
  let home;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) fail(`Next.js exited before readiness.\n${output.slice(-4000)}`);
    try {
      home = await get('/');
      if (home.response.ok) break;
    } catch {}
    await sleep(500);
  }
  if (!home?.response.ok) fail(`Homepage did not become ready on ${origin}.\n${output.slice(-4000)}`);

  const heroCount = count(home.text, 'data-ajn-home-hero="primary"');
  const searchCount = count(home.text, 'data-ajn-home-search="primary"');
  if (heroCount !== 1) fail(`raw production HTML contains ${heroCount} primary hero markers; expected 1`);
  pass('raw production HTML contains exactly one primary hero');
  if (searchCount !== 1) fail(`raw production HTML contains ${searchCount} primary search markers; expected 1`);
  pass('raw production HTML contains exactly one primary search');

  const removedTagline = ['Made Simple', 'by AJN PDF.'].join(' ');
  if (home.text.includes(removedTagline)) fail('removed legacy hero tagline is present in production HTML');
  pass('removed legacy hero tagline is absent from production HTML');

  for (const route of ['/limits', '/status']) {
    const result = await get(route);
    if (!result.response.ok) fail(`${route} returned HTTP ${result.response.status}`);
    pass(`${route} returns HTTP ${result.response.status}`);
  }

  const headers = home.response.headers;
  const required = [
    ['content-security-policy', 'CSP'],
    ['strict-transport-security', 'HSTS'],
    ['x-content-type-options', 'nosniff'],
    ['referrer-policy', 'Referrer-Policy'],
    ['permissions-policy', 'Permissions-Policy'],
    ['cross-origin-opener-policy', 'COOP']];
  for (const [name, label] of required) {
    if (!headers.get(name)) fail(`${label} response header is missing`);
    pass(`${label} response header is present`);
  }

  console.log('AJN PDF R10.8 BUILT PRODUCTION SSR / HEADER SMOKE: PASS');
  console.log('Browser hydration-console and field Core Web Vitals QA are still manual/runtime checks.');
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  if (child.exitCode === null) child.kill('SIGTERM');
  await sleep(300);
  if (child.exitCode === null) child.kill('SIGKILL');
}
