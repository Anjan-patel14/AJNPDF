import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
let issues = 0;
const pass = (message) => console.log(`PASS: ${message}`);
const fail = (message) => { issues += 1; console.error(`FAIL: ${message}`); };

const analytics = read('src/app/admin/analytics/page.tsx');
if (/icon:\s*Icon\s*=\s*Activity/.test(analytics) && /icon\?:\s*typeof\s+Activity/.test(analytics)) {
  pass('MetricCard provides a typed Activity fallback when callers omit icon');
} else {
  fail('MetricCard icon prop is still required or lacks a safe default');
}

const crop = read('src/components/junction/CropPdf.tsx');
if (/const\s+outputBuffer\s*=\s*new\s+ArrayBuffer\(bytes\.byteLength\)/.test(crop)
    && /new\s+Uint8Array\(outputBuffer\)\.set\(bytes\)/.test(crop)
    && /new\s+Blob\(\[outputBuffer\]/.test(crop)) {
  pass('Crop PDF converts pdf-lib bytes to an ArrayBuffer-backed BlobPart');
} else {
  fail('Crop PDF still passes a generic ArrayBufferLike Uint8Array directly to Blob');
}

const imageToPdf = read('src/components/junction/ImageToPdfTool.tsx');
if (/badge\?:\s*string/.test(imageToPdf)) {
  pass('ImageToPdfTool badge compatibility prop is optional for JPG/PNG callers');
} else {
  fail('ImageToPdfTool still requires the unused badge prop');
}

for (const relative of ['src/components/junction/JpgToPdf.tsx', 'src/components/junction/PngToPdf.tsx']) {
  const source = read(relative);
  if (/<ImageToPdfTool\b/.test(source)) pass(`${relative} continues to use the shared ImageToPdfTool`);
  else fail(`${relative} no longer uses the shared ImageToPdfTool`);
}

if (issues) {
  console.error(`AJN PDF R10.5 TYPESCRIPT HOTFIX verification failed with ${issues} issue(s).`);
  process.exit(1);
}
console.log('AJN PDF R10.5 TYPESCRIPT GATE HOTFIX SOURCE AUDIT: PASS');
