import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const failures = [];
const check = (label, condition) => condition ? console.log(`PASS: ${label}`) : failures.push(label);

const backend = read('backend/app/main.py');
const constants = read('src/lib/tool-limit-constants.ts');
const disclosure = read('src/lib/processing-disclosure.ts');
const about = read('src/app/about/page.tsx');
const faq = read('src/app/faq/page.tsx');
const transparency = read('src/app/transparency/page.tsx');
const limits = read('src/app/limits/page.tsx');
const policy = read('src/app/file-processing-policy/page.tsx');
const editorial = read('src/lib/tool-editorial.ts');
const compress = read('src/components/junction/CompressPdf.tsx');
const compare = read('src/components/junction/ComparePdf.tsx');
const worker = read('src/lib/pdfjs-worker.ts');
const workflow = read('.github/workflows/production-quality.yml');
const layout = read('src/app/layout.tsx');

check(
  'frontend and backend fallback server limits are aligned at 30/30 MB',
  /maxFileSizeMb:\s*30/.test(constants) &&
  /maxTotalSizeMb:\s*30/.test(constants) &&
  /AJN_MAX_FILE_MB['"],\s*['"]30['"]/.test(backend) &&
  /AJN_MAX_TOTAL_MB['"],\s*['"]30['"]/.test(backend)
);

const staleLimitCopy = [
  disclosure, about, faq, transparency, limits, policy, editorial, compress].join('\n');
const stalePhrases = [
  /Limits shown by the tool/i,
  /tool page shows practical file limits/i,
  /shows the relevant limit on each tool screen/i,
  /visible per-file and file-count limits/i,
  /tool screen takes precedence/i,
  /live tool interface takes precedence/i,
  /Review the available controls and limits before processing/i,
  /This tool accepts up to \$\{policy\.maxFiles\}/,
  /Maximum 40 MB/i];
check('removed common/numerical processing-limit copy stays removed', stalePhrases.every((pattern) => !pattern.test(staleLimitCopy)));
check('dedicated limits page remains the policy source', limits.includes('Current policy limits') && limits.includes('SERVER_LIMIT_DEFAULTS'));
check('meaningful fidelity limitations remain in tool editorial', editorial.includes('limitations') && editorial.includes('Conversion quality depends on the source format'));

check(
  'Compare PDF validates extension, size and real PDF header without MIME-only rejection',
  compare.includes('validateFiles') &&
  compare.includes('hasPdfHeader') &&
  compare.includes('await hasPdfHeader(f)') &&
  !compare.includes("f.type === 'application/pdf'")
);

check(
  'same-origin PDF.js worker regression protection remains',
  worker.includes("const PDF_WORKER_SRC = '/pdf.worker.min.mjs'") &&
  !worker.includes('cdnjs.cloudflare.com') &&
  String(pkg.scripts?.prebuild || '').includes('sync-pdfjs-worker.mjs')
);

const unrsLock = String(lock.packages?.['node_modules/unrs-resolver']?.version || '');
check(
  'allowScripts matches the locked unrs-resolver version',
  Boolean(unrsLock) &&
  pkg.allowScripts?.[`unrs-resolver@${unrsLock}`] === true &&
  Object.keys(pkg.allowScripts || {}).filter((key) => key.startsWith('unrs-resolver@')).length === 1
);

const requiredCiGates = [
  'verify:dependency-policy',
  'verify:secrets',
  'verify:r18-production',
  'verify:r17-trust-seo',
  'verify:r16-consistency',
  'verify:tool-ux',
  'verify:final-ui',
  'verify:mobile-first',
  'verify:i18n',
  'verify:accessibility',
  'verify:r13-browser-pdf',
  'verify:r13-runtime'];
check('GitHub production CI contains the hardened regression gates', requiredCiGates.every((gate) => workflow.includes(gate)));
check('GitHub production CI cancels stale runs', workflow.includes('cancel-in-progress: true') && workflow.includes('concurrency:'));
check(
  'release metadata preserves R18-or-newer hardening lineage',
  /'ajn-release':\s*'3\.(?:1\.0-r18|[2-9]\.\d+-r\d+)'/.test(layout)
);
check(
  'R18 verifier is wired into npm scripts and full check',
  pkg.scripts?.['verify:r18-production'] === 'node scripts/verify-r18-production-readiness.mjs' &&
  String(pkg.scripts?.check || '').includes('npm run verify:r18-production')
);

if (failures.length) {
  console.error('AJN PDF R18 PRODUCTION READINESS: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('AJN PDF R18 PRODUCTION READINESS: PASS');
