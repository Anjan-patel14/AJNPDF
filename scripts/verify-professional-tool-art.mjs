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
function requireFile(relative, minBytes = 1) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) fail(`${relative} is missing.`);
  const size = fs.statSync(full).size;
  if (size < minBytes) fail(`${relative} is unexpectedly small (${size} bytes).`);
  return full;
}
function text(relative) {
  return fs.readFileSync(requireFile(relative), 'utf8');
}

if (ids.length !== 107 || new Set(ids).size !== 107) fail('Expected exactly 107 unique tool artwork ids.');
const exactLogo = requireFile('public/brand/ajn-logo.png', 10_000);
const logoHash = crypto.createHash('sha256').update(fs.readFileSync(exactLogo)).digest('hex');
if (logoHash !== '2640832e7862de2b48c3001be79b2f3202f00ab16abca73702858f6f3a2eb386') fail('AJN logo bytes changed from the user-approved logo.');
requireFile('public/favicon.ico', 1_000);
requireFile('public/favicon-192.png', 1_000);
requireFile('public/favicon-512.png', 1_000);

const artworkDir = path.join(root, 'public', 'tool-icons');
if (!fs.existsSync(artworkDir)) fail('public/tool-icons is missing.');
const webpFiles = fs.readdirSync(artworkDir).filter((name) => name.endsWith('.webp'));
if (webpFiles.length !== 107) fail(`Expected 107 .webp tool artwork files, found ${webpFiles.length}.`);
for (const id of ids) requireFile(`public/tool-icons/${id}.webp`, 4_000);

const artwork = text('src/components/ajn/tool-artwork.tsx');
if (!artwork.includes('/tool-icons/${toolId}.webp')) fail('ToolArtwork is not using canonical tool-id artwork paths.');
if (!artwork.includes('next/image')) fail('ToolArtwork must use Next Image for lazy/optimized loading.');

const grid = text('src/components/landing/services-grid.tsx');
for (const marker of ['ToolArtwork', 'ajn-horizontal-tool-card', 'ajn-card-brand-badge', 'md:grid-cols-2', 'xl:grid-cols-3']) {
  if (!grid.includes(marker)) fail(`services-grid.tsx is missing ${marker}.`);
}
if (grid.includes('<tool.icon')) fail('Main tool grid still renders the old generic Lucide tool icon.');

for (const relative of [
  'src/components/landing/category-directory.tsx',
  'src/components/search-modal.tsx',
  'src/components/junction/_shared.tsx',
  'src/components/junction/tool-editorial-content.tsx',
  'src/app/not-found.tsx']) {
  if (!text(relative).includes('ToolArtwork')) fail(`${relative} is not wired to branded tool artwork.`);
}

const logo = text('src/components/landing/logo-animation.tsx');
if (!logo.includes('/brand/ajn-logo.png')) fail('Website logo does not use the exact AJN logo asset.');
if (logo.includes('<svg')) fail('Legacy generated SVG logo is still present in LogoAnimation.');

const css = text('src/app/globals.css');
for (const marker of ['AJN PDF R5', '.ajn-horizontal-tool-card', '.ajn-tool-artwork', '.ajn-card-brand-badge', 'prefers-reduced-motion']) {
  if (!css.includes(marker)) fail(`globals.css is missing ${marker}.`);
}

console.log('AJN PDF PROFESSIONAL TOOL ART + HORIZONTAL CARDS: PASS');
console.log('- 107 unique branded tool artwork assets present');
console.log('- exact AJN website logo asset wired');
console.log('- compact horizontal tool cards wired');
console.log('- search/category/related/tool workspace artwork wired');
console.log('- lazy optimized imagery and reduced-motion support present');
