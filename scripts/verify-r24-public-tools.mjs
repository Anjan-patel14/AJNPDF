import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const failures = [];
const check = (label, ok) => ok ? console.log(`PASS: ${label}`) : failures.push(label);

const expected = [
  'add-image-to-pdf','add-text','compare-pdf','compress-pdf','crop-pdf','delete-pdf-pages',
  'extract-images','flatten-pdf','merge-pdf','organize-pdf','page-number','pdf-metadata',
  'pdf-zip-extract','protect-pdf','repair-pdf','rotate-pdf','sign-pdf','split-pdf','unlock-pdf','watermark-pdf',
].sort();
const ids = JSON.parse(read('scripts/r13-public-tool-ids.json')).sort();
check('public catalog remains exactly 20 PDF tools', JSON.stringify(ids) === JSON.stringify(expected));

const policy = read('src/lib/tool-policy.ts');
for (const id of expected) check(`tool policy includes ${id}`, policy.includes(`'${id}'`));

const workspace = read('src/components/junction/tool-workspace-client.tsx');
const directMerge = workspace.includes("const ToolComponent = id === 'merge-pdf' ? MergePdf : TOOL_COMPONENTS[id]");
check('Merge PDF has a real workspace', directMerge);
for (const id of expected.filter(id => id !== 'merge-pdf')) {
  check(`${id} has a real component mapping`, workspace.includes(`'${id}': dynamic(() => import(`));
}

const validation = read('src/lib/file-validation.ts');
check('central PDF validator accepts MIME/extension candidates then verifies %PDF header', validation.includes('validatePdfFile') && validation.includes('isPdfCandidate') && validation.includes('hasPdfHeader(file)'));

const hardenedCustom = [
  'RotatePdf.tsx','DeletePages.tsx','OrganizePdf.tsx','WatermarkPdf.tsx','AddNumbers.tsx',
  'FlattenPdf.tsx','AddText.tsx','AddImageToPdf.tsx','PdfMetadata.tsx','ExtractImages.tsx','SignPdfStudio.tsx','PdfToZip.tsx',
];
for (const file of hardenedCustom) {
  check(`${file} uses central real-PDF validation`, read(`src/components/junction/${file}`).includes('validatePdfFile'));
}

const organize = read('src/components/junction/OrganizePdf.tsx');
check('Organize preserves distinct same-name File objects', !organize.includes('new Map<string, File>()') && organize.includes('sourceFiles.includes(item.file)'));
check('Organize surfaces engine failures', organize.includes("if (!res.success || !res.blob)"));
for (const file of ['RotatePdf.tsx','DeletePages.tsx']) {
  check(`${file} surfaces engine failures`, read(`src/components/junction/${file}`).includes('if (!res.success || !res.blob)'));
}

const flatten = read('src/components/junction/FlattenPdf.tsx');
check('Flatten describes supported form-field behavior only', flatten.includes('supported interactive form fields') && !flatten.includes('multiple layers\u2014such as text, images, annotations'));
check('Flatten does not display synthetic percentage progress', !flatten.includes('{progress}%') && !flatten.includes('<Progress value={progress}'));
const flattenCatch = /form\.flatten\(\);\s*\}\s*catch\s*\{([\s\S]*?)\}/.exec(flatten)?.[1] || '';
check('Flatten no-form-field branch does not emit processing failure', !flattenCatch.includes('failToolProcessing'));

const shared = read('src/components/junction/_shared.tsx');
check('workspace uses the supplied accent', shared.includes('"--jn-accent": accent'));
check('shared live-status copy has no mojibake', !shared.includes('\u00e2\u20ac\u00a6'));

const backend = read('backend/app/main.py');
check('Cloud Run has scoped AJN PDF Vercel CORS regex', backend.includes('AJN_ALLOWED_ORIGIN_REGEX') && backend.includes('allow_origin_regex=ALLOWED_ORIGIN_REGEX') && backend.includes('ajnpdff|ajnpdf'));
check('frontend fallback is canonical Cloud Run URL', read('src/lib/backend-service-url.ts').includes('ajn-pdf-api-580158856470.asia-south1.run.app'));
check('backend acceptance verifies Vercel preflight', read('backend/public_backend_acceptance_test.py').includes("Origin': origin") && read('backend/public_backend_acceptance_test.py').includes("origin = 'https://ajnpdff.vercel.app'"));

const utils = read('src/components/junction/_pdfUtils.ts');
check('metadata fields can be cleared', utils.includes('doc.setTitle(title || "")') && utils.includes('doc.setKeywords(keywords.trim() ?'));
const metadata = read('src/components/junction/PdfMetadata.tsx');
check('metadata result is not mislabeled as scrubbed', !metadata.includes('Scrubbed_Document.pdf') && metadata.includes('metadata-updated.pdf'));

const compare = read('src/components/junction/ComparePdf.tsx');
check('Compare makes no neural-diff claim', !/Neural Text Diffing/i.test(compare));

check('continuous live smoke script exists', exists('scripts/verify-r24-live-smoke.mjs'));
check('continuous live smoke workflow exists', exists('.github/workflows/live-smoke.yml'));
if (exists('.github/workflows/live-smoke.yml')) {
  const smokeWorkflow = read('.github/workflows/live-smoke.yml');
  check('live smoke is scheduled hourly', /cron:\s*['"]17 \* \* \* \*['"]/.test(smokeWorkflow));
}

if (failures.length) {
  console.error('AJN PDF R24 PUBLIC TOOL CONTRACT: FAIL');
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
console.log('AJN PDF R24 PUBLIC TOOL CONTRACT: PASS');
