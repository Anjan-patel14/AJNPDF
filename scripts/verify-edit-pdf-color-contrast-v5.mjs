import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const editorPath = path.join(root, 'src', 'components', 'junction', 'PdfEditorLab.tsx');
const testPath = path.join(root, 'tests', 'editor.browser.mjs');
const editor = fs.readFileSync(editorPath, 'utf8');
const browser = fs.readFileSync(testPath, 'utf8');

const checks = [
  ['local in-box background clustering', editor.includes('localBackgroundBuckets') && editor.includes('localCoverage >= 0.24')],
  ['outer-ring fallback retained', editor.includes('ringBuckets') && editor.includes('bestBucket')],
  ['foreground scoring prioritizes real contrast', editor.includes('averageDistance * Math.sqrt')],
  ['dark-background light-text polarity guard', editor.includes('bgLum < 105') && editor.includes('lightCluster')],
  ['light-background dark-text polarity guard', editor.includes('bgLum > 190') && editor.includes('darkCluster')],
  ['sampled colour still drives OCR replacement', editor.includes('color: sampled.color')],
  ['sampled background still drives source cover', editor.includes('fill: sampled.background')],
  ['white-on-dark browser regression assertion', browser.includes('Light text on dark background must not be forced to black')],
  ['blue colour browser assertion', browser.includes('Blue source colour should remain blue-ish')],
  ['red italic browser assertion', browser.includes('Red italic source colour should remain red-ish')],
];
let failed = 0;
for (const [label, ok] of checks) {
  if (ok) console.log(`PASS: ${label}`);
  else { console.error(`FAIL: ${label}`); failed += 1; }
}
if (failed) process.exit(1);
console.log('PASS: AJN PDF OCR color/contrast V5 source contract.');
