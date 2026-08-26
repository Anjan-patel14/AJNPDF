import fs from 'node:fs';
import path from 'node:path';

const required = [
  'src/app/(tool-pages)/[id]/page.tsx',
  'src/components/junction/ProtectPdf.tsx',
  'src/components/junction/UnlockPdf.tsx',
  'src/components/junction/RepairPdf.tsx',
  'src/components/junction/backend-status.tsx',
  'backend/app/main.py',
  'backend/Dockerfile',
  'src/app/privacy/page.tsx',
  'src/app/terms/page.tsx',
  'src/app/file-processing-policy/page.tsx',
  'src/app/acceptable-use/page.tsx',
  'src/app/data-deletion/page.tsx',
  'src/app/unlock-authorization-policy/page.tsx'];
for (const file of required) {
  if (!fs.existsSync(path.resolve(file))) throw new Error(`Missing production file: ${file}`);
}
const policy = fs.readFileSync('src/lib/tool-policy.ts', 'utf8');
for (const id of ['protect-pdf', 'unlock-pdf', 'repair-pdf']) {
  if (!policy.includes(id)) throw new Error(`Missing backend tool policy: ${id}`);
}
if (!policy.includes('publicByDefault: true')) throw new Error('Backend tools are not public by default.');
const backend = fs.readFileSync('backend/app/main.py', 'utf8');
const jobWorker = fs.readFileSync('backend/app/job_worker.py', 'utf8');
for (const endpoint of ['/health', '/ready', '/api/tools', '/api/convert/{tool_id}', '/api/admin/analytics', '/api/pdf/protect', '/api/pdf/unlock', '/api/pdf/repair']) {
  if (!backend.includes(endpoint)) throw new Error(`Missing backend endpoint: ${endpoint}`);
}
if (!jobWorker.includes('R=6') || !jobWorker.includes('aes=True') || !jobWorker.includes('pikepdf.Encryption')) throw new Error('AES-256 encryption is not configured.');
if (!backend.includes('TemporaryDirectory')) throw new Error('Temporary processing directories are not configured.');
if (!backend.includes('RATE_LIMIT_PER_MINUTE') || !backend.includes('_PROCESSING_SEMAPHORE')) throw new Error('Rate limiting or concurrency protection is missing.');
if (!backend.includes('X-Request-ID') || !backend.includes('request_complete')) throw new Error('Request ID or structured request logging is missing.');

const nextConfig = fs.readFileSync('next.config.ts', 'utf8');
if (!nextConfig.includes("value: 'ajnpdf.com'") || !nextConfig.includes("destination: 'https://www.ajnpdf.com/:path*'")) throw new Error('Canonical bare-domain to www redirect is missing.');
const adsLoader = fs.readFileSync('src/components/adsense-script-loader.tsx', 'utf8');
for (const route of ['/privacy', '/terms', '/security', '/status', '/transparency']) {
  if (!adsLoader.includes(`'${route}'`)) throw new Error(`AdSense legal/trust exclusion is missing: ${route}`);
}

const privacy = fs.readFileSync('src/app/privacy/page.tsx', 'utf8');
if (privacy.includes('Zero-Server-Transit') || privacy.includes('files are never uploaded')) throw new Error('Privacy page contains an inaccurate local-only claim.');
console.log('PASS: production routes, conversion API, optional analytics, legal pages, canonical redirect, ad exclusions, AES-256, limits, request logging and temporary cleanup are present.');
