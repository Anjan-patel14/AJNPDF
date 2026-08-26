import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const failures = [];
const pass = (msg) => console.log(`PASS: ${msg}`);
const check = (ok, msg) => ok ? pass(msg) : failures.push(msg);

const analytics = read('src/app/admin/analytics/page.tsx');
const imageToPdf = read('src/components/junction/ImageToPdfTool.tsx');
const crop = read('src/components/junction/CropPdf.tsx');

check(analytics.includes("icon: Icon = Activity"), 'Analytics MetricCard has a safe default icon');
check(analytics.includes("icon?: typeof Activity"), 'Analytics MetricCard icon prop is optional for existing call sites');
const lucideImport = analytics.match(/import\s*\{([\s\S]*?)\}\s*from\s*['\"]lucide-react['\"]/m)?.[1] || '';
for (const name of ['BarChart3','Clock3','Database','Download','MousePointerClick','ImageIcon','Search','Sparkles']) {
  check(!new RegExp(`\\b${name}\\b`).test(lucideImport), `Unused analytics icon ${name} remains removed`);
}
check(!/\bbadge\s*:\s*string\s*;/.test(imageToPdf), 'Obsolete required ImageToPdfTool badge prop removed');
check(imageToPdf.includes('export default function ImageToPdfTool({ title, description, accept, extensions, accent }: Props)'), 'ImageToPdfTool destructuring matches active props');
check(crop.includes('const outputBuffer = new ArrayBuffer(bytes.byteLength);'), 'Crop PDF allocates a concrete ArrayBuffer for output');
check(crop.includes('new Uint8Array(outputBuffer).set(bytes);'), 'Crop PDF copies pdf-lib bytes into the concrete ArrayBuffer');
check(crop.includes('new Blob([outputBuffer]'), 'Crop PDF Blob uses ArrayBuffer-compatible data');
check(!crop.includes('new Blob([bytes]'), 'Crop PDF no longer passes ArrayBufferLike Uint8Array directly to Blob');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  console.error(`R9.5 TypeScript hotfix verification failed with ${failures.length} issue(s).`);
  process.exit(1);
}
console.log('AJN PDF R9.5 TYPESCRIPT HOTFIX SOURCE VERIFICATION: PASS');
