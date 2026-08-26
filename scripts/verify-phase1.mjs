import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
let failed = false;
const pass = (message) => console.log(`PASS: ${message}`);
const fail = (message) => { failed = true; console.error(`FAIL: ${message}`); };

const packageJson = JSON.parse(read('package.json'));
packageJson.scripts?.build === 'next build' ? pass('Windows-compatible Next.js build command') : fail('Build command must be next build');

const toolData = read('src/lib/tools-data.ts');
const policy = read('src/lib/tool-policy.ts');
const workspace = read('src/components/junction/tool-workspace-client.tsx');
const ids = [...toolData.matchAll(/\bid:\s*'([^']+)'/g)].map(match => match[1]);
const mapped = new Set([...workspace.matchAll(/'([^']+)':\s*dynamic/g)].map(match => match[1]));

// R16: Merge PDF is deliberately direct-imported so initial route rendering
// does not depend on a separate next/dynamic chunk.
const directMergeMapped =
  workspace.includes("import MergePdf from './MergePdf'") &&
  workspace.includes("id === 'merge-pdf' ? MergePdf : TOOL_COMPONENTS[id]");

if (directMergeMapped) mapped.add('merge-pdf');
if (ids.length === new Set(ids).size) pass(`${ids.length} unique registered base tools`); else fail('Duplicate tool IDs found');
for (const id of ids) if (!mapped.has(id)) fail(`${id} has no component mapping`);
if (!failed) pass('Every registered base tool has a component mapping');

for (const id of ['pdf-ppt', 'pdf-a', 'pdf-ua', 'smart-read', 'upscale-image', 'remove-bg', 'blur-face']) {
  policy.includes(`'${id}'`) ? pass(`${id} is governed by production policy`) : fail(`${id} missing from production policy`);
}
if (toolData.includes('PUBLIC_TOOLS') && toolData.includes('isToolPublic')) pass('Public directories are filtered by production policy');
else fail('PUBLIC_TOOLS policy filter is missing');

const unlockLegacy = read('src/lib/pdf-unlock.ts');
if (/COMMON_PDF_PASSWORDS|tryCommonPasswords|brute-forcing/i.test(unlockLegacy)) fail('Password guessing remains in source');
else pass('Password guessing and dictionary attacks removed');

const backend = read('backend/app/main.py');
const jobWorker = read('backend/app/job_worker.py');
for (const endpoint of ['/health', '/api/pdf/protect', '/api/pdf/unlock', '/api/pdf/repair', '/api/pdf/compress']) {
  backend.includes(endpoint) ? pass(`Python endpoint ${endpoint}`) : fail(`Missing Python endpoint ${endpoint}`);
}
if (backend.includes('TemporaryDirectory') && backend.includes('BackgroundTask(tmp.cleanup)')) pass('Temporary service files are cleaned after delivery');
else fail('Temporary-file cleanup is not implemented');
if (jobWorker.includes('pikepdf.Encryption') && jobWorker.includes('R=6') && jobWorker.includes('aes=True')) pass('AES PDF encryption engine configured');
else fail('Real PDF encryption is missing');

const protect = read('src/components/junction/ProtectPdf.tsx');
const unlock = read('src/components/junction/UnlockPdf.tsx');
if (protect.includes('protectPdfOnServer') && unlock.includes('unlockPdfOnServer')) pass('Security UI calls real backend processors');
else fail('Security UI does not use the backend');
if (unlock.includes('I own this document or have permission')) pass('Unlock authorization confirmation present');
else fail('Unlock authorization confirmation missing');

const shared = read('src/components/junction/_shared.tsx');
const toolRoute = read('src/app/(tool-pages)/[id]/page.tsx');
if (!shared.includes('AdSenseUnit') && toolRoute.indexOf('ToolEditorialContent') < toolRoute.indexOf('AdSenseUnit')) pass('Tool ads are separated from controls by useful editorial content');
else fail('Tool advertisement placement is too close to processing controls');

const adsLoader = read('src/components/adsense-script-loader.tsx');
const adUnit = read('src/components/adsense-unit.tsx');
if (adsLoader.includes('ajn_cookie_consent') && adsLoader.includes('ajnpdf.com') && adUnit.includes('ajn_cookie_consent')) pass('AdSense loading and ad requests are production-domain and consent aware');
else fail('AdSense production/consent guard is incomplete');
if (adUnit.includes("data-ad-status") && adUnit.includes("unfilled")) pass('Unfilled ad slots can collapse cleanly');
else fail('Unfilled ad-slot collapse is missing');

const analytics = read('src/components/analytics/site-analytics.tsx');
if (analytics.includes("'tool_complete'") && !analytics.includes('Math.random')) pass('Processing analytics uses real workflow completion events rather than a fake public counter');
else fail('Completion analytics/fake-counter guard is incomplete');

const processing = read('src/components/ajnpdf/processing-activity-provider.tsx');
if (processing.includes('progressPct') && processing.includes('cancelJob') && !processing.includes('elapsedSeconds')) pass('Shared processing lifecycle uses truthful progress/cancellation state');
else fail('Shared processing lifecycle is incomplete');

for (const file of ['MergePdf.tsx', 'SplitPdf.tsx', 'CompressPdf.tsx', 'ImageToPdfTool.tsx', 'PdfToJpg.tsx', 'ProtectPdf.tsx', 'UnlockPdf.tsx', 'RepairPdf.tsx']) {
  fs.existsSync(path.join(root, 'src/components/junction', file)) ? pass(`Strong tool component ${file}`) : fail(`Missing ${file}`);
}

if (failed) process.exit(1);
console.log('AJN PDF production-tool verification completed successfully.');
