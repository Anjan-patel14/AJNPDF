import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const failures = [];
const check = (label, ok) => ok ? console.log(`PASS: ${label}`) : failures.push(label);

const expectedBrowserImageIds = ['image-to-pdf','jpg-to-pdf','jpeg-to-pdf','png-to-pdf','webp-to-pdf'];
const policy = read('src/lib/tool-policy.ts');
const workspace = read('src/components/junction/tool-workspace-client.tsx');
const processor = read('src/components/junction/ImagesToPdf.tsx');
const navbar = read('src/components/landing/navbar.tsx');
const ids = JSON.parse(read('scripts/r13-public-tool-ids.json'));

check('public release contains 25 tools', ids.length === 25 && new Set(ids).size === 25);
for (const id of expectedBrowserImageIds) {
  check(`${id} is in the public release`, ids.includes(id));
  check(`${id} is public policy`, policy.includes(`'${id}'`));
  check(`${id} maps to browser image processor`, workspace.includes(`'${id}': dynamic(() => import('./ImagesToPdf')`));
}
check('browser image routes bypass server routing', workspace.includes('BROWSER_IMAGE_TO_PDF_IDS.has(id) ? null'));
check('processor uses pdf-lib in browser', processor.includes('PDFDocument.create()'));
check('processor validates file count', processor.includes('MAX_FILES = 30'));
check('processor validates per-file bytes', processor.includes('MAX_FILE_BYTES'));
check('processor validates total bytes', processor.includes('MAX_TOTAL_BYTES'));
check('processor validates decoded pixels', processor.includes('MAX_SOURCE_PIXELS'));
check('processor downscales oversized raster work', processor.includes('MAX_RASTER_PIXELS') && processor.includes('MAX_RASTER_SIDE'));
check('processor supports reordering', processor.includes('moveItem'));
check('processor supports rotation', processor.includes('rotateItem'));
check('processor supports A4/Letter/Fit', processor.includes('"fit" | "a4" | "letter"'));
check('processor supports actual progress', processor.includes('updateToolProcessing') && processor.includes('pageNumber / items.length'));
check('processor supports cancellation', processor.includes('cancelRef.current'));
check('processor has no backend fetch', !/\bfetch\s*\(/.test(processor));
check('processor has no Cloud Run URL', !/run\.app/i.test(processor));
check('navbar exposes AJN Buzz Image Tools', navbar.includes('https://ajn.buzz') && navbar.includes('Image Tools'));
check('navbar external link uses noopener', navbar.includes('noopener noreferrer'));

if (failures.length) {
  console.error('AJN PDF BROWSER IMAGE->PDF RELEASE: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('AJN PDF BROWSER IMAGE->PDF RELEASE: PASS');
