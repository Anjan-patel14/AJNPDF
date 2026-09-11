import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const legacySource = path.join(root, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs');
const source = legacySource;
const publicDir = path.join(root, 'public');
const destination = path.join(publicDir, 'pdf.worker.min.mjs');

if (!fs.existsSync(source)) {
  console.error(`FAIL: pinned PDF.js worker is missing: ${legacySource}`);
  process.exit(1);
}

fs.mkdirSync(publicDir, { recursive: true });
fs.copyFileSync(source, destination);
const bytes = fs.statSync(destination).size;
if (bytes < 100000) {
  console.error(`FAIL: generated PDF.js worker is unexpectedly small: ${bytes} bytes`);
  process.exit(1);
}
console.log(`PASS: same-origin PDF.js compatibility worker synced (${bytes} bytes).`);

for (const name of ['cmaps', 'standard_fonts']) {
  fs.cpSync(path.join(root, 'node_modules', 'pdfjs-dist', name), path.join(publicDir, 'pdfjs', name), { recursive: true });
}
