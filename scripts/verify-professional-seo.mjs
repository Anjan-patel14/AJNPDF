import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const fail = (msg) => { console.error(`FAIL: ${msg}`); process.exitCode = 1; };
const pass = (msg) => console.log(`PASS: ${msg}`);

const publicToolIds = [
  'add-image-to-pdf','add-text','compare-pdf','compress-pdf','crop-pdf','delete-pdf-pages','edit-pdf','extract-images','flatten-pdf','image-to-pdf','jpeg-to-pdf','jpg-to-pdf','merge-pdf','organize-pdf','page-number','pdf-metadata','pdf-zip-extract','png-to-pdf','protect-pdf','repair-pdf','rotate-pdf','sign-pdf','split-pdf','unlock-pdf','watermark-pdf','webp-to-pdf',
];

const requiredFiles = [
  'src/app/layout.tsx',
  'src/lib/seo-strategy.ts',
  'src/app/trust/page.tsx',
  'src/app/changelog/page.tsx',
  'src/app/ajn-studio/page.tsx',
  'src/app/developer/page.tsx',
  'src/app/sitemap.ts',
  'src/app/robots.ts',
  'src/components/seo-related-tools.tsx',
  'src/components/landing/main-footer.tsx',
  'src/app/(tool-pages)/[id]/page.tsx',
];

for (const file of requiredFiles) {
  if (!exists(file)) fail(`missing ${file}`);
}
if (process.exitCode) process.exit(process.exitCode);
pass('professional SEO files exist');

const strategy = read('src/lib/seo-strategy.ts');
for (const id of publicToolIds) {
  const marker = `'${id}': {`;
  if (!strategy.includes(marker)) fail(`missing explicit SEO override for ${id}`);
}
if (!process.exitCode) pass('all 26 public tools have explicit SEO overrides');

const editTitle = 'Edit PDF Online Free - Change Text & Sign PDF | AJN PDF';
if (!strategy.includes(editTitle)) fail('Edit PDF priority title missing');
else pass('Edit PDF priority metadata present');

const editorContractDescription = 'Edit PDF online in your browser with AJN PDF. Replace text, dates, names and numbers';
if (!strategy.includes(editorContractDescription)) fail('Edit PDF legacy public-editor meta description contract missing');
else pass('Edit PDF legacy SEO contract compatibility present');

for (const id of ['protect-pdf','unlock-pdf','repair-pdf']) {
  const start = strategy.indexOf(`'${id}': {`);
  const end = strategy.indexOf('\n  },', start);
  const block = strategy.slice(start, end > start ? end : start + 700).toLowerCase();
  if (!block.includes('server-assisted')) fail(`${id} must be described as server-assisted`);
}
if (!process.exitCode) pass('server-assisted security tools are distinguished');

const trust = read('src/app/trust/page.tsx');
if (!trust.includes('23 browser-local public workflows')) fail('Trust Center must state 23 browser-local workflows');
if (!trust.includes('3 server-assisted public workflows')) fail('Trust Center must state 3 server-assisted workflows');
if (!trust.toLowerCase().includes('not secure redaction')) fail('Whiteout/redaction limitation missing');
if (!trust.toLowerCase().includes('best effort')) fail('font-matching limitation missing');
if (!process.exitCode) pass('Trust Center processing and editor limitations present');

const layout = read('src/app/layout.tsx');
const seoConfig = exists('src/lib/seo-config.ts') ? read('src/lib/seo-config.ts') : '';
if (seoConfig && !seoConfig.includes("SITE_URL = 'https://www.ajnpdf.com'")) fail('canonical www host missing');
if (!seoConfig && !layout.includes('SITE_URL')) fail('canonical SITE_URL integration missing');
if (!layout.includes('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION')) fail('Google verification env support missing');
if (!layout.includes('NEXT_PUBLIC_BING_SITE_VERIFICATION')) fail('Bing verification env support missing');
if (layout.includes('GOOGLE_VERIFICATION_CODE') || layout.includes('BING_VERIFICATION_CODE')) fail('verification placeholder found');
if (!process.exitCode) pass('canonical host and env-only verification setup present');

const sitemap = read('src/app/sitemap.ts');
for (const route of ['/trust','/changelog','/ajn-studio','/developer','/status']) {
  if (!sitemap.includes(`path:"${route}"`)) fail(`sitemap missing ${route}`);
}
const robots = read('src/app/robots.ts');
if (!robots.includes('/pdf-editor-lab')) fail('robots must disallow /pdf-editor-lab');
if (sitemap.includes('path:"/pdf-editor-lab"')) fail('lab route must not be in sitemap');
if (!process.exitCode) pass('sitemap/robots indexing policy is correct');

const toolPage = read('src/app/(tool-pages)/[id]/page.tsx');
if (!toolPage.includes('ToolSeoRelatedLinks')) fail('tool pages missing related-tool internal links');
if (!toolPage.includes("'WebApplication'")) fail('tool WebApplication schema missing');
if (!toolPage.includes("'BreadcrumbList'")) fail('tool BreadcrumbList schema missing');
if (!process.exitCode) pass('tool structured data and internal linking present');

const studio = read('src/app/ajn-studio/page.tsx');
const developer = read('src/app/developer/page.tsx');
if (!studio.includes("'@type': 'Organization'")) fail('AJN Studio Organization schema missing');
if (!developer.includes("'@type': 'Person'")) fail('developer Person schema missing');
if (!developer.includes('href="/ajn-studio"')) fail('developer AJN Studio link is not wired correctly');
if (developer.includes("'PDF tools', '',")) fail('empty knowsAbout value still present');
if (!process.exitCode) pass('AJN Studio and developer entity setup present');

const scanRoots = ['src/app','src/components','src/lib'];
const forbidden = ['GOOGLE_VERIFICATION_CODE','BING_VERIFICATION_CODE','aggregateRating'];
for (const scanRoot of scanRoots) {
  const abs = path.join(root, scanRoot);
  if (!fs.existsSync(abs)) continue;
  const stack = [abs];
  while (stack.length) {
    const item = stack.pop();
    for (const entry of fs.readdirSync(item, { withFileTypes: true })) {
      const full = path.join(item, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
        const text = fs.readFileSync(full, 'utf8');
        for (const needle of forbidden) if (text.includes(needle)) fail(`${needle} found in ${path.relative(root, full)}`);
      }
    }
  }
}
if (!process.exitCode) pass('no placeholder verification tokens or fake rating schema found');

const newSeoCopy = [strategy, trust, read('src/app/changelog/page.tsx')].join('\n').toLowerCase();
if (newSeoCopy.includes('files auto-delete after processing')) fail('blanket auto-delete claim found');
if (newSeoCopy.includes('100% local')) fail('unsupported 100% local claim found');
if (!process.exitCode) pass('processing claims remain scoped and truthful');

if (process.exitCode) {
  console.error('AJN PDF PROFESSIONAL SEO VERIFY: FAIL');
  process.exit(process.exitCode);
}
console.log('AJN PDF PROFESSIONAL SEO VERIFY: PASS');
