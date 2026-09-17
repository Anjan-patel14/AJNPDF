import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const exists = (path) => fs.existsSync(path);
const failures = [];
const check = (label, condition) => condition ? console.log(`PASS: ${label}`) : failures.push(label);

const policy = read('src/lib/tool-policy.ts');
const hero = read('src/components/landing/hero.tsx');
const page = read('src/app/page.tsx');
const cards = read('src/components/landing/services-grid.tsx');
const navbar = read('src/components/landing/navbar.tsx');
const mobileNav = read('src/components/landing/mobile-bottom-nav.tsx');
const layout = read('src/app/layout.tsx');
const next = read('next.config.ts');
const adsLoader = read('src/components/adsense-script-loader.tsx');
const robots = read('src/app/robots.ts');
const sitemap = read('src/app/sitemap.ts');
const privacy = read('src/app/privacy/page.tsx');
const pdfToolsPage = read('src/app/pdf-tools/page.tsx');
const adsTxt = read('public/ads.txt');
const localStart = read('START_AJN_PDF_LOCAL.ps1');
const releaseCheck = read('CHECK_ADSENSE_SEO_READY.ps1');
const scannerPage = read('src/app/scanner/page.tsx');

const allowlist = policy.match(/PRODUCTION_PUBLIC_TOOL_IDS = new Set\(\[([\s\S]*?)\]\);/)?.[1] || '';
const ids = [...allowlist.matchAll(/'([^']+)'/g)].map((m) => m[1]);
const movedImageIds = ['image-reducer','image-resizer','crop-image','rotate-image','watermark-image','flip-image','convert-image'];
const imageToPdfIds = ['image-to-pdf','jpg-to-pdf','jpeg-to-pdf','png-to-pdf','webp-to-pdf'];
const browserConversionIds = ['heic-to-pdf','pdf-to-jpg','pdf-to-png','txt-to-pdf','html-to-pdf','markdown-to-pdf','json-to-pdf','xml-to-pdf'];

check('focused release exposes exactly 34 unique PDF tools', ids.length === 34 && new Set(ids).size === 34);
check('general image editing stays outside AJN PDF', movedImageIds.every((id) => !ids.includes(id)) && next.includes('imageToolRedirects') && next.includes("destination: '/img'"));
check('image-to-PDF creation workflows remain in the PDF catalog', imageToPdfIds.every((id) => ids.includes(id)));
check('browser-only conversion expansion remains in the PDF catalog', browserConversionIds.every((id) => ids.includes(id)));
check('homepage hero is focused on free online PDF tools', hero.includes('Free Online') && hero.includes('PDF Tools') && !/100\+|107\s+tools|Workspace preview|Report\.pdf/i.test(hero));
const categoryIds = [...page.matchAll(/id:\s*["']([^"']+)["']/g)].map((match) => match[1]);
check('homepage filters are PDF-only', ['all','edit','organize','security'].every((id) => categoryIds.includes(id)) && !categoryIds.includes('image'));
check('every public tool is rendered directly in the homepage grid', cards.includes('BUILD_PUBLIC_TOOLS.length') && cards.includes('filteredTools.map((tool) => <ToolCard') && cards.includes('Nothing is hidden behind a More tools menu'));
check('tool cards use simple visible line icons and avoid an image-tools directory', cards.includes('const Icon = tool.icon') && cards.includes('strokeWidth={2}') && !/Image Tools/i.test(cards));
check('scanner is visible but noindex and outside AdSense eligibility', cards.includes('ScannerCard') && cards.includes('href="/scanner"') && scannerPage.includes('index: false') && !adsLoader.includes("'/scanner'"));
check('desktop navigation avoids retired image/conversion directories', !navbar.includes('/image-tools') && !navbar.includes('/conversion-tools'));
check('mobile navigation avoids retired image directory', !mobileNav.includes('/image-tools'));
check('global metadata contains AdSense ownership signal and focused PDF schema', layout.includes('google-adsense-account') && ['Edit PDF','Merge PDF','Split PDF','Compress PDF','Sign PDF'].every((label) => layout.includes(label)));
check('ads.txt contains the authorised publisher declaration', adsTxt.trim() === 'google.com, pub-4495802176396975, DIRECT, f08c47fec0942fa0');
check('AdSense loader is production-host, consent and free-plan gated', adsLoader.includes("host === 'ajnpdf.com'") && adsLoader.includes("host === 'www.ajnpdf.com'") && adsLoader.includes("ajn_cookie_consent") && adsLoader.includes("auth.plan === 'free'"));
check('AdSense does not load on the PDF directory or legal pages by default', !adsLoader.includes("'/pdf-tools'") && !adsLoader.includes("'/privacy'") && !adsLoader.includes("'/terms'"));
check('canonical host redirect remains www.ajnpdf.com', next.includes("value: 'ajnpdf.com'") && next.includes('https://www.ajnpdf.com/:path*'));
check('legacy /tools routes redirect to canonical root tools or directory', next.includes('publicToolLegacyRedirects') && next.includes("source: '/tools/:id'") && next.includes("destination: '/pdf-tools'"));
check('thin utility routes are noindex', next.includes("source: '/status'") && next.includes("source: '/changelog'") && next.includes('X-Robots-Tag') && next.includes('noindex, follow'));
check('robots publishes sitemap and blocks internal/admin routes', robots.includes('sitemap.xml') && robots.includes("'/api/'") && robots.includes("'/admin/'") && robots.includes("'/private/'"));
check('sitemap excludes redirected thin utility and duplicate guide routes', !sitemap.includes('{ path:"/status"') && !sitemap.includes('{ path:"/changelog"') && !sitemap.includes('merge-pdf-on-android') && !sitemap.includes('compress-pdf-on-android') && !sitemap.includes('edit-pdf-on-android') && !sitemap.includes('split-pdf-on-android'));
check('PDF tools directory remains server-renderable and useful', !pdfToolsPage.includes('useSearchParams') && pdfToolsPage.includes('Choose the right PDF task before you start.'));
check('privacy policy discloses browser/server processing and AdSense consent', privacy.includes('active browser session') && privacy.includes('temporarily over HTTPS') && privacy.includes('Google AdSense') && privacy.includes('consent'));
check('legal and trust pages required for publisher review exist', ['src/app/about/page.tsx','src/app/contact/page.tsx','src/app/privacy/page.tsx','src/app/terms/page.tsx','src/app/cookies/page.tsx','src/app/file-processing-policy/page.tsx','src/app/security/page.tsx','src/app/limits/page.tsx'].every(exists));
check('one-command local launcher validates Node and starts Next.js', localStart.includes('node -p') && localStart.includes('npm run dev') && localStart.includes('9002'));
check('release checker validates AdSense, sitemap and build readiness', releaseCheck.includes('ads.txt') && releaseCheck.includes('verify:seo-ads') && releaseCheck.includes('verify:sitemap-indexing') && releaseCheck.includes('npm run build'));

if (failures.length) {
  console.error('AJN PDF PRODUCT ECOSYSTEM: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('AJN PDF PRODUCT ECOSYSTEM: PASS');
