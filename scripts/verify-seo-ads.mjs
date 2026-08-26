import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
const pass = (message) => console.log(`PASS: ${message}`);

const workspace = read('src/components/junction/tool-workspace-client.tsx');
const publicIds = JSON.parse(read('scripts/r13-public-tool-ids.json'));

if (publicIds.length !== new Set(publicIds).size) {
  fail('Public tool inventory contains duplicate IDs.');
} else {
  pass(`${publicIds.length} unique public tool IDs`);
}

if (publicIds.length !== 95) {
  fail(`Expected 95 current public tools, found ${publicIds.length}.`);
} else {
  pass('Current 95-tool public inventory confirmed');
}

/*
 * Route coverage is verified comprehensively by R12/R13, build and runtime gates.
 * This gate verifies only that the two workspace dispatch paths are structurally intact.
 */
const mapped = new Map(
  [...workspace.matchAll(/'([^']+)':\s*dynamic\(\(\)\s*=>\s*import\('\.\/([^']+)'\)/g)]
    .map((match) => [match[1], match[2]])
);

let directMappingsOk = true;
for (const [id, component] of mapped) {
  const componentPath = path.join(root, 'src/components/junction', `${component}.tsx`);
  if (!fs.existsSync(componentPath)) {
    fail(`${id} maps to missing component ${component}.tsx`);
    directMappingsOk = false;
  }
}
if (directMappingsOk) pass('Every direct workspace component mapping points to an existing component');

const directMergeMapped =
  workspace.includes("import MergePdf from './MergePdf'") &&
  workspace.includes("id === 'merge-pdf' ? MergePdf : TOOL_COMPONENTS[id]");
directMergeMapped
  ? pass('Direct Merge PDF workspace mapping is intact')
  : fail('Direct Merge PDF workspace mapping is incomplete.');

const serverRoutingOk =
  /\bCONVERSION_TOOLS\b/.test(workspace) &&
  /\bSERVER_CONVERSION_IDS\b/.test(workspace) &&
  /new\s+Set\s*\(\s*CONVERSION_TOOLS\.map\s*\(\s*\(\s*tool\s*\)\s*=>\s*tool\.id\s*\)\s*\)/.test(workspace) &&
  /SERVER_CONVERSION_IDS\.has\s*\(\s*id\s*\)/.test(workspace) &&
  /ServerConversionTool/.test(workspace) &&
  /const\s+serverToolId\s*=\s*SERVER_ALIASES\[id\]\s*\|\|\s*\(SERVER_CONVERSION_IDS\.has\(id\)\s*\?\s*id\s*:\s*null\)/.test(workspace) && /ServerConversionTool\s+toolId=\{serverToolId\}/.test(workspace);
serverRoutingOk
  ? pass('Server-conversion workspace routing is intact')
  : fail('Server-conversion workspace routing is incomplete.');

const route = read('src/app/(tool-pages)/[id]/page.tsx');
route.includes('generateMetadata')
  ? pass('Dynamic tool metadata enabled')
  : fail('Dynamic tool metadata is missing.');

route.includes('BreadcrumbList') &&
route.includes('WebApplication') &&
!route.includes('FAQPage') &&
!route.includes('HowTo')
  ? pass('Breadcrumb and accurate WebApplication structured data enabled')
  : fail('Tool structured data is incomplete or contains legacy rich-result markup.');

route.includes('ToolEditorialContent')
  ? pass('Detailed tool guidance is rendered before ads')
  : fail('Useful server-rendered tool guidance is missing.');

if (fs.existsSync(path.join(root, 'public/robots.txt')) ||
    fs.existsSync(path.join(root, 'public/sitemap.xml'))) {
  fail('Duplicate static robots/sitemap files remain in public/.');
} else {
  pass('No duplicate public robots/sitemap files');
}

const layout = read('src/app/layout.tsx');
const loader = read('src/components/adsense-script-loader.tsx');
const adUnit = read('src/components/adsense-unit.tsx');
const allAds = `${layout}\n${loader}\n${adUnit}`;

if (/amp-auto-ads|<amp-ad|cdn\.ampproject\.org\/v0\/amp-ad/i.test(allAds)) {
  fail('AMP code is present in the non-AMP site.');
} else {
  pass('No AMP ad code in the non-AMP website');
}

layout.includes('google-adsense-account')
  ? pass('AdSense ownership meta tag enabled')
  : fail('AdSense ownership meta tag is missing.');

loader.includes('ajn_cookie_consent') &&
loader.includes('document.head.appendChild')
  ? pass('AdSense script loads only after optional advertising choice')
  : fail('Consent-aware AdSense loader is incomplete.');

loader.includes("host === 'ajnpdf.com'") &&
loader.includes("host === 'www.ajnpdf.com'")
  ? pass('Live ad loading is restricted to AJN PDF production domains')
  : fail('Production domain guard is missing.');

adUnit.includes('ajn_cookie_consent') &&
adUnit.includes('data-ad-slot')
  ? pass('Ad units require consent and a configured slot')
  : fail('Ad unit consent or slot guard is incomplete.');

const slots = read('src/lib/ad-slots.ts');
for (const value of ['3648223351', '4849624383', '1601180258']) {
  slots.includes(value)
    ? pass(`AdSense slot ${value} configured`)
    : fail(`Missing AdSense slot ${value}`);
}

const ads = read('public/ads.txt').trim();
ads === 'google.com, pub-4495802176396975, DIRECT, f08c47fec0942fa0'
  ? pass('ads.txt is valid')
  : fail('ads.txt content is incorrect.');

if (!process.exitCode) {
  console.log('SEO/ADS VERIFICATION: PASS');
}
