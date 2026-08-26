import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const check = (label, condition) => condition ? console.log(`PASS: ${label}`) : failures.push(label);

const policy = read('src/lib/tool-policy.ts');
const seo = read('src/lib/seo-strategy.ts');
const layout = read('src/app/layout.tsx');
const sitemap = read('src/app/sitemap.ts');
const homepage = read('src/app/page.tsx');
const hero = read('src/components/landing/hero.tsx');
const allTools = read('src/components/landing/all-tools-menu.tsx');
const navbar = read('src/components/landing/navbar.tsx');
const next = read('next.config.ts');

const allowlist = policy.match(/PRODUCTION_PUBLIC_TOOL_IDS = new Set\(\[([\s\S]*?)\]\);/)?.[1] || '';
const publicIds = [...allowlist.matchAll(/'([^']+)'/g)].map((match) => match[1]);
const movedImageIds = ['image-reducer','image-resizer','crop-image','rotate-image','watermark-image','flip-image','convert-image'];

check('focused production catalog contains exactly 20 unique PDF tools', publicIds.length === 20 && new Set(publicIds).size === 20);
check('standalone image utilities are not public AJN PDF routes', !movedImageIds.some((id) => publicIds.includes(id)));
check('SEO recognition markers contain no empty marker', !/RECOGNITION_MARKERS\s*=\s*\[\s*['"]['"]/.test(seo));
check('SEO title logic contains no always-true empty includes check', !/\.includes\(\s*['"]['"]\s*\)/.test(seo));
check('global metadata contains no stale tool-count marketing', !/(27\s+focused|90\+|100\+|107\s+tools)/i.test(layout));
check('global schema describes the PDF-only product', layout.includes('Merge PDF') && layout.includes('Protect PDF') && layout.includes('Repair PDF') && !layout.includes("'Image tools'"));
check('simple hero uses Free Online PDF Tools positioning', hero.includes('Free Online') && hero.includes('PDF Tools') && !/27\s+focused|No account required|Workspace preview|Report\.pdf/i.test(hero));
check('retired conversion and image directories are absent from sitemap', !sitemap.includes("path: '/conversion-tools'") && !sitemap.includes("path: '/image-tools'"));
check('homepage exposes no conversion or image category filter', !homepage.includes("id: 'conversion'") && !homepage.includes("id: 'image'"));
check('desktop navigation exposes no old image directory or converter menu', !navbar.includes('/image-tools') && !navbar.includes('/conversion-tools') && !navbar.includes('ConvertMenu'));
check('All Tools search suggestions stay PDF-only', !/Word to PDF|PDF to Word|scan text|image to text|crop or image|Image Tools/i.test(allTools));
check('moved image routes redirect to AJN IMG handoff', next.includes('imageToolRedirects') && next.includes("destination: '/img'"));

if (failures.length) {
  console.error('AJN PDF R21 FOCUSED SEO: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('AJN PDF R21 FOCUSED SEO: PASS');
