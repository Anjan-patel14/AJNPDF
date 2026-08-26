import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
let passed = 0;
function check(label, ok) {
  if (!ok) { console.error(`FAIL: ${label}`); process.exit(1); }
  passed += 1;
  console.log(`PASS: ${label}`);
}

const detail = read('src/app/discover/[slug]/page.tsx');
const collection = read('src/app/discover/page.tsx');
const sitemap = read('src/app/sitemap.ts');
const footer = read('src/components/landing/main-footer.tsx');
const contact = read('src/app/contact/page.tsx');
const analytics = read('src/app/admin/analytics/page.tsx');
const media = read('src/app/admin/media/page.tsx');
const diagnostics = read('src/lib/admin-diagnostics.ts');
const config = read('CONFIGURE_AJN_ADMIN_LOCAL.ps1');

for (const [label, source] of [['Discover detail ImageObject', detail], ['Discover collection ImageObject', collection]]) {
  check(`${label} includes acquireLicensePage`, source.includes('acquireLicensePage'));
  check(`${label} includes copyrightNotice`, source.includes('copyrightNotice'));
  check(`${label} includes license`, /\blicense:\s*`\$\{SITE_URL\}\/image-licensing`/.test(source));
  check(`${label} includes creditText`, source.includes('creditText'));
}

check('dedicated image licensing page exists', exists('src/app/image-licensing/page.tsx'));
const licensing = read('src/app/image-licensing/page.tsx');
check('image licensing page distinguishes publication from reuse permission', licensing.includes('does not grant visitors a licence') && licensing.includes('applicable rights holder'));
check('image licensing route is linked from discover, footer and sitemap', collection.includes('/image-licensing') && footer.includes('/image-licensing') && sitemap.includes('`${SITE_URL}/image-licensing`'));
check('contact page exposes an image licensing request path', contact.includes('AJN PDF Image Licensing Request'));

check('admin diagnostics converts disabled analytics into deployment guidance', diagnostics.includes('AJN_ANALYTICS_ENABLED=true') && diagnostics.includes("area === 'analytics'"));
check('admin diagnostics distinguishes media and analytics tokens', diagnostics.includes('AJN_ANALYTICS_ADMIN_TOKEN') && diagnostics.includes('AJN_MEDIA_ADMIN_TOKEN'));
check('admin diagnostics handles auth, missing endpoint and rate-limit states', diagnostics.includes('status === 401') && diagnostics.includes('status === 404') && diagnostics.includes('status === 429'));
check('analytics admin uses shared runtime diagnostics', analytics.includes("formatAdminApiError('analytics'") && analytics.includes('AJN_ANALYTICS_ADMIN_TOKEN'));
check('media admin uses shared runtime diagnostics for every admin mutation', (media.match(/formatAdminApiError\('media'/g) || []).length >= 4 && media.includes('AJN_MEDIA_ADMIN_TOKEN'));
check('admin pages identify the running backend instead of implying a local token is universal', analytics.includes('Running backend:') && media.includes('Running backend:'));

check('local admin setup helper exists and enables anonymous analytics', exists('CONFIGURE_AJN_ADMIN_LOCAL.ps1') && config.includes("AJN_ANALYTICS_ENABLED'] = 'true'"));
check('local admin setup uses cryptographic random bytes', config.includes('RandomNumberGenerator') && config.includes('New-AjnAdminToken'));
check('local admin setup enforces distinct analytics and media tokens', config.includes('if ($AnalyticsToken -eq $MediaToken)'));
check('local admin setup does not print either full token by default', !config.includes('Write-Host $AnalyticsToken') && !config.includes('Write-Host $MediaToken'));
check('local admin setup clearly separates local and deployed backend configuration', config.includes('local .env.local does NOT configure the deployed backend'));

const localeNames = ['en','hi','te','ta','kn'];
const locales = localeNames.map((name) => JSON.parse(read(`src/i18n/locales/${name}.json`)));
const keys = locales.map((messages) => Object.keys(messages).sort().join('|'));
check('all five locale dictionaries retain identical key structures', new Set(keys).size === 1);
check('image licensing footer label exists in every locale', locales.every((messages) => typeof messages['footer.imageLicensing'] === 'string' && messages['footer.imageLicensing'].trim()));
check('R10.9 locale baseline of at least 511 shared keys is retained', locales.every((messages) => Object.keys(messages).length >= 511));

const brandVerifier = read('scripts/verify-brand-media-theme.mjs');
check('retained brand/media verifier now requires all four Google image licensing fields', brandVerifier.includes("detail.includes('license')"));

if (exists('APPLY_TEST_PUSH_FRONTEND.ps1')) {
  const updater = read('APPLY_TEST_PUSH_FRONTEND.ps1');
  check('package updater carries R10.9 source verification before lint/build/commit', updater.includes('verify-r10-9-search-admin.mjs') && updater.indexOf('verify-r10-9-search-admin.mjs') < updater.indexOf('Invoke-NpmGate "lint"') && updater.indexOf('verify-r10-9-search-admin.mjs') < updater.indexOf('git -C $RepoPath commit -m'));
  check('package updater copies the local admin setup helper with a declared backend policy', updater.includes('CONFIGURE_AJN_ADMIN_LOCAL.ps1') && updater.includes('R11_BACKEND_POLICY:') && updater.includes('backend/.env.example') && updater.includes('backend/app/main.py') && updater.includes('backend/app/conversion_engine.py'));
  check('package updater uses the R10.9 commit message', updater.includes('fix: complete image licensing and admin diagnostics'));
}

console.log(`AJN PDF R10.9 SEARCH / IMAGE LICENSING / ADMIN DIAGNOSTICS SOURCE VERIFICATION: PASS`);
console.log(`${passed} source gates passed. Production environment secrets, Search Console recrawl, real-browser Core Web Vitals and external Chrome review remain deployment/external checks.`);
