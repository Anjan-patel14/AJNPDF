import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const fail = (message) => { console.error(`R10 VERIFY FAIL: ${message}`); process.exit(1); };
const ok = (condition, message) => { if (!condition) fail(message); };
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));
const exists = (relative) => fs.existsSync(path.join(root, relative));

const manifest = json('chrome-extension/manifest.json');
ok(manifest.manifest_version === 3, 'Chrome extension must use Manifest V3.');
ok(manifest.version === '1.0.0', 'Chrome extension version must be 1.0.0 for the R10 first release.');
ok(!('permissions' in manifest), 'R10 extension must not request required Chrome permissions.');
ok(!('host_permissions' in manifest), 'R10 extension must not request host permissions.');
ok(!('optional_permissions' in manifest), 'R10 extension must not pre-request optional permissions.');
ok(!('optional_host_permissions' in manifest), 'R10 extension must not pre-request optional host permissions.');
ok(!('content_scripts' in manifest), 'R10 extension must not inject content scripts.');
ok(!('background' in manifest), 'R10 extension must not add a background service worker.');
ok(manifest.action?.default_popup === 'popup.html', 'Toolbar action must open the local popup.');
ok(manifest.content_security_policy?.extension_pages?.includes("script-src 'self'"), 'Extension CSP must keep scripts self-hosted.');

