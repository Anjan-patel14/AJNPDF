import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const failures = [];
const pass = (label) => console.log(`PASS: ${label}`);
const fail = (label) => failures.push(label);
const check = (label, condition) => condition ? pass(label) : fail(label);

const required = [
  'src/lib/seo-growth-guides.ts',
  'src/app/blog/[slug]/page.tsx',
  'src/components/seo-pillar-section.tsx',
  'src/components/landing/seo-pillar-links.tsx',
  'src/lib/seo-strategy.ts',
  'src/lib/internal-linking.ts',
  'src/app/(tool-pages)/[id]/page.tsx',
  'src/app/blog/page.tsx',
  'src/app/page.tsx',
  'src/app/sitemap.ts',
];

for (const file of required) check(`exists: ${file}`, exists(file));
if (failures.length) {
  failures.forEach((item) => console.error(`FAIL: ${item}`));
  process.exit(1);
}

const growth = read('src/lib/seo-growth-guides.ts');
const guideMatch = growth.match(/export const SEO_GROWTH_GUIDES: SeoGrowthGuide\[\] = ([\s\S]*?);\n\nexport function getSeoGrowthGuidesForTool/);
if (!guideMatch) {
  console.error('FAIL: could not parse SEO_GROWTH_GUIDES');
  process.exit(1);
}

let guides;
try {
  guides = JSON.parse(guideMatch[1]);
} catch (error) {
  console.error('FAIL: SEO_GROWTH_GUIDES is not JSON-compatible data', error);
  process.exit(1);
}

const pillars = ['edit-pdf', 'merge-pdf', 'compress-pdf', 'split-pdf'];
check('exactly 20 focused long-tail guides', guides.length === 20);
check('all guide slugs unique', new Set(guides.map((guide) => guide.slug)).size === guides.length);
check('all guide titles unique', new Set(guides.map((guide) => guide.title)).size === guides.length);
check('all metadata titles unique', new Set(guides.map((guide) => guide.metaTitle)).size === guides.length);
check('all guide summaries unique', new Set(guides.map((guide) => guide.summary)).size === guides.length);
check('all primary keywords unique', new Set(guides.map((guide) => guide.primaryKeyword)).size === guides.length);

for (const pillar of pillars) {
  check(`${pillar} has five supporting guides`, guides.filter((guide) => guide.pillar === pillar).length === 5);
}

const publicIds = new Set(JSON.parse(read('scripts/r13-public-tool-ids.json')));
for (const guide of guides) {
  const words = [
    guide.title,
    guide.summary,
    ...guide.sections.flatMap((section) => [
      section.title,
      ...section.paragraphs,
      ...(section.bullets || []),
      section.note || '',
    ]),
    ...guide.checklist,
  ].join(' ').trim().split(/\s+/).filter(Boolean).length;

  check(`${guide.slug}: canonical slug format`, /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(guide.slug));
  check(`${guide.slug}: targets a pillar tool`, pillars.includes(guide.pillar));
  check(`${guide.slug}: at least four unique sections`, guide.sections.length >= 4 && new Set(guide.sections.map((section) => section.title)).size === guide.sections.length);
  check(`${guide.slug}: at least 240 words of useful content`, words >= 240);
  check(`${guide.slug}: practical checklist present`, Array.isArray(guide.checklist) && guide.checklist.length >= 4);
  check(`${guide.slug}: at least three related public tools`, guide.related.length >= 3 && guide.related.every((id) => publicIds.has(id)));
  check(`${guide.slug}: primary tool is first related tool`, guide.related[0] === guide.pillar);
  check(`${guide.slug}: concise metadata title`, guide.metaTitle.length >= 20 && guide.metaTitle.length <= 52);
  check(`${guide.slug}: concise unique summary`, guide.summary.length >= 90 && guide.summary.length <= 180);
}

const lowerGrowth = growth.toLowerCase();
check('no OCR landing-page promotion added', !lowerGrowth.includes('ocr'));
check('no fake user-count claims added', !/\b(?:10k|30k|100k|1m|2m)\+?\s+(?:users|visits|people)\b/i.test(growth));
check('no blanket 100% local/security claims added', !lowerGrowth.includes('100% local') && !lowerGrowth.includes('100% secure'));
check('no doorway-style location/city pages added', !guides.some((guide) => /\bnear me\b|\bin [a-z]+ city\b/i.test(guide.title)));

