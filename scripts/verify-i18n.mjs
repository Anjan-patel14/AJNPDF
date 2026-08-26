import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const localeDir = path.join(root, 'src', 'i18n', 'locales');
const expected = ['en', 'hi', 'te', 'ta', 'kn'];
const fail = [];
const pass = (msg) => console.log(`PASS: ${msg}`);

const flatten = (obj, prefix = '', out = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, next, out);
    else out[next] = value;
  }
  return out;
};

const files = fs.readdirSync(localeDir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort();
if (JSON.stringify(files) !== JSON.stringify([...expected].sort())) fail.push(`locale set is ${files.join(', ')}, expected ${expected.join(', ')}`);
else pass('exact language set is English, Hindi, Telugu, Tamil and Kannada');

const dictionaries = new Map();
for (const code of expected) {
  const p = path.join(localeDir, `${code}.json`);
  if (!fs.existsSync(p)) { fail.push(`${code}.json is missing`); continue; }
  const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
  const flat = flatten(parsed);
  dictionaries.set(code, flat);
  const empty = Object.entries(flat).filter(([key,v]) => key !== 'home.title2' && (typeof v !== 'string' || !String(v).trim()));
  if (empty.length) fail.push(`${code}.json contains ${empty.length} empty/non-string values`);
}

const baseline = dictionaries.get('en') ?? {};
const baseKeys = Object.keys(baseline).sort();
if (baseKeys.length < 250) fail.push(`English dictionary is unexpectedly small (${baseKeys.length} keys)`);
else pass(`${baseKeys.length} shared UI translation keys are registered`);

for (const code of expected.slice(1)) {
  const keys = Object.keys(dictionaries.get(code) ?? {}).sort();
  const missing = baseKeys.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !baseKeys.includes(k));
  if (missing.length || extra.length) fail.push(`${code} key mismatch: ${missing.length} missing, ${extra.length} extra`);
  else pass(`${code} has the same translation-key structure as English`);
}

const context = fs.readFileSync(path.join(root, 'src/lib/i18n/language-context.tsx'), 'utf8');
const translationSource = fs.readFileSync(path.join(root, 'src/lib/i18n/translations.ts'), 'utf8');
const switcher = fs.readFileSync(path.join(root, 'src/components/i18n/language-switcher.tsx'), 'utf8');
const toolTranslations = fs.readFileSync(path.join(root, 'src/lib/i18n/tool-translations.ts'), 'utf8');
const layout = fs.readFileSync(path.join(root, 'src/app/layout.tsx'), 'utf8');

for (const token of ["'en'", "'hi'", "'te'", "'ta'", "'kn'"]) { if (!translationSource.includes(token)) fail.push(`translation registry missing ${token}`); }
for (const token of ['ajn-language', 'setLanguage', 'translateKey']) { if (!context.includes(token)) fail.push(`language context missing ${token}`); }
if (!switcher.includes('LanguageSwitcher')) fail.push('LanguageSwitcher component is missing');
if (!layout.includes('LanguageProvider')) fail.push('root layout does not mount LanguageProvider');
if (!layout.includes('LiveTranslationBridge')) fail.push('root layout does not mount the compatibility translation bridge');
if (/\b(bn|es)\b/.test(context)) fail.push('unsupported Bengali/Spanish language codes remain in the active language context');
if (/files are never sent to a server|everything (runs|works) in your browser/i.test(toolTranslations)) fail.push('stale universal browser-only privacy claim remains in tool translations');
else pass('tool translation copy avoids stale universal browser-only claims');

const forbidden = [
  'Synthesis', 'Calibration', 'Finalize Synthesis', 'Executing Inject', 'Buffer Authentication',
  'Verified Buffer', 'Purge Cache', 'Flush All', 'Drop PDF to Prune', 'Local Metadata Buffer',
  'In-Memory Parsing Active', 'Document Re-engineered', 'Asset Exported'
];
const componentRoot = path.join(root, 'src', 'components');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
const uiFiles = walk(componentRoot).filter((f) => /\.(tsx|ts|jsx|js)$/.test(f));
for (const file of uiFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const phrase of forbidden) if (text.includes(phrase)) fail.push(`${path.relative(root,file)} still contains user-facing jargon: ${phrase}`);
}
if (!fail.some((x) => x.includes('jargon'))) pass('known legacy developer-language phrases are removed from UI source');

if (fail.length) {
  console.error('FAIL: i18n verification failed:');
  for (const item of [...new Set(fail)]) console.error(`- ${item}`);
  process.exit(1);
}
console.log('AJN PDF five-language i18n verification completed successfully.');
