import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const publicDir = path.join(root, 'public');
const destination = path.join(publicDir, 'pdf.worker.min.mjs');

if (!fs.existsSync(source)) {
  console.error(`FAIL: pinned PDF.js worker is missing: ${source}`);
  process.exit(1);
}

fs.mkdirSync(publicDir, { recursive: true });
fs.copyFileSync(source, destination);

const bytes = fs.statSync(destination).size;
if (bytes < 100000) {
  console.error(`FAIL: generated PDF.js worker is unexpectedly small: ${bytes} bytes`);
  process.exit(1);
}

console.log(`PASS: same-origin PDF.js worker synced (${bytes} bytes).`);
