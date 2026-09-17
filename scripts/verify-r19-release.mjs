import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'reports/AJN_PUBLIC_RELEASE_INVENTORY.json');
if (!fs.existsSync(file)) {
  console.error('FAIL: Run generate-r19-release-inventory.mjs first.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const routes = data.publicRoutes || [];
const canonical = data.canonicalTools || [];
const aliases = data.publicWorkspaceAliases || [];

const duplicates = (items) => {
  const ids = items.map((item) => item.id);
  return ids.filter((id, index) => ids.indexOf(id) !== index);
};
const routeDup = duplicates(routes);
const canonicalDup = duplicates(canonical);
if (routeDup.length || canonicalDup.length) {
  console.error('FAIL: duplicate release IDs', { routeDup, canonicalDup });
  process.exit(1);
}

if (routes.length !== 34) {
  console.error(`FAIL: expected exactly 34 validated public PDF routes; got ${routes.length}.`);
  process.exit(1);
}
if (canonical.length !== 34) {
  console.error(`FAIL: expected exactly 34 canonical public PDF processors; got ${canonical.length}.`);
  process.exit(1);
}
if (aliases.length !== 0) {
  console.error(`FAIL: expected no public workspace aliases in the validated baseline; got ${aliases.length}.`);
  process.exit(1);
}
if (routes.length !== canonical.length + aliases.length) {
  console.error('FAIL: route/canonical/alias accounting mismatch.');
  process.exit(1);
}
if (data.publicRouteCount !== routes.length || data.canonicalProcessorCount !== canonical.length) {
  console.error('FAIL: generated count fields do not match inventory arrays.');
  process.exit(1);
}

const required = [
  'edit-pdf','merge-pdf','split-pdf','compress-pdf','rotate-pdf','delete-pdf-pages','organize-pdf','crop-pdf','watermark-pdf',
  'page-number','flatten-pdf','protect-pdf','unlock-pdf','repair-pdf','compare-pdf','add-text','add-image-to-pdf',
  'pdf-metadata','extract-images','sign-pdf','pdf-zip-extract','image-to-pdf','jpeg-to-pdf','jpg-to-pdf','png-to-pdf','webp-to-pdf',
  'heic-to-pdf','pdf-to-jpg','pdf-to-png','txt-to-pdf','html-to-pdf','markdown-to-pdf','json-to-pdf','xml-to-pdf',
];
const movedImageIds = ['image-reducer','image-resizer','crop-image','rotate-image','watermark-image','flip-image','convert-image'];
const actual = new Set(routes.map((item) => item.id));
for (const id of required) {
  if (!actual.has(id)) {
    console.error(`FAIL: validated PDF baseline is missing ${id}.`);
    process.exit(1);
  }
}
for (const id of movedImageIds) {
  if (actual.has(id)) {
    console.error(`FAIL: ${id} must not be public in the focused AJN PDF product.`);
    process.exit(1);
  }
}

console.log(`PASS: release inventory — ${routes.length} PDF routes, ${canonical.length} canonical processors, ${aliases.length} aliases.`);
console.log('PASS: standalone image editing utilities and unaccepted server conversions remain outside AJN PDF public release accounting.');
