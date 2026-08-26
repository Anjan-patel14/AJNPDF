import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
const pass = (message) => console.log(`PASS: ${message}`);
const countPng = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => n.toLowerCase().endsWith('.png')).length : -1;

const iconRoot = path.join(root, 'public', 'assets', 'conversion-icons');
const live = path.join(iconRoot, 'live');
const catalog = path.join(iconRoot, 'catalog');
const sheets = path.join(iconRoot, 'sheets');
const toolArtwork = path.join(root, 'src', 'components', 'ajn', 'tool-artwork.tsx');
const mappingFile = path.join(root, 'src', 'lib', 'conversion-icon-assets.ts');

if (!fs.existsSync(iconRoot)) fail('conversion icon asset root exists'); else pass('conversion icon asset root exists');
const liveCount = countPng(live);
const catalogCount = countPng(catalog);
const sheetCount = countPng(sheets);
if (liveCount !== 74) fail(`expected 74 live conversion icons, found ${liveCount}`); else pass('74 live conversion icons present');
if (catalogCount !== 75) fail(`expected 75 catalog icons, found ${catalogCount}`); else pass('75 catalog icons present');
if (sheetCount !== 5) fail(`expected 5 source sheets, found ${sheetCount}`); else pass('5 source icon sheets present');

if (!fs.existsSync(toolArtwork)) fail('ToolArtwork source exists');
else {
  const text = fs.readFileSync(toolArtwork, 'utf8');
  if (!text.includes('priority = false')) fail('ToolArtwork destructures priority with a safe default');
  else pass('ToolArtwork priority prop is safely destructured');
  if (!text.includes('CONVERSION_ICON_ASSETS[toolId]')) fail('ToolArtwork uses conversion asset mapping');
  else pass('ToolArtwork uses conversion asset mapping');
}

if (!fs.existsSync(mappingFile)) fail('conversion icon mapping source exists');
else {
  const text = fs.readFileSync(mappingFile, 'utf8');
  const refs = [...text.matchAll(/\/assets\/conversion-icons\/live\/([^'\"]+\.png)/g)].map((m) => m[1]);
  const unique = new Set(refs);
  if (unique.size !== 74) fail(`expected 74 unique live mappings, found ${unique.size}`); else pass('74 unique conversion mappings registered');
  const missing = [...unique].filter((name) => !fs.existsSync(path.join(live, name)));
  if (missing.length) fail(`mapped icon files missing: ${missing.join(', ')}`); else pass('every mapped conversion icon exists on disk');
}

if (!process.exitCode) console.log('AJN PDF R10.7.1 conversion icon asset verification completed successfully.');
