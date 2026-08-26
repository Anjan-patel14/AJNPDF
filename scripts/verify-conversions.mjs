import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
let failed = false;
const pass = (message) => console.log(`PASS: ${message}`);
const fail = (message) => { failed = true; console.error(`FAIL: ${message}`); };

const frontend = read('src/lib/conversion-tools.ts');
const backend = read('backend/app/conversion_engine.py');
const backendMain = read('backend/app/main.py');
const workspace = read('src/components/junction/tool-workspace-client.tsx');
const component = read('src/components/junction/ServerConversionTool.tsx');
const policy = read('src/lib/tool-policy.ts');
const sitemap = read('src/app/sitemap.ts');
const setupWrapper = read('SETUP_FULL_PRODUCTION.ps1');
const productionRunner = read('R16_PRODUCTION_SETUP_AND_DEPLOY.ps1');
const setup = `${setupWrapper}\n${productionRunner}`;
const nextConfig = read('next.config.ts');

const ids = [...frontend.matchAll(/tool\('([^']+)'/g)].map((match) => match[1]);
if (ids.length >= 70) pass(`${ids.length} conversion and  tools registered`); else fail(`Expected at least 70 conversion tools, found ${ids.length}`);
if (ids.length === new Set(ids).size) pass('Conversion IDs are unique'); else fail('Duplicate conversion IDs found');
for (const id of ids) if (!backend.includes(`"${id}"`)) fail(`${id} is missing from the Python conversion registry`);
if (!failed) pass('Every conversion tool is represented in the Python registry');

for (const expected of [
  'pdf-to-docx', 'pdf-to-xlsx', 'pdf-to-pptx', 'pdf-to-epub',
  'docx-to-pdf', 'xlsx-to-pdf', 'pptx-to-pdf', 'ods-to-pdf', 'odp-to-pdf', 'eml-to-pdf', 'msg-to-pdf', 'xps-to-pdf']) frontend.includes(`'${expected}'`) ? pass(`Required tool ${expected}`) : fail(`Missing required tool ${expected}`);

workspace.includes('SERVER_CONVERSION_IDS') && workspace.includes('ServerConversionTool') ? pass('Generic conversion workspace routing enabled') : fail('Generic conversion workspace routing missing');
component.includes('convertOnServer') && component.includes('getConversionToolManifest') ? pass('Conversion UI uses live backend manifest and processing endpoint') : fail('Conversion UI backend integration missing');
component.includes('language') && component.includes('dpi') && component.includes('quality') ? pass(' and image conversion options enabled') : fail('Conversion options incomplete');
policy.includes('conversionBackendIds') && policy.includes('maxFileSizeMb: 75') ? pass('Conversion policy and limits configured') : fail('Conversion policy is incomplete');
backendMain.includes('/api/convert/{tool_id}') && backendMain.includes('/api/tools') ? pass('Conversion and capability endpoints present') : fail('Conversion API endpoints missing');
backendMain.includes('/api/admin/analytics') && backendMain.includes('sqlite3') ? pass('Optional anonymous SQLite analytics enabled') : fail('Analytics endpoint missing');
backendMain.includes('PROCESSING_TIMEOUT_SECONDS') && backendMain.includes('MAX_TOTAL_BYTES') ? pass('Timeout and total upload limits configured') : fail('Backend limits missing');
backend.includes('_validate_public_url') && backend.includes('ipaddress.ip_address') && backend.includes('allow_redirects=False') && backend.includes('max_bytes') ? pass('URL to PDF blocks private networks, unsafe redirects and oversized pages') : fail('URL to PDF network safety is incomplete');
backend.includes('available_recognition_languages') && component.includes('recognitionLanguages') ? pass(' language choices follow installed backend language data') : fail(' language capability discovery is missing');
backend.includes('-source-') && backend.includes('-page-') && backend.includes('merged.insert_pdf') ? pass('Searchable PDF  uses project work files and deterministic merging') : fail('Searchable PDF  still relies on fragile temporary output handling');
!backend.includes('image_to_pdf_or_hrecognition') ? pass('Fragile  temporary PDF helper removed') : fail('Fragile  temporary PDF helper is still present');
backend.includes('tessedit_create_pdf=1') && !backend.includes('\"pdf\",\n                    ],') ? pass('Searchable PDF does not require the optional  pdf config file') : fail('Searchable PDF still depends on a  pdf config file');
backend.includes('if name == \"libreoffice\" and os.name == \"nt\"') && backend.includes('soffice.exe') ? pass('Windows LibreOffice prefers soffice.exe over the console wrapper') : fail('Windows LibreOffice executable preference is missing');
backend.includes('_terminate_process_tree') && backend.includes('LibreOffice conversion failed after retry') ? pass('LibreOffice timeout cleanup and retry are enabled') : fail('LibreOffice timeout recovery is incomplete');
backend.includes('("HEIF" if fmt == "heic"') ? pass('HEIC output uses the HEIF encoder') : fail('HEIC encoder mapping is incorrect');
backendMain.includes('_record_event') && !backendMain.includes('filename TEXT') && !backendMain.includes('ip_address TEXT') && backendMain.includes('\"ip_addresses_stored\": False') ? pass('Analytics excludes filenames and stored IP addresses') : fail('Analytics data minimization check failed');

for (const page of ['conversion-tools', 'image-tools', 'pdf-utilities']) {
  fs.existsSync(path.join(root, 'src/app', page, 'page.tsx')) ? pass(`SEO category page /${page}`) : fail(`Missing category page /${page}`);
  sitemap.includes(`/${page}`) ? pass(`Sitemap includes /${page}`) : fail(`Sitemap missing /${page}`);
}

for (const removedText of ['Temporary server tools', '2 modes', 'Browser and temporary server', 'Python backend health', 'A real request is made to the configured health endpoint.', 'Processing transparency']) {
  const publicFiles = [
    'src/app/about/page.tsx', 'src/app/status/page.tsx', 'src/app/transparency/page.tsx',
    'src/components/landing/hero.tsx', 'src/components/landing/main-footer.tsx'].map(read).join('\n');
  publicFiles.includes(removedText) ? fail(`Removed public text still present: ${removedText}`) : pass(`Removed obsolete text: ${removedText}`);
}

setup.includes('backend\\smoke_test.py') &&
setup.includes('@("run","check")') &&
setupWrapper.includes('R16_PRODUCTION_SETUP_AND_DEPLOY.ps1')
  ? pass('Full setup delegates to R16 runner with backend smoke tests and frontend checks')
  : fail('Setup validation workflow incomplete');
setup.includes('backend\\tessdata') &&
setup.includes('TESSDATA_PREFIX') &&
setup.includes('backend\\capability_audit.py')
  ? pass('Windows setup validates bundled/system  language capability')
  : fail(' language setup is missing');
function hasLegacyToolRedirect(legacy, canonical) {
  const inline =
    nextConfig.includes(`/tools/${legacy}`) &&
    nextConfig.includes(`/${canonical}`);

  const centralized =
    nextConfig.includes('legacyToolAliases') &&
    (
      nextConfig.includes(`'${legacy}': '${canonical}'`) ||
      nextConfig.includes(`"${legacy}": "${canonical}"`)
    );

  return inline || centralized;
}

for (const [legacy, canonical] of [['jpg-pdf','jpg-to-pdf'], ['pdf-jpg','pdf-to-jpg'], ['heic-pdf','heic-to-pdf'], ['xml-pdf','xml-to-pdf'], ['json-pdf','json-to-pdf'], ['txt-pdf','txt-to-pdf']]) {
  hasLegacyToolRedirect(legacy, canonical)
    ? pass(`Legacy alias ${legacy} redirects to ${canonical}`)
    : fail(`Missing canonical redirect for ${legacy}`);
}

if (failed) process.exit(1);
console.log('AJN PDF conversion platform verification completed successfully.');
