import fs from 'node:fs';
const read = (file) => fs.readFileSync(file, 'utf8');
const policy = read('src/lib/tool-policy.ts');
const workspace = read('src/components/junction/tool-workspace-client.tsx');
const inventory = JSON.parse(read('scripts/r13-public-tool-ids.json'));
const match = policy.match(/PRODUCTION_PUBLIC_TOOL_IDS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
const allowlist = [...(match?.[1] || '').matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]).sort();
const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
const pass = (message) => console.log(`PASS: ${message}`);
if (JSON.stringify([...inventory].sort()) === JSON.stringify(allowlist)) pass(`Public inventory and allowlist match (${inventory.length} tools)`); else fail('Public inventory and policy allowlist do not match');
for (const id of ['protect-pdf', 'unlock-pdf', 'repair-pdf']) {
  if (!allowlist.includes(id)) pass(`${id} is excluded from public tools`); else fail(`${id} must not be public`);
}
if (allowlist.includes('prompt-to-pdf') && workspace.includes("'prompt-to-pdf': dynamic(() => import('./PromptToPdf')")) pass('Prompt to PDF is public and has a real browser workspace'); else fail('Prompt to PDF route or component mapping is missing');
for (const id of ['pdf-to-txt','pdf-to-markdown','pdf-to-json','pdf-to-html']) { if (allowlist.includes(id) && workspace.includes(`'${id}': dynamic(() => import('./PdfTextExport')`)) pass(`${id} uses the browser-only text extraction component`); else fail(`${id} browser component mapping is missing`); }
const browserOnly = new Set(['edit-pdf','prompt-to-pdf','add-image-to-pdf','add-text','compare-pdf','compress-pdf','crop-pdf','delete-pdf-pages','extract-images','flatten-pdf','heic-to-pdf','html-to-pdf','image-to-pdf','jpeg-to-pdf','jpg-to-pdf','json-to-pdf','markdown-to-pdf','merge-pdf','organize-pdf','page-number','pdf-metadata','pdf-to-jpg','pdf-to-png','pdf-zip-extract','png-to-pdf','rotate-pdf','sign-pdf','split-pdf','txt-to-pdf','watermark-pdf','webp-to-pdf','xml-to-pdf','pdf-to-txt','pdf-to-markdown','pdf-to-json','pdf-to-html']);
const unknown = allowlist.filter((id) => !browserOnly.has(id));
if (!unknown.length) pass('Every public tool is on the approved browser-only list'); else fail(`Unreviewed public tools: ${unknown.join(', ')}`);
