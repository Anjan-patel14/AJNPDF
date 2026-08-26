import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const failures = [];
const pass = (message) => console.log(`PASS: ${message}`);
const fail = (message) => failures.push(message);
const check = (message, condition) => condition ? pass(message) : fail(message);

const routeFile = 'src/app/(tool-pages)/[id]/page.tsx';
const navbar = read('src/components/landing/navbar.tsx');
const allTools = read('src/components/landing/all-tools-menu.tsx');
const routeHelper = read('src/lib/tool-routes.ts');
const search = read('src/lib/tool-search.ts');
const seo = read('src/lib/seo-config.ts');
const sitemap = read('src/app/sitemap.ts');
const nextConfig = read('next.config.ts');
const chromePopup = read('chrome-extension/popup.js');
const toolPage = read(routeFile);
const packageJson = JSON.parse(read('package.json'));
const ids = JSON.parse(read('scripts/r13-public-tool-ids.json'));

function hasLegacyToolRedirect(source, destination) {
  const inline =
    nextConfig.includes(`source: '/tools/${source}'`) &&
    nextConfig.includes(`destination: '/${destination}'`);

  const centralized =
    (nextConfig.includes('legacyToolAliases') ||
      nextConfig.includes('directLegacyToolRedirects')) &&
    (
      nextConfig.includes(`'${source}': '${destination}'`) ||
      nextConfig.includes(`"${source}": "${destination}"`)
    );

  return inline || centralized;
}

check('root-level dynamic tool route exists', exists(routeFile));
check('legacy app/tools route folder is removed', !exists('src/app/tools'));
check('tool route is a URL-neutral route group', routeFile.includes('(tool-pages)'));
check('tool metadata canonical uses shared root route helper', seo.includes('const pathname = toolPath(tool.id);'));
check('tool schema uses root URL helper', toolPage.includes('`${SITE_URL}${toolPath(tool.id)}`'));

const sitemapUsesRootToolPaths =
  sitemap.includes('toolPath(tool.id)') &&
  (sitemap.includes('url: `${SITE_URL}${toolPath(tool.id)}`') ||
   sitemap.includes('url: `${SITE_URL}${pathname}`')) &&
  !sitemap.includes('/tools/');
check('tool sitemap publishes canonical root tool URLs', sitemapUsesRootToolPaths);

check('legacy /tools directory permanently redirects to the public tool directory',
  nextConfig.includes("source: '/tools'") && nextConfig.includes("destination: '/pdf-tools'"));
check('legacy /tools/:id permanently redirects to root path',
  nextConfig.includes("source: '/tools/:id'") &&
  nextConfig.includes("destination: '/:id'") &&
  nextConfig.includes('permanent: true'));
check('legacy Smart Read redirects directly to root canonical tool',
  hasLegacyToolRedirect('smart-read', 'pdf-text'));
check('legacy PDF-to-PPT redirects directly to root canonical tool',
  hasLegacyToolRedirect('pdf-ppt', 'pdf-to-powerpoint'));

check('shared route helper protects reserved root routes',
  routeHelper.includes('RESERVED_ROOT_ROUTES') &&
  routeHelper.includes('collides with reserved route'));
check('analytics route helper supports root and legacy tool paths',
  routeHelper.includes("parts[0] === 'tools'") &&
  routeHelper.includes('return first;'));

check('desktop header has direct Merge/Split/Compress links',
  navbar.includes("'merge-pdf'") &&
  navbar.includes("'split-pdf'") &&
  navbar.includes("'compress-pdf'"));
check('desktop header has fast Convert menu',
  navbar.includes('function ConvertMenu()') &&
  navbar.includes('Convert to PDF') &&
  navbar.includes('Convert from PDF'));
check('header includes reusable nine-dot all-tools launcher',
  navbar.includes('<AllToolsMenu') && allTools.includes('<Grip'));
check('all-tools launcher searches live public tool registry',
  allTools.includes('BUILD_PUBLIC_TOOLS') && allTools.includes('scoreToolSearch'));
check('all-tools launcher exposes every matching workflow instead of a fixed small list',
  allTools.includes('groups.map') && allTools.includes('group.items.map'));
check('all-tools menu avoids eager route prefetching',
  allTools.includes('prefetch={false}') &&
  allTools.includes('router.prefetch(toolPath(item.id))'));
check('all-tools dialog keeps keyboard focus inside while open',
  allTools.includes("event.key === 'Tab'") &&
  allTools.includes('querySelectorAll<HTMLElement>'));
check('intent-aware search includes task synonyms',
  search.includes('combine') &&
  search.includes('smaller') &&
  search.includes('password'));
check('search popularity bonus applies only to real matches',
  search.includes("score > 0 && tool.badge === 'Popular'"));
check('Chrome extension opens root tool URLs',
  chromePopup.includes('`${siteBase}/${encodeURIComponent(id)}?utm_source=chrome_extension'));
check('R12 source and runtime verifiers are registered in package scripts',
  packageJson.scripts?.['verify:r12'] === 'node scripts/verify-r12-root-routes-nav.mjs' &&
  packageJson.scripts?.['verify:r12-runtime'] === 'node scripts/verify-r12-runtime.mjs');

const extensionZipHash = (rel) =>
  crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(root, rel)))
    .digest('hex');

check('website and root Chrome extension ZIP copies are identical',
  exists('AJN-PDF-CHROME-EXTENSION-1.0.0.zip') &&
  exists('public/downloads/AJN-PDF-CHROME-EXTENSION-1.0.0.zip') &&
  extensionZipHash('AJN-PDF-CHROME-EXTENSION-1.0.0.zip') ===
    extensionZipHash('public/downloads/AJN-PDF-CHROME-EXTENSION-1.0.0.zip'));

const publicSourceRoots = ['src', 'chrome-extension'];
const staleRefs = [];
for (const top of publicSourceRoots) {
  const base = path.join(root, top);
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(?:ts|tsx|js|jsx|json|md|txt)$/i.test(entry.name)) {
        const rel = path.relative(root, full).split(path.sep).join('/');
        const source = fs.readFileSync(full, 'utf8');
        if (rel === 'src/lib/tool-routes.ts') continue;
        if (source.includes('/tools/')) staleRefs.push(rel);
      }
    }
  };
  walk(base);
}
check('public source contains no internal /tools/ URLs', staleRefs.length === 0);
if (staleRefs.length) fail(`stale /tools/ references: ${staleRefs.join(', ')}`);

check('current public root-route inventory contains 95 unique tools',
  ids.length === 95 && new Set(ids).size === 95);

const appRoot = path.join(root, 'src/app');
const staticRoots = new Set(
  fs.readdirSync(appRoot, { withFileTypes: true })
    .filter((entry) =>
      entry.isDirectory() &&
      !entry.name.startsWith('(') &&
      !entry.name.startsWith('['))
    .map((entry) => entry.name)
);
const collisions = ids.filter((id) => staticRoots.has(id));
check('current public tool slugs do not collide with static root pages',
  collisions.length === 0);
if (collisions.length) fail(`root route collisions: ${collisions.join(', ')}`);

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  console.error(`AJN PDF R12 ROOT ROUTES / PRO NAV verification failed with ${failures.length} issue(s).`);
  process.exit(1);
}
console.log(`AJN PDF R12 ROOT ROUTES / PRO NAV SOURCE VERIFICATION: PASS (${ids.length} public tools)`);
