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

function fail(message) { console.error(`FAIL: ${message}`); process.exit(1); }
function file(relative, minBytes = 1) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) fail(`${relative} is missing.`);
  const size = fs.statSync(full).size;
  if (size < minBytes) fail(`${relative} is unexpectedly small (${size} bytes).`);
  return full;
}
function text(relative) { return fs.readFileSync(file(relative), 'utf8'); }
function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full)); else out.push(full);
  }
  return out;
}

if (ids.length !== 107 || new Set(ids).size !== 107) fail('Expected exactly 107 unique production tool ids.');

const approvedLogo = file('public/brand/ajn-logo.png', 10_000);
const approvedHash = crypto.createHash('sha256').update(fs.readFileSync(approvedLogo)).digest('hex');
if (approvedHash !== '2640832e7862de2b48c3001be79b2f3202f00ab16abca73702858f6f3a2eb386') fail('Approved AJN logo bytes changed.');
file('public/brand/ajn-logo-transparent.png', 10_000);

const iconsDir = path.join(root, 'public', 'tool-icons');
if (!fs.existsSync(iconsDir)) fail('public/tool-icons must exist so the updater can mirror-delete old raster artwork.');
const legacyRaster = fs.readdirSync(iconsDir).filter((name) => /\.(webp|png|jpe?g)$/i.test(name));
if (legacyRaster.length) fail(`Legacy tool raster artwork remains: ${legacyRaster.slice(0, 5).join(', ')}`);

const artwork = text('src/components/ajn/tool-artwork.tsx');
for (const marker of ['AJN PDF R7 simple icon system','specialIcons','getConversion','ajn-format-tile','data-tool-icon={toolId}','toneClasses']) {
  if (!artwork.includes(marker)) fail(`ToolArtwork is missing ${marker}.`);
}
for (const forbidden of ['next/image','/tool-icons/','ajn-tool-corner-logo','/brand/ajn-logo-transparent.png']) {
  if (artwork.includes(forbidden)) fail(`ToolArtwork still contains legacy artwork behavior: ${forbidden}.`);
}
const specialEntries = [...artwork.matchAll(/\n\s*'([^']+)':\s*([A-Za-z0-9_]+),/g)].filter((match) => ids.includes(match[1]));
const specialIds = new Set(specialEntries.map((match) => match[1]));
const specialGlyphs = specialEntries.map((match) => match[2]);
if (specialIds.size !== 34) fail(`Expected 34 dedicated action glyphs, found ${specialIds.size}.`);
if (new Set(specialGlyphs).size !== specialGlyphs.length) fail('Dedicated action tools reuse an identical Lucide glyph.');
for (const id of ids) {
  if (specialIds.has(id)) continue;
  if (id.includes('-to-') || id === 'pdf-pages-to-zip') continue;
  fail(`Tool icon coverage is incomplete for ${id}.`);
}

