import fs from 'node:fs';
import path from 'node:path';

const pass = (name, condition) => {
  if (!condition) throw new Error(`FAIL: ${name}`);
  console.log(`PASS: ${name}`);
};

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const runner = fs.readFileSync('scripts/run-eslint.mjs', 'utf8');
const sign = fs.readFileSync('src/components/junction/SignPdf.tsx', 'utf8');
const pdfUtils = fs.readFileSync('src/components/junction/_pdfUtils.ts', 'utf8');
const runtimeImage = fs.readFileSync('src/components/ui/runtime-image.tsx', 'utf8');
const compressWorker = fs.readFileSync('src/lib/pdf-compress/worker.ts', 'utf8');

pass('AJN PDF code-quality release version is 3.1.0', pkg.version === '3.1.0');
pass('ESLint flat configuration exists', fs.existsSync('eslint.config.mjs'));
pass('Legacy ESLintRC configuration is removed', !fs.existsSync('.eslintrc.json'));
pass('Lint fails on every warning', runner.includes("'--max-warnings'") && runner.includes("'0'"));
pass('Legacy ESLINT_USE_FLAT_CONFIG=false launcher mode is removed', !runner.includes("ESLINT_USE_FLAT_CONFIG: 'false'"));
pass('Runtime preview images are centralized', runtimeImage.includes('Runtime-only preview/media URLs intentionally bypass Next image optimization'));
pass('Sign PDF captures a stable drawing engine reference', sign.includes('const drawingEngine = engineRef.current;') && sign.includes('drawingEngine!.exportPNG()') && !sign.includes('engineRef.current.exportPNG()'));
pass('Add Image PDF helper applies requested position and size', pdfUtils.includes('page.drawImage(img, { x, y, width: w, height: h });'));
const imagesToPdfBlock = pdfUtils.slice(pdfUtils.indexOf('export async function imagesToPdf'), pdfUtils.indexOf('export async function pdfToImages'));
pass('Images to PDF uses each image page dimensions without editor-only coordinates', imagesToPdfBlock.includes('page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });') && !imagesToPdfBlock.includes('width: w') && !imagesToPdfBlock.includes('height: h'));
pass('PDF compression worker safely reports unknown caught errors', compressWorker.includes('catch (err)') && compressWorker.includes('err instanceof Error ? err.message') && compressWorker.includes('error: message'));

const rawImgFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.tsx$/.test(entry.name) && full.replaceAll('\\\\','/').replaceAll('\\','/') !== 'src/components/ui/runtime-image.tsx') {
      if (fs.readFileSync(full, 'utf8').includes('<img')) rawImgFiles.push(full);
    }
  }
}
walk('src');
pass('No scattered raw img elements remain outside RuntimeImage', rawImgFiles.length === 0);

pass('RuntimeImage requires and renders explicit alt text', runtimeImage.includes("alt: string") && runtimeImage.includes('return <img alt={alt} {...props} />;'));
const misplacedClientDirective = [];
function checkClientDirective(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) checkClientDirective(full);
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      const source = fs.readFileSync(full, 'utf8');
      const directiveIndex = source.indexOf('"use client";');
      const singleDirectiveIndex = source.indexOf("'use client';");
      const idx = directiveIndex >= 0 ? directiveIndex : singleDirectiveIndex;
      if (idx > 0 && source.slice(0, idx).trim()) misplacedClientDirective.push(full);
    }
  }
}
checkClientDirective('src');
pass('Client directives remain first statements', misplacedClientDirective.length === 0);
const warningIntegration = fs.readFileSync('backend/app/conversion_engine.py', 'utf8');
const setup = `${fs.readFileSync('SETUP_FULL_PRODUCTION.ps1', 'utf8')}
${fs.readFileSync('R16_PRODUCTION_SETUP_AND_DEPLOY.ps1', 'utf8')}`;
pass('Known EbookLib 0.18 warnings are scoped at the integration boundary', warningIntegration.includes('warnings.catch_warnings()') && warningIntegration.includes('ignore_ncx'));
pass(
  'XPS uses PyMuPDF and Ghostscript is not required',
  setup.includes('XPS uses PyMuPDF; Ghostscript is not required') &&
  !setup.includes('Write-Warning "Ghostscript is unavailable')
);

console.log('AJN PDF zero-warning code-quality source guard completed successfully.');
