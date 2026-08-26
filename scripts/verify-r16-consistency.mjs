import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const check = (label, ok) => ok ? console.log(`PASS: ${label}`) : failures.push(label);

const next = read('next.config.ts');
const backend = read('src/lib/pdf-backend.ts');
const backendUrl = read('src/lib/backend-service-url.ts');
const policy = read('src/lib/tool-policy.ts');
const limits = read('src/lib/tool-limit-constants.ts');
const server = read('src/components/junction/ServerConversionTool.tsx');
const protect = read('src/components/junction/ProtectPdf.tsx');
const unlock = read('src/components/junction/UnlockPdf.tsx');
const repair = read('src/components/junction/RepairPdf.tsx');
const merge = read('src/components/junction/MergePdf.tsx');
const mergeEngine = read('src/lib/merge-pdf-browser.ts');
const workspace = read('src/components/junction/tool-workspace-client.tsx');
const audit = read('scripts/audit-r13-browser-layout.mjs');
const workflow = read('scripts/verify-backend-workflow.mjs');
const docker = read('backend/Dockerfile');
const engine = read('backend/app/conversion_engine.py');
const pdfWorker = read('src/lib/pdfjs-worker.ts');
const packageJson = JSON.parse(read('package.json'));
const workerSync = read('scripts/sync-pdfjs-worker.mjs');
const publicIds = JSON.parse(read('scripts/r13-public-tool-ids.json'));
const publicIdSet = new Set(publicIds);

check('CSP and frontend use shared backend candidate resolver', next.includes('configuredPdfBackendCandidates') && backend.includes('configuredPdfBackendCandidates') && backendUrl.includes('NEXT_PUBLIC_AJN_PDF_API_URL') && backendUrl.includes('DEFAULT_PDF_BACKEND_URL'));
check('R21 public PDF route inventory is unique and stable', publicIds.length === 20 && publicIdSet.size === 20);
check('R21 public inventory excludes standalone image utilities', !['image-reducer','image-resizer','crop-image','rotate-image','watermark-image','flip-image','convert-image'].some((id) => publicIdSet.has(id)));
check('obsolete R16/R17 local deploy wrappers stay retired', !fs.existsSync('R16_PRODUCTION_SETUP_AND_DEPLOY.ps1') && !fs.existsSync('R17_TRUST_SEO_SETUP_AND_DEPLOY.ps1'));
check('PDF.js worker is same-origin and generated from pinned local dependency', pdfWorker.includes("const PDF_WORKER_SRC = '/pdf.worker.min.mjs'") && !pdfWorker.includes('cdnjs.cloudflare.com') && workerSync.includes("pdfjs-dist', 'build', 'pdf.worker.min.mjs") && packageJson.scripts?.prebuild?.includes('sync-pdfjs-worker.mjs') && packageJson.scripts?.predev?.includes('sync-pdfjs-worker.mjs') && next.includes("worker-src 'self' blob:"));
check('server UI enforces live file/total limits without stale common limit copy', server.includes('validateBackendSelection') && server.includes('backendHealth') && server.includes('latestHealth') && !server.includes('liveLimits.maxFileSizeMb'));
check('Protect/Unlock/Repair recheck live server limits at action time', [protect, unlock, repair].every((source) => source.includes('const latestHealth = await checkPdfBackendHealth()') && source.includes('resolveBackendLimits(latestHealth)') && source.includes('effectiveMaxMb') && source.includes('maxSizeMb: effectiveMaxMb')));

const cap = JSON.parse(read('src/generated/backend-capabilities.json'));
check('capability snapshot matches current production backend contract', cap.toolCount === 68 && cap.availableCount === 68 && cap.unavailableCount === 0);
check('backend workflow verifier follows candidate /ready implementation', workflow.includes('SERVICE_CANDIDATES') || workflow.includes('candidate}/ready'));
check('browser audit captures exception descriptions and stacks', audit.includes('exception.description') && audit.includes('stackTrace') && audit.includes('lineNumber'));
check('Merge has no outer next/dynamic boundary', workspace.includes("import MergePdf from './MergePdf'") && !/['\"]merge-pdf['\"]\s*:\s*dynamic/.test(workspace));
check('Merge UI and acceptance share merge-pdf-browser helper', merge.includes('mergePdfFiles') && mergeEngine.includes("await import('pdf-lib')") && read('scripts/verify-r13-browser-pdf-acceptance.mjs').includes('merge-pdf-browser.ts'));
check('Merge limits have one source of truth', merge.includes('MERGE_PDF_LIMITS') && policy.includes('MERGE_PDF_LIMITS') && limits.includes('maxFiles: 30') && limits.includes('maxFileSizeMb: 50') && limits.includes('maxTotalSizeMb: 150'));
check('Merge source has no mojibake', !/[Ã¢Ã‚][â‚¬Â¦Â·]/.test(merge) && !merge.includes('Ã¢â‚¬Â¦') && !merge.includes('Ã‚Â·'));
check('R21 redirects moved image and retired tool routes centrally', next.includes('imageToolRedirects') && next.includes('retiredToolRedirects') && next.includes("destination: '/img'") && next.includes("destination: '/pdf-tools'"));
check('browser audit includes all canonical public route IDs', audit.includes('r13-public-tool-ids.json') && audit.includes('allToolRoutes'));
const convertBody = engine.slice(engine.indexOf('def convert('));
const xpsBranchIndex = convertBody.indexOf("if spec.processor == 'xps_to_pdf':");
const availabilityIndex = convertBody.indexOf('available, reason = tool_available(spec)');
check('XPS uses the internal PyMuPDF conversion path before external availability checks', engine.includes("('xps-to-pdf', 'XPS to PDF', ('.xps',), 'xps_to_pdf'") && engine.includes('import pymupdf as _ajn_pymupdf') && engine.includes('_ajn_xps_doc.convert_to_pdf()') && xpsBranchIndex >= 0 && availabilityIndex >= 0 && xpsBranchIndex < availabilityIndex);
check('production Docker acceptance is non-root and tests current public server workflows', docker.includes('USER 10001') && docker.lastIndexOf('USER 10001') < docker.lastIndexOf('python public_backend_acceptance_test.py') && docker.includes('QT_QPA_PLATFORM=offscreen') && docker.includes('QT_QUICK_BACKEND=software') && docker.includes('--disable-gpu') && docker.includes('public_backend_acceptance_test.py') && !docker.includes('recognition_language_gate.py') && !docker.includes('recognition_multilingual_acceptance_test.py') && !docker.includes('--no-sandbox') && !docker.includes('QTWEBENGINE_DISABLE_SANDBOX'));

if (failures.length) {
  console.error('AJN PDF R16 CONSISTENCY: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('AJN PDF R16 CONSISTENCY: PASS');
