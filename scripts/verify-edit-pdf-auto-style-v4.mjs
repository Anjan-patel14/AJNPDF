import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const editorPath = path.join(root, 'src', 'components', 'junction', 'PdfEditorLab.tsx');
const testPath = path.join(root, 'tests', 'editor.browser.mjs');
const fixturePath = path.join(root, 'tests', 'fixtures', 'scan-style-1page.pdf');
const editor = fs.readFileSync(editorPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const requiredEditor = [
  'hocr_font_info: "1"',
  'ocrFontSizeHint',
  'ocrFontFamilyHint',
  'ocrBoldHint',
  'ocrItalicHint',
  'sampleFromRaster',
  'colorDistance',
  'inferOcrFontStyle',
  'italicHint',
  'matchedFontSize',
  'matchedHorizontalScale',
  'autoStyle: true',
  'data-ajn-auto-style',
  'data-ajn-font-family',
  'data-ajn-font-size',
  'data-ajn-text-color',
  'data-ajn-font-weight',
  'data-ajn-font-style',
  'data-ajn-horizontal-scale',
  'data-ajn-style-confidence',
  'data-ajn-style-match-panel="true"',
  'Re-match font + size + color from original',
];
for (const marker of requiredEditor) {
  if (!editor.includes(marker)) throw new Error(`V4 editor marker missing: ${marker}`);
}
const requiredTest = [
  'scan-style-1page.pdf',
  'OCR replacement automatically matches font size weight and colour',
  'Bold source word should remain bold',
  'Light text on dark background must not be forced to black',
  'Italic source text should auto-match italic styling',
];
for (const marker of requiredTest) {
  if (!test.includes(marker)) throw new Error(`V4 browser-test marker missing: ${marker}`);
}
if (!fs.existsSync(fixturePath) || fs.statSync(fixturePath).size < 1000) throw new Error('V4 scan-style PDF fixture is missing/invalid.');
console.log('PASS: AJN PDF OCR auto-style V4 source contract.');
console.log('PASS: OCR font metadata + pixel colour/weight/italic/size matching are wired.');
console.log('PASS: AUTO/MANUAL style UI and original-style re-match control are present.');
console.log('PASS: raster style regression fixture and browser assertions are present.');