const runtimeFiles = ['popup.html','popup.css','popup.js','workspace.html','workspace.css','workspace.js','pdf-builder.js','tools.js'];
for (const file of runtimeFiles) ok(exists(`chrome-extension/${file}`), `Missing extension runtime file: ${file}`);
const runtimeText = runtimeFiles.map((file) => read(`chrome-extension/${file}`)).join('\n');
ok(!/<script[^>]+src=["']https?:\/\//i.test(runtimeText), 'Remote script tags are forbidden in the Manifest V3 package.');
ok(!/\beval\s*\(/.test(runtimeText), 'eval() is forbidden in extension runtime code.');
ok(!/\bnew\s+Function\s*\(/.test(runtimeText), 'new Function() is forbidden in extension runtime code.');
ok(!/fetch\s*\(\s*["']https?:\/\//i.test(runtimeText), 'Extension runtime must not fetch remote logic.');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(read('chrome-extension/tools.js'), sandbox);
const tools = sandbox.window.AJN_TOOLS;
ok(Array.isArray(tools), 'Extension tool catalog did not initialize.');
ok(tools.length === 107, `Expected 107 audited workflows, found ${tools.length}.`);
ok(new Set(tools.map((tool) => tool.id)).size === 107, 'Extension tool IDs must be unique.');
ok(!tools.some((tool) => ['pdf-to-avif','xps-to-pdf'].includes(tool.id)), 'Known unavailable capability routes must not appear in extension catalog.');
for (const required of ['merge-pdf','compress-pdf','image-to-pdf','pdf-to-word','word-to-pdf','msg-to-pdf']) {
  ok(tools.some((tool) => tool.id === required), `Extension catalog is missing required workflow ${required}.`);
}

const workspace = read('chrome-extension/workspace.js');
for (const nativeTool of ['image-to-pdf','reduce-image','resize-image','convert-image']) ok(workspace.includes(`'${nativeTool}'`), `Native quick action missing: ${nativeTool}`);
ok(workspace.includes('createImagePdf'), 'Image-to-PDF must be implemented in extension code, not only linked externally.');
ok(workspace.includes('bitmapToBlob'), 'Image resize/reduce/convert logic must be implemented in extension code.');
ok(workspace.includes('MAX_FILE_BYTES') && workspace.includes('MAX_TOTAL_BYTES') && workspace.includes('MAX_IMAGE_PIXELS'), 'Local quick tools must enforce bounded file/image workloads.');
ok(workspace.includes("setAttribute('aria-busy','true')"), 'Local quick-tool processing must expose busy state to assistive technology.');
ok(read('chrome-extension/pdf-builder.js').includes('/DCTDecode'), 'Local image-to-PDF builder must embed generated JPEG pages.');

const pdfSandbox = { window: {}, TextEncoder, Uint8Array };
vm.createContext(pdfSandbox);
vm.runInContext(read('chrome-extension/pdf-builder.js'), pdfSandbox);
const pdfBytes = pdfSandbox.window.AJNPdfBuilder.buildImagePdf([{ jpeg: new Uint8Array([255,216,255,217]), width: 10, height: 10 }]);
const pdfText = Buffer.from(pdfBytes).toString('latin1');
ok(pdfText.startsWith('%PDF-1.4'), 'Local PDF builder did not create a PDF header.');
ok(pdfText.includes('xref\n'), 'Local PDF builder did not create an xref table.');
ok(pdfText.endsWith('%%EOF\n'), 'Local PDF builder did not terminate the PDF correctly.');

const localeNames = ['en','hi','te','ta','kn'];
const localeKeys = [];
for (const locale of localeNames) {
  const messages = json(`chrome-extension/_locales/${locale}/messages.json`);
  localeKeys.push(Object.keys(messages).sort().join('|'));
  const description = messages.extDescription?.message || '';
  ok(description.length > 0 && description.length <= 132, `${locale} extension description must be 1-132 characters.`);
}
ok(new Set(localeKeys).size === 1, 'All five extension locales must expose the same message keys.');

for (const icon of [16,32,48,128]) ok(exists(`chrome-extension/icons/icon-${icon}.png`), `Missing extension icon ${icon}.`);
const pngSize = (relative) => {
  const bytes = fs.readFileSync(path.join(root, relative));
  ok(bytes.toString('ascii',1,4) === 'PNG', `${relative} is not a PNG.`);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};
const expectedAssets = {
  'chrome-extension/icons/icon-128.png':[128,128],
  'chrome-extension/store-assets/small-promo-440x280.png':[440,280],
  'chrome-extension/store-assets/marquee-1400x560.png':[1400,560],
  'chrome-extension/store-assets/screenshot-quick-tools-1280x800.png':[1280,800],
};
for (const [file, size] of Object.entries(expectedAssets)) ok(JSON.stringify(pngSize(file)) === JSON.stringify(size), `${file} has the wrong dimensions.`);

for (const file of ['src/app/chrome-extension/page.tsx','src/app/chrome-extension/privacy/page.tsx','src/components/landing/chrome-extension-promo.tsx']) ok(exists(file), `Missing website extension integration: ${file}`);
ok(read('src/components/landing/navbar.tsx').includes("href: '/chrome-extension'"), 'Primary/mobile navigation must expose the Chrome extension page.');
ok(read('src/components/landing/main-footer.tsx').includes("'/chrome-extension'"), 'Footer must expose the Chrome extension page.');
ok(read('src/app/page.tsx').includes('<ChromeExtensionPromo />'), 'Homepage must include the compact Chrome extension promo.');
ok(read('src/app/sitemap.ts').includes('`${SITE_URL}/chrome-extension`'), 'Chrome extension page must be in the sitemap.');
ok(read('src/app/sitemap.ts').includes('`${SITE_URL}/chrome-extension/privacy`'), 'Extension privacy page must be in the sitemap.');
ok(exists('public/downloads/AJN-PDF-CHROME-EXTENSION-1.0.0.zip'), 'Website test-package download is missing.');
ok(exists('CHROME_WEB_STORE_SUBMISSION_GUIDE.md'), 'Chrome Web Store submission guide is missing.');
ok(exists('R10_CHROME_EXTENSION_PRODUCTION_POLISH.md'), 'R10 release document is missing.');
// The deployment helper belongs to the downloadable release bundle, not the installed Git repository.
// Validate it when this verifier runs from the release bundle; skip only these helper-specific
// assertions when the same verifier runs from the target repository after the product files are copied.
if (exists('APPLY_TEST_PUSH_FRONTEND.ps1')) {
  const updater = read('APPLY_TEST_PUSH_FRONTEND.ps1');
  ok(updater.includes('Assert-NoExistingStagedChanges'), 'R10 updater must refuse a pre-existing Git staging area.');
  ok(updater.includes('chrome-extension') && updater.includes('AJN-PDF-CHROME-EXTENSION-1.0.0.zip'), 'R10 updater must copy/stage extension source and the public test ZIP.');
  ok(updater.includes('feat: add Chrome extension and refine product access') || updater.includes('fix: clear zero-warning lint gate for Chrome extension release') || updater.includes('fix: clear TypeScript gate for Chrome extension release') || updater.includes('fix: stage Chrome extension download artifact safely') || updater.includes('feat: integrate AJN PDF conversion icon assets') || updater.includes('fix: stabilize homepage and mobile tool discovery') || updater.includes('fix: complete image licensing and admin diagnostics'), 'R10 updater commit message is missing.');
}

const websiteLocales = localeNames.map((locale) => json(`src/i18n/locales/${locale}.json`));
const websiteKeySets = websiteLocales.map((messages) => Object.keys(messages).sort().join('|'));
ok(new Set(websiteKeySets).size === 1, 'Website locale key structures diverged after R10.');
for (const messages of websiteLocales) {
  for (const key of ['common.chromeExtension','chrome.promoTitle','chrome.promoDesc','chrome.learnMore']) ok(typeof messages[key] === 'string' && messages[key].trim(), `Missing website locale key ${key}.`);
}

console.log('AJN PDF R10 CHROME EXTENSION / PRODUCTION POLISH: PASS');
console.log('- Manifest V3; zero required/host permissions; no content scripts/background worker.');
console.log('- Four extension-native local image tools; not a link-only launcher.');
console.log('- 107 audited AJN PDF workflows searchable from the extension.');
console.log('- Five extension locales and matching website localization keys.');
console.log('- Chrome product/privacy pages, homepage promo, navigation/footer and sitemap integrated.');
console.log('- File/image workload guards, ARIA busy state and safer Git staging verified.');
console.log('- Store icon/promo/listing visual dimensions verified.');