const labelBlock = artwork.match(/const formatLabels:[\s\S]*?= \{([\s\S]*?)\n\};/);
if (!labelBlock) fail('Could not inspect R7 format label map.');
const labelEntries = [...labelBlock[1].matchAll(/(?:^|\n)\s*(?:'([^']+)'|([A-Za-z0-9_-]+)):\s*'([^']+)'/g)];
const labels = new Map(labelEntries.map((match) => [match[1] ?? match[2], match[3]]));
const labelFor = (part) => labels.get(part) ?? part.replaceAll('-', ' ').slice(0, 5).toUpperCase();
const conversionPairs = new Map();
for (const id of ids) {
  if (specialIds.has(id)) continue;
  let pair;
  if (id === 'pdf-pages-to-zip') pair = 'PDF→ZIP';
  else {
    const [from, to] = id.split('-to-', 2);
    pair = `${labelFor(from)}→${labelFor(to)}`;
  }
  if (conversionPairs.has(pair)) fail(`Repeated conversion icon pair ${pair}: ${conversionPairs.get(pair)} and ${id}.`);
  conversionPairs.set(pair, id);
}
if (conversionPairs.size !== 73) fail(`Expected 73 unique conversion icon pairs, found ${conversionPairs.size}.`);

const sourceFiles = walk(path.join(root, 'src')).filter((name) => /\.(tsx?|css|json)$/.test(name));
for (const source of sourceFiles) {
  const body = fs.readFileSync(source, 'utf8');
  if (body.includes('/tool-icons/')) fail(`Legacy /tool-icons/ raster reference remains in ${path.relative(root, source)}.`);
}

const grid = text('src/components/landing/services-grid.tsx');
for (const marker of ['ajn-horizontal-tool-card','h-12 w-12 sm:h-[52px] sm:w-[52px]','min-h-[78px]','ChevronRight','focus-visible:ring-2','md:grid-cols-2','xl:grid-cols-3']) {
  if (!grid.includes(marker)) fail(`services-grid.tsx is missing ${marker}.`);
}
if (grid.includes('ajn-card-brand-badge">AJN')) fail('Repeated AJN badge still appears on every tool card.');
if (grid.includes('framer-motion') || grid.includes('onPointerMove')) fail('The 107-tool grid still mounts unnecessary per-card animation logic.');

const en = JSON.parse(text('src/i18n/locales/en.json'));
if (en['home.kicker'] !== 'Smart • Fast • Effortless') fail('Homepage kicker is not the approved Smart • Fast • Effortless copy.');
if (en['home.title1'] !== 'Powerful PDF Tools.') fail('Homepage hero title line 1 is incorrect.');
if (en['home.title2'] !== 'Fast, clear file workflows.') fail('Homepage hero title line 2 is incorrect.');
if (en['home.subtitle'] !== 'Convert, organize, edit, protect, sign and process your files with professional tools designed for speed and simplicity.') fail('Homepage hero subtitle is incorrect.');

const hero = text('src/components/landing/hero.tsx');
for (const marker of ["valueWords = t('home.kicker').split('•')",'ajn-workflow-panel','UploadCloud','WandSparkles','FileCheck2','Download']) {
  if (!hero.includes(marker)) fail(`Desktop hero is missing ${marker}.`);
}
if (hero.includes('ajn-product-visual.svg')) fail('Old heavy promotional hero visual is still mounted.');

const mobileHero = text('src/components/landing/mobile-home-hero.tsx');
for (const marker of ["valueWords = t('home.kicker').split('•')",'home.title1','home.title2','home.subtitle']) {
  if (!mobileHero.includes(marker)) fail(`Mobile hero is missing ${marker}.`);
}

const themeProvider = text('src/components/theme/theme-provider.tsx');
if (!themeProvider.includes("root.classList.remove('dark')") || !themeProvider.includes("theme: 'light'")) fail('ThemeProvider is not fixed to light mode.');
const navbar = text('src/components/landing/navbar.tsx');
if (navbar.includes('ThemeToggle')) fail('Navbar still exposes a theme toggle.');
const toolLayout = text('src/components/ajnpdf/tool-layout.tsx');
if (toolLayout.includes('ThemeToggle')) fail('Tool layout still exposes a theme toggle.');

const logo = text('src/components/landing/logo-animation.tsx');
if (!logo.includes('/brand/ajn-logo-transparent.png')) fail('Header logo does not use transparent AJN artwork.');
if (logo.includes('bg-white') || logo.includes('border-slate')) fail('Header logo still has a background plate or border.');

for (const [relative, marker] of [
  ['src/components/landing/category-directory.tsx','h-12 w-12'],
  ['src/components/search-modal.tsx','h-11 w-11'],
  ['src/app/not-found.tsx','h-11 w-11'],
  ['src/components/junction/_shared.tsx','h-[52px] w-[52px]'],
  ['src/components/junction/tool-editorial-content.tsx','h-10 w-10']]) {
  if (!text(relative).includes(marker)) fail(`${relative} does not use the R7 compact square icon size.`);
}

const css = text('src/app/globals.css');
for (const marker of ['AJN PDF R7 — SIMPLE PROFESSIONAL VECTOR ICON SYSTEM','min-height: 78px','.ajn-format-tile','.ajn-hero-value-chip','.ajn-mobile-value-chip','.ajn-workflow-panel']) {
  if (!css.includes(marker)) fail(`globals.css is missing ${marker}.`);
}

console.log('AJN PDF R7 SIMPLE PROFESSIONAL UI: PASS');
console.log('- 107/107 production tools covered by the new vector icon system');
console.log('- 34 dedicated action glyphs are unique; conversions use unique source→target format pairs');
console.log('- legacy 107 raster card artworks removed from production assets');
console.log('- repeated per-card AJN logo badge removed');
console.log('- compact 48/52px square icon wells wired across tool surfaces');
console.log('- Smart • Fast • Effortless hero and polished workflow panel wired');
console.log('- approved transparent AJN website logo preserved');
console.log('- public dark mode remains removed and light mode remains forced');
