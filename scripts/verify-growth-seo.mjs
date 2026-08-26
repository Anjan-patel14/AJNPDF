import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
let failed = false;
const pass = (message) => console.log(`PASS: ${message}`);
const fail = (message) => { failed = true; console.error(`FAIL: ${message}`); };

const requiredFiles = [
  'src/lib/seo-strategy.ts',
  'src/lib/internal-linking.ts',
  'src/lib/content-engine.ts',
  'src/components/analytics/google-analytics.tsx',
  'src/components/analytics/site-analytics.tsx',
  'SEO_GROWTH_SYSTEM.md',
  'SEO_KEYWORD_INTENT_MAP.csv',
  'CONTENT_ENGINE_CALENDAR.csv',
  'BACKLINK_AUTHORITY_PLAN.md',
  'CRO_MEASUREMENT_PLAN.md',
  'SEO_SETUP_CHECKLIST.md'];
for (const file of requiredFiles) fs.existsSync(path.join(root, file)) ? pass(`SEO system file ${file}`) : fail(`Missing ${file}`);

const seo = read('src/lib/seo-config.ts');
const strategy = read('src/lib/seo-strategy.ts');
const links = read('src/lib/internal-linking.ts');
const toolPage = read('src/app/(tool-pages)/[id]/page.tsx');
const editorial = read('src/components/junction/tool-editorial-content.tsx');
const layout = read('src/app/layout.tsx');
const robots = read('src/app/robots.ts');
const analytics = read('src/components/analytics/site-analytics.tsx');
const backend = read('backend/app/main.py');
const env = read('.env.example');

strategy.includes('ICP_SEGMENTS') && strategy.includes('SEARCH_INTENT_CLUSTERS') ? pass('ICP and search intent mapping configured') : fail('ICP/search intent mapping missing');
seo.includes('getToolSeoProfile') && seo.includes('canonicalPath') ? pass('Generated tool metadata uses intent profiles and canonicals') : fail('Tool intent metadata missing');
toolPage.includes("'@type': 'WebApplication'") && toolPage.includes("'@type': 'BreadcrumbList'") && !toolPage.includes("totalTime: 'PT5M'") ? pass('Tool schema uses accurate WebApplication and Breadcrumb markup without invented completion time') : fail('Tool structured data incomplete or contains synthetic timing');
editorial.includes('getRelatedTools') && editorial.includes('getRelatedGuides') ? pass('Contextual tool and guide internal linking enabled') : fail('Contextual internal linking missing');
links.includes('score:') || links.includes('categoryScore') ? pass('Related tool scoring configured') : fail('Related tool scoring missing');
layout.includes('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION') && layout.includes('<SiteAnalytics />') && layout.includes('<GoogleAnalytics />') ? pass('Search verification and optional analytics are connected') : fail('Search/analytics integration incomplete');
robots.includes("'/admin/'") ? pass('Private admin routes excluded from crawling') : fail('Admin robots exclusion missing');
analytics.includes('useReportWebVitals') && analytics.includes("event_name: 'page_view'") ? pass('Core Web Vitals and page funnel tracking enabled after consent') : fail('Web Vitals or funnel analytics missing');
backend.includes('/api/analytics/event') && backend.includes('CREATE TABLE IF NOT EXISTS site_events') && backend.includes('metric_rating') ? pass('Privacy-minimized backend analytics storage enabled') : fail('Backend SEO/CRO analytics missing');
backend.includes('filename TEXT') || backend.includes('ip_address TEXT') ? fail('Site analytics stores filenames or IP addresses') : pass('Site analytics excludes filenames and stored IP addresses');
env.includes('NEXT_PUBLIC_GA4_MEASUREMENT_ID') && env.includes('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION') ? pass('Analytics and Search verification environment keys documented') : fail('SEO environment keys missing');

const keywordLines = read('SEO_KEYWORD_INTENT_MAP.csv').trim().split(/\r?\n/).length - 1;
keywordLines >= 100 ? pass(`${keywordLines} tool keyword-intent mappings generated`) : fail(`Only ${keywordLines} keyword mappings found`);

const pages = ['conversion-tools', 'image-tools', 'pdf-utilities'];
for (const page of pages) {
  const source = read(`src/app/${page}/page.tsx`);
  source.includes("'@type': 'CollectionPage'") ? pass(`CollectionPage schema /${page}`) : fail(`Category schema missing /${page}`);
  source.includes('alternates: { canonical:') ? pass(`Canonical metadata /${page}`) : fail(`Category canonical missing /${page}`);
}

if (failed) process.exit(1);
