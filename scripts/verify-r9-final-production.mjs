import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ids = ["merge-pdf", "split-pdf", "compress-pdf", "rotate-pdf", "delete-pdf-pages", "organize-pdf", "crop-pdf", "watermark-pdf", "page-number", "flatten-pdf", "protect-pdf", "unlock-pdf", "repair-pdf", "compare-pdf", "add-text", "add-image-to-pdf", "pdf-metadata", "png-to-pdf", "extract-images", "image-reducer", "image-resizer", "crop-image", "rotate-image", "watermark-image", "flip-image", "convert-image", "meme-generator", "photo-editor", "sign-pdf", "pdf-text", "pdf-zip-extract", "zip-extractor", "subtitle-generator", "image-to-pdf", "jpg-to-pdf", "jpeg-to-pdf", "webp-to-pdf", "tiff-to-pdf", "bmp-to-pdf", "gif-to-pdf", "svg-to-pdf", "heic-to-pdf", "pdf-to-image", "pdf-to-jpg", "pdf-to-jpeg", "pdf-to-png", "pdf-to-webp", "pdf-to-tiff", "pdf-to-bmp", "pdf-to-gif", "pdf-to-svg", "pdf-to-heic", "pdf-pages-to-zip", "pdf-to-word", "pdf-to-docx", "pdf-to-txt", "pdf-to-rtf", "pdf-to-odt", "pdf-to-html", "pdf-to-markdown", "pdf-to-xml", "pdf-to-json", "pdf-to-csv", "pdf-to-excel", "pdf-to-xlsx", "pdf-to-powerpoint", "pdf-to-pptx", "pdf-to-epub", "pdf-to-mobi", "pdf-to-azw3", "word-to-pdf", "doc-to-pdf", "docx-to-pdf", "txt-to-pdf", "rtf-to-pdf", "odt-to-pdf", "ods-to-pdf", "odp-to-pdf", "html-to-pdf", "url-to-pdf", "markdown-to-pdf", "xml-to-pdf", "json-to-pdf", "csv-to-pdf", "excel-to-pdf", "xls-to-pdf", "xlsx-to-pdf", "powerpoint-to-pdf", "ppt-to-pdf", "pptx-to-pdf", "epub-to-pdf", "mobi-to-pdf", "azw3-to-pdf", "eml-to-pdf", "msg-to-pdf"];
const failures = [];
const pass = (m) => console.log(`PASS: ${m}`);
const fail = (m) => failures.push(m);
const full = (r) => path.join(root,r);
const exists = (r) => fs.existsSync(full(r));
const text = (r) => fs.readFileSync(full(r),'utf8');
const requireText = (r, markers) => { if(!exists(r)){fail(`${r} missing`);return '';} const s=text(r); for(const x of markers) if(!s.includes(x)) fail(`${r} missing ${x}`); return s; };

if(ids.length!==107 || new Set(ids).size!==107) fail('Production tool id contract is not 107 unique ids'); else pass('107 unique production tool ids retained');

const artwork=requireText('src/components/ajn/tool-artwork.tsx',['specialIcons','getConversion','data-tool-icon={toolId}','border-slate-200 bg-white']);
const special=[...artwork.matchAll(/\n\s*'([^']+)':\s*([A-Za-z0-9_]+),/g)].filter(m=>ids.includes(m[1]));
if(new Set(special.map(m=>m[1])).size!==34) fail('Expected 34 dedicated action icon mappings'); else pass('34 dedicated action icons retained');
if(exists('public/tool-icons') && fs.readdirSync(full('public/tool-icons')).some(n=>/\.(png|jpe?g|webp)$/i.test(n))) fail('Legacy raster card icons remain'); else pass('Legacy raster card icon artwork removed');

const grid=requireText('src/components/landing/services-grid.tsx',['Comfortable','Compact','List','SEARCH_EXPANSIONS','distanceAtMostTwo','INTENT_IDS']);
if(!/min-h-\[(?:7[8-9]|8[0-9])px\]/.test(grid)) fail('Tool cards lost the compact mobile minimum-height guard');
for(const old of ['2 × 2','4 × 4','Horizontal']) if(grid.includes(old)) fail(`Old layout label remains: ${old}`);
pass('Adaptive Comfortable / Compact / List directory and ranked search source present');

