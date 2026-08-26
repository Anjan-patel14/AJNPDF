import fs from 'node:fs';

const failures = [];

const pass = (label) => {
  console.log(`PASS: ${label}`);
};

const check = (label, condition) => {
  if (condition) pass(label);
  else failures.push(label);
};

const read = (path) => fs.readFileSync(path, 'utf8');

const policy = read('src/app/file-processing-policy/page.tsx');
const security = read('src/app/security/page.tsx');
const about = read('src/app/about/page.tsx');
const faq = read('src/app/faq/page.tsx');
const privacy = read('src/app/privacy/page.tsx');
const transparency = read('src/app/transparency/page.tsx');
const limits = read('src/app/limits/page.tsx');

const disclosure = read('src/lib/processing-disclosure.ts');
const brand = read('src/lib/brand.ts');

const legalShell = read(
  'src/components/legal/legal-page-shell.tsx'
);

const copyright = read(
  'src/app/copyright/page.tsx'
);

const dataDeletion = read(
  'src/app/data-deletion/page.tsx'
);

const guides = read(
  'src/components/discover/guide-library.tsx'
);

const guidePage = read(
  'src/app/discover/guides/page.tsx'
);

const toolEditorial = read(
  'src/components/junction/tool-editorial-content.tsx'
);

const sitemap = read('src/app/sitemap.ts');
const robots = read('src/app/robots.ts');
const nextConfig = read('next.config.ts');
const constants = read('src/lib/tool-limit-constants.ts');

const pkg = JSON.parse(
  read('package.json')
);


check(
  'processing policy uses centralized server limit constants',
  policy.includes('SERVER_LIMIT_DEFAULTS') &&
  policy.includes('MERGE_PDF_LIMITS')
);


check(
  'stale 75/150/five-minute policy removed',
  !/75\s*MB per file/i.test(policy) &&
  !/150\s*MB across one request/i.test(policy) &&
  !/five-minute/i.test(policy)
);


check(
  'server default remains 30/30 MB',
  /maxFileSizeMb:\s*30/.test(constants) &&
  /maxTotalSizeMb:\s*30/.test(constants)
);


check(
  'official contact email centralized in brand source',
  brand.includes(
    "contactEmail: 'anjandev325@gmail.com'"
  ) &&
  !brand.includes(
    "contactEmail: 'anjanpatel325@gmail.com'"
  )
);


check(
  'security disclosure uses centralized brand contact',
  security.includes('AJN_BRAND.contactEmail') &&
  security.includes("from '@/lib/brand'") &&
  !security.includes('anjanpatel325@gmail.com')
);


check(
  'shared legal shell uses centralized brand contact',
  legalShell.includes('AJN_BRAND.contactEmail') &&
  legalShell.includes("from '@/lib/brand'") &&
  !legalShell.includes('anjanpatel325@gmail.com')
);


check(
  'copyright page uses centralized brand contact',
  copyright.includes('AJN_BRAND.contactEmail') &&
  copyright.includes("from '@/lib/brand'") &&
  !copyright.includes('anjanpatel325@gmail.com')
);


check(
  'data deletion page uses centralized brand contact',
  dataDeletion.includes('AJN_BRAND.contactEmail') &&
  dataDeletion.includes("from '@/lib/brand'") &&
  !dataDeletion.includes('anjanpatel325@gmail.com')
);


check(
  'shared processing disclosure exists and is used',
  disclosure.includes(
    'Local-first, with secure processing for advanced tools.'
  ) &&
  about.includes('ProcessingModelOverview') &&
  policy.includes('PROCESSING_DISCLOSURE') &&
  security.includes('PROCESSING_DISCLOSURE')
);


check(
  'AJN Discover guide route is implemented',
  guidePage.includes('GuideLibrary') &&
  guidePage.includes(
    "canonical: '/discover/guides'"
  ) &&
  guides.includes('BUILD_PUBLIC_TOOLS') &&
  guides.includes('toolPath(tool.id)')
);


check(
  'guide library covers priority non- crawl paths',
  [
    'merge-pdf',
    'split-pdf',
    'compress-pdf',
    'pdf-to-word',
    'word-to-pdf',
    'protect-pdf',
    'repair-pdf',
    'image-resizer',
    'image-reducer'].every(
    (id) => guides.includes(`'${id}'`)
  )
);


check(
  'tool editorial links back to guide library',
  toolEditorial.includes(
    'href="/discover/guides"'
  )
);


check(
  'R16 canonical sitemap architecture remains intact',
  sitemap.includes('toolPath(tool.id)') &&
  !sitemap.includes(
    "url: `${SITE_URL}/tools/"
  ) &&
  !sitemap.includes(
    "{ path: '/discover/guides',"
  )
);


check(
  'robots advertises only real sitemap resources',
  robots.includes(
    "`${SITE_URL}/sitemap.xml`"
  ) &&
  robots.includes(
    "`${SITE_URL}/image-sitemap.xml`"
  )
);


check(
  'R16 canonical migration remains intact',
  nextConfig.includes(
    "{ source: '/tools/:id', destination: '/:id', permanent: true }"
  ) &&
  nextConfig.includes(
    "value: 'ajnpdf.com'"
  ) &&
  nextConfig.includes(
    "destination: 'https://www.ajnpdf.com/:path*'"
  )
);


const trustBundle = [
  about,
  faq,
  privacy,
  transparency,
  security,
  policy,
  limits].join('\n');


const banned = [
  [
    '55+ tools marketing claim',
    /\b55\+\b/i],
  [
    'blanket 200 MB marketing claim',
    /\b200\s*MB\b/i],
  [
    '100% local universal claim',
    /100%\s*(?:local|locally)/i],
  [
    'zero-server-transit claim',
    /zero[-\s]server[-\s]transit/i],
  [
    'files never leave universal claim',
    /files?\s+never\s+leave/i],
  [
    'no servers universal claim',
    /\bno\s+servers\b/i]];


for (const [label, pattern] of banned) {
  check(
    `trust pages exclude ${label}`,
    !pattern.test(trustBundle)
  );
}


check(
  'R17 verifier is wired into npm check',
  pkg.scripts?.['verify:r17-trust-seo'] ===
    'node scripts/verify-r17-trust-seo.mjs' &&
  String(pkg.scripts?.check || '').includes(
    'npm run verify:r17-trust-seo'
  )
);


const staleContactFiles = [];


function scanForOldContact(dir) {

  for (
    const entry of fs.readdirSync(
      dir,
      { withFileTypes: true }
    )
  ) {

    const fullPath = `${dir}/${entry.name}`;

    if (entry.isDirectory()) {
      scanForOldContact(fullPath);
      continue;
    }

    if (
      !/\.(?:ts|tsx|js|mjs|json)$/.test(
        entry.name
      )
    ) {
      continue;
    }

    const source = fs.readFileSync(
      fullPath,
      'utf8'
    );

    if (
      source.includes(
        'anjanpatel325@gmail.com'
      )
    ) {
      staleContactFiles.push(fullPath);
    }
  }
}


scanForOldContact('src');


check(
  'old public contact email removed from src',
  staleContactFiles.length === 0
);


if (failures.length) {

  console.error(
    'AJN PDF R17 TRUST/SEO VERIFIER: FAIL'
  );

  failures.forEach(
    (item) => console.error(`- ${item}`)
  );

  process.exit(1);
}


console.log(
  'AJN PDF R17 TRUST/SEO VERIFIER: PASS'
);
