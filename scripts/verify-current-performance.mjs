import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const failures = [];
const check = (label, ok) => ok ? console.log(`PASS: ${label}`) : failures.push(label);

const next = read('next.config.ts');
const workspace = read('src/components/junction/tool-workspace-client.tsx');
const worker = read('src/lib/pdfjs-worker.ts');
const workerSync = read('scripts/sync-pdfjs-worker.mjs');
const layout = read('src/app/layout.tsx');
const css = read('src/app/globals.css');
const ambient = read('src/app/ambient-light.css');
const packageJson = JSON.parse(read('package.json'));
const ids = JSON.parse(read('scripts/r13-public-tool-ids.json'));

check('Next.js compression is enabled', /compress:\s*true/.test(next));
check('standalone production output is enabled', /output:\s*['"]standalone['"]/.test(next));
check('production CSP keeps PDF workers same-origin/blob only', next.includes("worker-src 'self' blob:"));
check('PDF.js worker uses the same-origin public path', worker.includes("const PDF_WORKER_SRC = '/pdf.worker.min.mjs'") && !/cdnjs|unpkg|jsdelivr/i.test(worker));
check('PDF.js worker is generated from the pinned local dependency', workerSync.includes("'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs'") && packageJson.dependencies?.['pdfjs-dist'] === '4.10.38');
check('heavy public tool workspaces are code-split', ids.filter((id) => id !== 'merge-pdf').every((id) => workspace.includes(`'${id}': dynamic(() => import(`)));
check('PDF editor is client-only and lazy-loaded', workspace.includes("'edit-pdf': dynamic(() => import('./PdfEditorLab'), { ssr: false })"));
check('root fonts use next/font rather than runtime CSS imports', layout.includes('from "next/font/google"') && !layout.includes('@import url('));
check('reduced-motion handling exists', css.includes('prefers-reduced-motion') || ambient.includes('prefers-reduced-motion'));
check('production background has forced-colors fallback', ambient.includes('forced-colors'));

if (failures.length) {
  console.error('AJN PDF CURRENT PERFORMANCE GUARD: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('AJN PDF CURRENT PERFORMANCE GUARD: PASS');