const page=requireText('src/app/page.tsx',["{ id: ''","{ id: 'edit'","{ id: 'organize'","{ id: 'security'",'<HowItWorks />','<FeatureShowcase />','<TrustSecurity />','<FAQSection />']);
for(const old of ['<VisualStories />','<ToolCategories />','<Workflows />','<FormatStrip />']) if(page.includes(old)) fail(`Homepage still renders removed long-form section ${old}`);
pass('Homepage is shorter and keeps focused discovery, workflow, trust and FAQ sections');

requireText('src/i18n/locales/en.json',['Free PDF Tools Online - Convert, Merge, Compress, Edit & ','100+ tools to convert']);
const heroUi=text('src/components/landing/hero.tsx')+text('src/components/landing/mobile-home-hero.tsx');
if(heroUi.includes('PremiumBackground')) fail('Hero still mounts decorative premium background shapes'); else pass('Hero no longer mounts wave/blob background shapes');

const shapes=['ajn-dropzone-orb','ajn-story-wave','ajn-r8-wave','ajn-r8-showcase-wave','ajn-r8-security-wave','ajn-liquid-orb'];
let source=''; for(const r of ['src/components/landing/hero.tsx','src/components/landing/mobile-home-hero.tsx','src/components/landing/feature-showcase.tsx','src/components/landing/trust-security.tsx','src/components/landing/visual-stories.tsx','src/components/ajnpdf/file-dropzone.tsx']) source+=text(r);
for(const x of shapes) if(source.includes(x)) fail(`Visible decorative shape remains: ${x}`);
const css=text('src/app/globals.css');
const backdrop=text('src/components/dashboard/night-sky.tsx');
const servicesCatalog=text('src/components/services/services-catalog.tsx');
if(css.includes('radial-gradient(circle') || /ajn-(wave|ring-field|dot-field|premium-glow|polished-glow)/.test(css) || /ajn-page-wave|<svg/i.test(backdrop) || servicesCatalog.includes('radial-gradient(circle')) fail('Decorative wave/circle/radial background source remains'); else pass('Decorative wave/circle/radial background layers are removed from public surfaces');
for(const deadVisual of ['src/lib/placeholder-images.json','src/lib/placeholder-images.ts','public/images/ajn-product-visual.svg','public/images/ajn-processing-architecture.svg']) if(exists(deadVisual)) fail(`Unused legacy visual remains: ${deadVisual}`);
pass('Unused legacy promotional/architecture visual assets are removed');
const skeleton=text('src/components/ajnpdf/professional-skeleton.module.css'); const deadThemeFiles=['src/components/theme/theme-toggle.tsx','src/components/premium/premium-background.tsx','src/components/ajnpdf/tool-layout.tsx']; if(css.includes('.dark ')||skeleton.includes(':global(.dark)')||deadThemeFiles.some(exists)) fail('Dead dark/theme layout source remains'); else pass('Light-only public source and dead theme/layout code are cleaned');

const provider=requireText('src/components/ajnpdf/processing-activity-provider.tsx',['progressPct','engine.cancelJob','AbortController','processing.fullStagePrepare','processing.fullStageProcess','processing.fullStageReady','role="progressbar"']);
for(const fake of ['phaseForElapsed','elapsed <','22_000','0 sec']) if(provider.includes(fake)) fail(`Processing overlay contains timer-driven stage logic: ${fake}`);
for(const cls of ['wave','circle']) if(text('src/components/ajnpdf/processing-activity-provider.module.css').toLowerCase().includes(cls)) fail(`Processing CSS contains decorative ${cls} styling`);
for(const l of ['en','hi','te','ta','kn']) requireText(`src/i18n/locales/${l}.json`,['processing.fullWorkspace','processing.fullProcessingTitle','processing.fullReadyTitle','processing.fullErrorTitle']);
pass('Processing overlay uses localized truthful stages, determinate progress when available, and supported cancellation');

for(const f of ['MergePdf.tsx','SplitPdf.tsx','CompressPdf.tsx','ImageToPdfTool.tsx','PdfToJpg.tsx']){const s=text('src/components/junction/'+f);if(!s.includes('withProcessingActivity'))fail(`${f} missing shared full-page lifecycle`);}
for(const f of ['SmartRead.tsx','MemeMaker.tsx','ResizeImage.tsx','ReduceImage.tsx']){const s=text('src/components/junction/'+f);if(/setInterval|setProgress\([^)]*\+|for\s*\([^)]*setTimeout/.test(s))fail(`${f} still contains simulated progress`);}
const crop=requireText('src/components/junction/CropPdf.tsx',['page.getViewport({scale:1})','setCropBox','updateToolProcessing']);
for(const x of ["engine.runTool('split-pdf')",'8.42','5.95','rounded-[4rem]','Synthesizing preview']) if(crop.includes(x)) fail(`Crop PDF legacy logic/UI remains: ${x}`);
pass('Core direct tools and Crop PDF use the R9 processing/logic model');

