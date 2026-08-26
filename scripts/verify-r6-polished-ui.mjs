import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const ids = [
  'merge-pdf','split-pdf','compress-pdf','rotate-pdf','delete-pdf-pages','organize-pdf','crop-pdf','watermark-pdf','page-number','flatten-pdf','protect-pdf','unlock-pdf',
  'repair-pdf','compare-pdf','add-text','add-image-to-pdf','pdf-metadata','png-to-pdf','extract-images','image-reducer','image-resizer','crop-image','rotate-image','watermark-image',
  'flip-image','convert-image','meme-generator','photo-editor','sign-pdf','pdf-text','pdf-zip-extract','zip-extractor','subtitle-generator','image-to-pdf','jpg-to-pdf','jpeg-to-pdf',
  'webp-to-pdf','tiff-to-pdf','bmp-to-pdf','gif-to-pdf','svg-to-pdf','heic-to-pdf','pdf-to-image','pdf-to-jpg','pdf-to-jpeg','pdf-to-png','pdf-to-webp','pdf-to-tiff',
  'pdf-to-bmp','pdf-to-gif','pdf-to-svg','pdf-to-heic','pdf-pages-to-zip','pdf-to-word','pdf-to-docx','pdf-to-txt','pdf-to-rtf','pdf-to-odt','pdf-to-html','pdf-to-markdown',
  'pdf-to-xml','pdf-to-json','pdf-to-csv','pdf-to-excel','pdf-to-xlsx','pdf-to-powerpoint','pdf-to-pptx','pdf-to-epub','pdf-to-mobi','pdf-to-azw3','word-to-pdf','doc-to-pdf',
  'docx-to-pdf','txt-to-pdf','rtf-to-pdf','odt-to-pdf','ods-to-pdf','odp-to-pdf','html-to-pdf','url-to-pdf','markdown-to-pdf','xml-to-pdf','json-to-pdf','csv-to-pdf',
  'excel-to-pdf','xls-to-pdf','xlsx-to-pdf','powerpoint-to-pdf','ppt-to-pdf','pptx-to-pdf','epub-to-pdf','mobi-to-pdf','azw3-to-pdf','eml-to-pdf','msg-to-pdf'];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}
function file(relative, minBytes = 1) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) fail(`${relative} is missing.`);
  const size = fs.statSync(full).size;
  if (size < minBytes) fail(`${relative} is unexpectedly small (${size} bytes).`);
  return full;
}
function text(relative) {
  return fs.readFileSync(file(relative), 'utf8');
}

if (ids.length !== 107 || new Set(ids).size !== 107) fail('Expected exactly 107 unique tool ids.');

const approvedLogo = file('public/brand/ajn-logo.png', 10_000);
const approvedHash = crypto.createHash('sha256').update(fs.readFileSync(approvedLogo)).digest('hex');
if (approvedHash !== '2640832e7862de2b48c3001be79b2f3202f00ab16abca73702858f6f3a2eb386') fail('Approved AJN logo bytes changed.');
file('public/brand/ajn-logo-transparent.png', 10_000);

const iconsDir = path.join(root, 'public', 'tool-icons');
const icons = fs.readdirSync(iconsDir).filter((name) => name.endsWith('.webp'));
if (icons.length !== 107) fail(`Expected 107 tool artwork files, found ${icons.length}.`);
let totalBytes = 0;
for (const id of ids) {
  const full = file(`public/tool-icons/${id}.webp`, 3_000);
  const size = fs.statSync(full).size;
  totalBytes += size;
  if (size > 20_000) fail(`${id}.webp is too heavy for the compact card target (${size} bytes).`);
}
if (totalBytes > 1_300_000) fail(`Tool artwork total is too heavy (${totalBytes} bytes).`);

const artwork = text('src/components/ajn/tool-artwork.tsx');
for (const marker of ['/tool-icons/${toolId}.webp','/brand/ajn-logo-transparent.png','sizes="(max-width: 640px) 64px, 72px"','ajn-tool-corner-logo']) {
  if (!artwork.includes(marker)) fail(`ToolArtwork is missing ${marker}.`);
}

const grid = text('src/components/landing/services-grid.tsx');
for (const marker of ['ajn-horizontal-tool-card','h-12 w-16 sm:h-[54px] sm:w-[72px]','ajn-card-arrow','focus-visible:ring-2','md:grid-cols-2','xl:grid-cols-3']) {
  if (!grid.includes(marker)) fail(`services-grid.tsx is missing ${marker}.`);
}
if (grid.includes('framer-motion')) fail('Main 107-tool grid should not mount Framer Motion per card in R6.');
if (grid.includes('onPointerMove')) fail('Pointer-tracking card glow is still enabled.');

const themeProvider = text('src/components/theme/theme-provider.tsx');
if (!themeProvider.includes("root.classList.remove('dark')")) fail('ThemeProvider does not force light mode.');
if (!themeProvider.includes("theme: 'light'")) fail('ThemeProvider is not fixed to light mode.');
if (!themeProvider.includes('localStorage.removeItem')) fail('Stored dark-theme preference is not cleared.');


const layout = text('src/app/layout.tsx');
if (!layout.includes("classList.remove('dark')") || !layout.includes("dataset.theme='light'")) fail('First-paint theme bootstrap is not light-only.');
if (!layout.includes('/brand/ajn-logo-transparent.png')) fail('Structured brand logo does not use the transparent AJN asset.');
const manifest = text('public/manifest.json');
if (!manifest.includes('\"background_color\": \"#ffffff\"')) fail('PWA background is not light-only.');

const navbar = text('src/components/landing/navbar.tsx');
if (navbar.includes('ThemeToggle')) fail('Navbar still exposes a dark-mode toggle.');
const toolLayout = text('src/components/ajnpdf/tool-layout.tsx');
if (toolLayout.includes('ThemeToggle')) fail('Tool layout still exposes a dark-mode toggle.');

const logo = text('src/components/landing/logo-animation.tsx');
if (!logo.includes('/brand/ajn-logo-transparent.png')) fail('Header logo is not using the transparent-background asset.');
if (logo.includes('bg-white') || logo.includes('border-slate')) fail('Header logo still has a background plate or border.');

for (const [relative, marker] of [
  ['src/components/landing/category-directory.tsx','h-[54px] w-[72px]'],
  ['src/components/search-modal.tsx','h-12 w-16'],
  ['src/app/not-found.tsx','h-12 w-16'],
  ['src/components/junction/_shared.tsx','h-[54px] w-[72px]']]) {
  if (!text(relative).includes(marker)) fail(`${relative} does not use the reduced artwork size.`);
}

const css = text('src/app/globals.css');
for (const marker of ['AJN PDF R6 — polished light-only UI','border-radius: 16px','min-height: 82px','.ajn-tool-corner-logo','.ajn-tool-artwork::before','.ajn-polished-glow']) {
  if (!css.includes(marker)) fail(`globals.css is missing ${marker}.`);
}

console.log('AJN PDF R6 POLISHED LIGHT UI: PASS');
console.log('- 107/107 tool artwork files present');
console.log(`- optimized tool artwork total: ${(totalBytes / 1024).toFixed(1)} KiB`);
console.log('- compact 64/72px horizontal-card artwork wired');
console.log('- old white tool-logo plate hidden; transparent AJN mark overlaid');
console.log('- website AJN logo uses transparent background');
console.log('- public dark-mode controls removed and light mode forced');
console.log('- main tool grid no longer mounts per-card Framer Motion/pointer tracking');
console.log('- search/category/tool workspace icon sizes reduced');
