import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const exists = (path) => fs.existsSync(path);
const failures = [];
const check = (label, condition) => condition ? console.log(`PASS: ${label}`) : failures.push(label);

const policy = read('src/lib/tool-policy.ts');
const ids = JSON.parse(read('scripts/r13-public-tool-ids.json'));
const hero = read('src/components/landing/hero.tsx');
const home = read('src/app/page.tsx');
const cards = read('src/components/landing/services-grid.tsx');
const navbar = read('src/components/landing/navbar.tsx');
const mobileNav = read('src/components/landing/mobile-bottom-nav.tsx');
const layout = read('src/app/layout.tsx');
const toolPage = read('src/app/(tool-pages)/[id]/page.tsx');
const sitemap = read('src/app/sitemap.ts');
const robots = read('src/app/robots.ts');
const next = read('next.config.ts');
const seo = read('src/lib/seo-strategy.ts');
const backendUrl = read('src/lib/backend-service-url.ts');
const backend = read('backend/app/main.py');

const allowlist = policy.match(/PRODUCTION_PUBLIC_TOOL_IDS = new Set\(\[([\s\S]*?)\]\);/)?.[1] || '';
const publicIds = [...allowlist.matchAll(/'([^']+)'/g)].map((match) => match[1]);
const publicSet = new Set(publicIds);
const expectedSet = new Set(ids);

check(
  'current production catalog exposes exactly 26 unique PDF-focused workflows',
  publicIds.length === 26 && publicSet.size === 26 && ids.length === 26 && expectedSet.size === 26 &&
  publicIds.every((id) => expectedSet.has(id)) && ids.every((id) => publicSet.has(id)),
);
check(
  'standalone image editing utilities remain outside AJN PDF public routes',
  !['image-reducer','image-resizer','crop-image','rotate-image','watermark-image','flip-image','convert-image','remove-bg','upscale-image','blur-face']
    .some((id) => publicSet.has(id)),
);
check(
  'homepage remains PDF-only and exposes the current search directory',
  hero.includes('Free Online PDF Tools') && home.includes('id="public-tools"') && home.includes('id="home-tool-search"') &&
  !home.includes("id: 'image'") && !home.includes("id: 'conversion'"),
);
check(
  'tool directory cards remain real route links rather than placeholder actions',
  cards.includes('toolPath(tool.id)') && !cards.includes('href="#"'),
);
check(
  'desktop and mobile navigation use current PDF product destinations',
  navbar.includes('/pdf-tools') && !navbar.includes('/image-tools') && !navbar.includes('/conversion-tools') &&
  mobileNav.includes('href: "/pdf-tools"') && mobileNav.includes('href: "/status"'),
);
check(
  'root schema describes AJN PDF without fake ratings or review counts',
  layout.includes('"@type": "Organization"') && layout.includes('"@type": "WebSite"') && layout.includes('"@type": "SoftwareApplication"') &&
  layout.includes('Protect PDF') && layout.includes('Unlock PDF') && layout.includes('Repair PDF') &&
  !/AggregateRating|ratingValue|reviewCount/.test(layout),
);
check(
  'every public tool route receives metadata, WebApplication schema, breadcrumbs and visible editorial SEO layers',
  toolPage.includes('buildToolMetadata(tool)') && toolPage.includes("'@type': 'WebApplication'") &&
  toolPage.includes("'@type': 'BreadcrumbList'") && toolPage.includes('<ToolEditorialContent tool={tool} />') &&
  toolPage.includes('<SeoPillarSection toolId={tool.id} />') && toolPage.includes('<ToolSeoRelatedLinks toolId={tool.id} />'),
);
check(
  'all 26 public tools have explicit search-focused SEO overrides',
  ids.every((id) => seo.includes(`'${id}': {`)),
);
check(
  'canonical sitemap is generated from the public tool inventory and contains no dead pricing route',
  sitemap.includes('BUILD_PUBLIC_TOOLS') && sitemap.includes('toolPath(tool.id)') && !sitemap.includes('path:"/pricing"') && !sitemap.includes("path: '/pricing'"),
);
check(
  'robots publishes canonical and image sitemaps while excluding private application surfaces',
  robots.includes('sitemap.xml') && robots.includes('image-sitemap.xml') && robots.includes("'/api/'") &&
  robots.includes("'/admin/'") && robots.includes("'/private/'"),
);
check(
  'canonical host and backend routing are centralized',
  read('src/lib/seo-config.ts').includes("SITE_URL = 'https://www.ajnpdf.com'") &&
  backendUrl.includes('ajn-pdf-api-580158856470.asia-south1.run.app') && next.includes('configuredPdfBackendCandidates'),
);
check(
  'backend has scoped production CORS and public readiness endpoints',
  backend.includes('AJN_ALLOWED_ORIGINS') && backend.includes('AJN_ALLOWED_ORIGIN_REGEX') && backend.includes("@app.get('/ready'") && backend.includes("@app.get('/health'"),
);
check('image sitemap route exists', exists('src/app/image-sitemap.xml/route.ts'));
check('SEO growth guide source exists', exists('src/lib/seo-growth-guides.ts') && exists('src/app/blog/[slug]/page.tsx'));

if (failures.length) {
  console.error('AJN PDF CURRENT PRODUCT INTEGRITY: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('AJN PDF CURRENT PRODUCT INTEGRITY: PASS');