const shared=requireText('src/components/junction/_shared.tsx',['copied-link','result.shareFile','result.toolLinkCopied','withProcessingActivity','updateToolProcessing']);
if(shared.includes('processingMode?:')) fail('Dead ToolWorkspace/Done processingMode API remains'); else pass('Result sharing distinguishes file share from copied tool link');

const junctionDir=full('src/components/junction');
for(const name of fs.readdirSync(junctionDir).filter(n=>n.endsWith('.tsx'))){const s=fs.readFileSync(path.join(junctionDir,name),'utf8');for(const x of ['rounded-[4rem]','rounded-[3rem]','rounded-[2.5rem]'])if(s.includes(x))fail(`${name} still uses legacy oversized ${x} surface`);}
pass('Legacy giant 2.5–4rem tool surface radii removed');

const publicCopy=[...['en','hi','te','ta','kn'].map(l=>text(`src/i18n/locales/${l}.json`)),...fs.readdirSync(junctionDir).filter(n=>n.endsWith('.tsx')).map(n=>fs.readFileSync(path.join(junctionDir,n),'utf8'))].join('\n');
for(const phrase of ['Runs in your browser','Uses temporary processing','Processed in this browser','Synthesizing preview','Scraping high-fidelity nodes','Optimizing pixel matrix','INTELLIGENT RASTER COMPRESSION','ADVANCED VISION & ASSET EXTRACTION','UNIVERSAL PAGE ARCHIVING']) if(publicCopy.includes(phrase)) fail(`Unpolished public phrase remains: ${phrase}`);
pass('Primary public tool copy avoids the audited developer-style phrases');

const toolRoute=requireText('src/app/(tool-pages)/[id]/page.tsx',["'@type': 'WebApplication'","'@type': 'BreadcrumbList'",'generateMetadata']);
for(const x of ["'@type': 'FAQPage'","'@type': 'HowTo'","totalTime: 'PT5M'"]) if(toolRoute.includes(x)) fail(`Unsupported/invented tool schema remains: ${x}`);
const rootLayout=requireText('src/app/layout.tsx',['Free PDF Tools Online - Convert, Merge, Compress & Edit | AJN PDF','NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION']);
if(rootLayout.includes('SearchAction')) fail('Inaccurate WebSite SearchAction remains');
const strategy=requireText('src/lib/seo-strategy.ts',['PRIORITY_TITLES','buildNaturalDescription','| AJN PDF']);
if(strategy.includes("'Free PDF Tools Online - Convert, Merge, Compress & Edit | AJN PDF'")) fail('Tool SEO strategy duplicates the root homepage title');
requireText('src/app/robots.ts',['sitemap.xml','image-sitemap.xml']);
requireText('src/app/sitemap.ts',['BUILD_PUBLIC_TOOLS','`${SITE_URL}${toolPath(tool.id)}`']);
pass('SEO source keeps unique metadata, canonicals, sitemap/robots and accurate structured data');

requireText('src/components/adsense-unit.tsx',['data-ad-status',"adStatus === 'unfilled'",'MutationObserver']);
pass('Unfilled ad slots can collapse after AdSense reports no inventory');

const installedGitRepo = exists('.git');
const sourceCapabilityManifest = exists('src/generated/backend-capabilities.json');
const publicCapabilityManifest = exists('public/backend-capabilities.json');
if (!installedGitRepo && (sourceCapabilityManifest || publicCapabilityManifest)) {
  fail('R9 release must not ship fabricated/stale backend capability manifests');
} else if (installedGitRepo) {
  if (!sourceCapabilityManifest || !publicCapabilityManifest) {
    fail('Installed repository must retain both live backend capability manifests');
  } else {
    pass('Installed repository retained live backend capability manifests; verify:capabilities validates their contents');
  }
}
if(!exists('R9_TARGET_CAPABILITY_MANIFEST_POLICY.md')) fail('Target capability manifest policy missing'); else pass('R9 preserves the target repository capability manifest as source of truth');

if(failures.length){for(const f of failures)console.error('FAIL:',f);console.error(`AJN PDF R9 verification failed with ${failures.length} issue(s).`);process.exit(1);}
console.log('AJN PDF R9 FINAL CONSISTENCY / LOGIC / SEO SOURCE AUDIT: PASS');