const strategy = read('src/lib/seo-strategy.ts');
check('Merge PDF high-value title strengthened', strategy.includes('Merge PDF Online Free - Combine PDF Files | AJN PDF'));
check('Compress PDF high-value title strengthened', strategy.includes('Compress PDF Online Free - Reduce PDF File Size | AJN PDF'));
check('Edit PDF priority title preserved', strategy.includes('Edit PDF Online Free - Change Text & Sign PDF | AJN PDF'));
check('Split PDF high-value title strengthened', strategy.includes('Split PDF Online Free - Extract PDF Pages | AJN PDF'));
for (const keyword of [
  'merge pdf on android',
  'compress pdf for email',
  'edit pdf without software',
  'extract pages from pdf',
]) check(`pillar keyword present: ${keyword}`, strategy.includes(keyword));
check('Edit PDF legacy meta contract preserved', strategy.includes('Edit PDF online in your browser with AJN PDF. Replace text, dates, names and numbers'));

const toolPage = read('src/app/(tool-pages)/[id]/page.tsx');
check('pillar section wired into public tool pages', toolPage.includes('SeoPillarSection') && toolPage.includes('<SeoPillarSection toolId={tool.id} />'));
check('existing generic related links preserved', toolPage.includes('ToolSeoRelatedLinks'));

const pillarSection = read('src/components/seo-pillar-section.tsx');
check('pillar pages expose processing mode and Trust Center', pillarSection.includes('File-processing mode') && pillarSection.includes('href="/trust"'));
check('pillar pages link to focused guides', pillarSection.includes('getSeoGrowthGuidesForTool') && pillarSection.includes('/blog/${guide.slug}'));
check('guide links disable aggressive prefetch', pillarSection.includes('prefetch={false}'));

const homepage = read('src/app/page.tsx');
check('homepage links four core SEO pillars', homepage.includes('SeoPillarLinks') && homepage.includes('<SeoPillarLinks />'));
const homePillars = read('src/components/landing/seo-pillar-links.tsx');
for (const route of ['/edit-pdf', '/merge-pdf', '/compress-pdf', '/split-pdf']) {
  check(`homepage pillar link ${route}`, homePillars.includes(`href: '${route}'`));
}

const blog = read('src/app/blog/page.tsx');
check('blog hub exposes SEO growth guide data', blog.includes('SEO_GROWTH_GUIDES') && blog.includes('long-tail-pdf-guides'));
check('blog guide cards avoid auto-prefetch', blog.includes('href={`/blog/${guide.slug}`}') && blog.includes('prefetch={false}'));

const dynamicGuide = read('src/app/blog/[slug]/page.tsx');
check('long-tail guides are statically generated', dynamicGuide.includes('generateStaticParams') && dynamicGuide.includes('dynamicParams = false'));
check('long-tail guides use concise canonical metadata titles', dynamicGuide.includes('guideMetadata(guide.slug, guide.metaTitle, guide.summary)'));
check('long-tail guides use existing BlogPosting/Breadcrumb renderer', dynamicGuide.includes('<GuideArticle'));
check('no deprecated HowTo rich-result schema added', !dynamicGuide.includes("'HowTo'") && !dynamicGuide.includes('"HowTo"'));
check('no FAQPage rich-result schema added', !dynamicGuide.includes("'FAQPage'") && !dynamicGuide.includes('"FAQPage"'));

const sitemap = read('src/app/sitemap.ts');
for (const guide of guides) {
  check(`sitemap includes /blog/${guide.slug}`, sitemap.includes(`path:"/blog/${guide.slug}"`));
}

const internal = read('src/lib/internal-linking.ts');
for (const pillar of pillars) check(`internal-link map strengthened for ${pillar}`, internal.includes(`'${pillar}': [`));

const allNewText = [growth, pillarSection, homePillars, dynamicGuide].join('\n').toLowerCase();
check('no serverless marketing terminology added', !allNewText.includes('serverless pdf'));
check('no fake review/rating schema added', !allNewText.includes('aggregaterating') && !allNewText.includes('reviewrating'));

if (failures.length) {
  console.error('\nAJN PDF SEO GROWTH V2 VERIFY: FAIL');
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('\nAJN PDF SEO GROWTH V2 VERIFY: PASS');
