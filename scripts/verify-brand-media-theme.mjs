import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const read=(f)=>fs.readFileSync(path.join(root,f),'utf8'); const exists=(f)=>fs.existsSync(path.join(root,f)); const passed=[];
const check=(label,ok)=>{if(!ok)throw new Error(`FAIL: ${label}`);passed.push(`PASS: ${label}`)};
const brand=read('src/lib/brand.ts'),developer=read('src/app/developer/page.tsx'),studio=read('src/app/ajn-studio/page.tsx'),discover=read('src/app/discover/page.tsx'),detail=read('src/app/discover/[slug]/page.tsx'),adminMedia=read('src/app/admin/media/page.tsx'),publicMedia=read('backend/app/public_media.py'),backend=read('backend/app/main.py'),css=read('src/app/globals.css'),sitemap=read('src/app/sitemap.ts'),imageSitemap=read('src/app/image-sitemap.xml/route.ts'),feed=read('src/app/feed.xml/route.ts'),setup=read('SETUP_FULL_PRODUCTION.ps1')+'\n'+read('R16_PRODUCTION_SETUP_AND_DEPLOY.ps1'),analytics=read('src/components/analytics/site-analytics.tsx'),themeProvider=read('src/components/theme/theme-provider.tsx');
for(const asset of ['public/images/anjan-kumar-developer.jpg','public/images/anjan-kumar-developer.webp','public/images/anjan-kumar-developer-thumb.webp','public/images/anjan-developer-og.jpg'])check(`Owned developer asset ${asset}`,exists(asset));
check('Brand identity declares Anjan, AJN PDF and AJN Studio',brand.includes("developerName: 'Anjan Kumar'")&&brand.includes("studioName: 'AJN Studio'")&&brand.includes("productName: 'AJN PDF'"));
check('Developer page uses public portrait and ProfilePage structured data',developer.includes('developerImage')&&developer.includes("'@type': 'ProfilePage'")&&developer.includes("'@type': 'Person'"));
check('AJN Studio organization page exists',studio.includes("'@type': 'Organization'")&&studio.includes('AJN Studio'));
check('Public discover collection uses ImageObject structured data',discover.includes("'@type': 'CollectionPage'")&&discover.includes("'@type': 'ImageObject'"));
check('Discover detail uses ImageObject licensing fields',detail.includes('creditText')&&detail.includes('copyrightNotice')&&detail.includes('license')&&detail.includes('acquireLicensePage'));
check('Admin publisher requires rights confirmation',adminMedia.includes('rights_confirmed')&&publicMedia.includes('rights_confirmed'));
check('Admin publisher requires useful captions and alt text',adminMedia.includes('minLength={60}')&&publicMedia.includes('Form(min_length=60'));
check('Media backend validates MIME, pixel count and file size',publicMedia.includes('ALLOWED_MIME')&&publicMedia.includes('MAX_IMAGE_PIXELS')&&publicMedia.includes('MAX_IMAGE_BYTES'));
check('Media backend stores optimized WebP and thumbnails',publicMedia.includes("full.save(image_path,'WEBP'")&&publicMedia.includes("thumb.save(thumb_path,'WEBP'"));
check('Media backend uses constant-time admin token comparison',publicMedia.includes('secrets.compare_digest'));
check('Public media routes are cache-aware while private APIs remain no-store',backend.includes('request.url.path.startswith("/media/")')&&backend.includes('max-age=31536000')&&backend.includes('stale-while-revalidate=300'));
check('Media analytics events are privacy-minimized',analytics.includes("'media_view'")&&analytics.includes("'media_open'")&&!analytics.includes('file.name'));
check('Image sitemap route exists',imageSitemap.includes('xmlns:image')&&imageSitemap.includes('<image:loc>'));
check('RSS feed route exists',feed.includes('<rss version="2.0">')&&feed.includes('AJN Discover'));
const hasCoreSitemapPath = (pathname) =>
  sitemap.includes(`{ path: '${pathname}'`) ||
  sitemap.includes(`path: '${pathname}'`);

check(
  'Primary sitemap includes brand and discover routes',
  hasCoreSitemapPath('/developer') &&
  hasCoreSitemapPath('/ajn-studio') &&
  hasCoreSitemapPath('/discover') &&
  sitemap.includes('CORE_PAGE_DEFINITIONS.map(coreEntry)') &&
  sitemap.includes('url: `${SITE_URL}${definition.path')
);
check('Professional semantic surface and text tokens exist',css.includes('--surface-elevated')&&css.includes('--text-primary'));
check('Public theme is intentionally light-only',css.includes('color-scheme: light !important')&&!css.includes('.dark')&&themeProvider.includes("root.classList.remove('dark')")&&!exists('src/components/theme/theme-toggle.tsx'));
check('Reduced motion remains supported',css.includes('@media (prefers-reduced-motion: reduce)'));
check('Backend version is 3.1.0',backend.includes('VERSION = "3.1.0"'));
check(
  'Setup validates backend readiness and capability snapshot',
  setup.includes('Assert-Ready') &&
  setup.includes('verify-capability-manifest.mjs')
);
check(
  'Setup exercises public media and backend creates its runtime directory',
  setup.includes('backend\\smoke_test.py') &&
  publicMedia.includes('MEDIA_ROOT.mkdir')
);
check('Setup remains PowerShell 5.1 compatible',!setup.includes('Join-String')&&!setup.includes('RandomNumberGenerator]::Fill'));
console.log(passed.join('\n')); console.log('Brand, developer, public media, image SEO, light theme and setup verification completed successfully.');
