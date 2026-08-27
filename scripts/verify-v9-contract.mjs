import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root,p),"utf8");
const fail = message => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
const pass = message => console.log(`PASS: ${message}`);

const expected = [
  "add-image-to-pdf","add-text","compare-pdf","compress-pdf","crop-pdf",
  "delete-pdf-pages","extract-images","flatten-pdf","merge-pdf","organize-pdf",
  "page-number","pdf-metadata","pdf-zip-extract","protect-pdf","repair-pdf",
  "rotate-pdf","sign-pdf","split-pdf","unlock-pdf","watermark-pdf"
];

const policy = read("src/lib/tool-policy.ts");
for (const id of expected) if (!policy.includes(`'${id}'`) && !policy.includes(`"${id}"`)) fail(`missing public tool id ${id}`);
const publicBlock = policy.match(/PRODUCTION_PUBLIC_TOOL_IDS\s*=\s*new Set\(\[([\s\S]*?)\]\)/)?.[1] || "";
const ids = [...publicBlock.matchAll(/['"]([^'"]+)['"]/g)].map(m=>m[1]);
if (ids.length !== 20) fail(`public tool allowlist must be exactly 20; found ${ids.length}`); else pass("exactly 20 public PDF tools");

const compress = read("src/components/junction/CompressPdf.tsx");
for (const forbidden of ["Compression level","Higher quality","Balanced","Strong","grayscale"]) {
  if (compress.toLowerCase().includes(forbidden.toLowerCase())) fail(`Compress PDF still contains ${forbidden}`);
}
for (const required of ["Target PDF size","Compress to target size","TARGET_FLOOR_RATIO"]) {
  if (!compress.includes(required)) fail(`Compress PDF missing ${required}`);
}
pass("Compress PDF is target-size-only");
const toolsData = read("src/lib/tools-data.ts");
if (toolsData.includes("presets or an approximate target size")) {
  fail("Compress PDF directory copy still advertises retired presets");
} else {
  pass("Compress PDF directory copy matches target-size workflow");
}

const toolArtwork = read("src/components/ajn/tool-artwork.tsx");
if (!toolArtwork.includes("specialIcons[toolId] ? null : getConversion(toolId)")) {
  fail("dedicated tool icons do not take precedence over generic conversion parsing");
} else {
  pass("dedicated tool icons take precedence over generic conversion parsing");
}

const pricing = read("src/app/pricing/page.tsx");
if (!pricing.includes('49') || !pricing.includes('399')) fail("pricing fallbacks must be ₹49 / ₹399");
if (/Business plans|organization billing|self-serve Business/i.test(pricing)) fail("unsupported Business marketing remains on pricing");
const pricingVisibleText = [
  ...pricing.matchAll(/>([^<>{}]*Razorpay[^<>{}]*)</gi),
].map(match => match[1]).join("\n");
const pricingMetadataProvider =
  /(?:title|description)\s*:\s*(?:\{[^}]*\}\s*)?["''`][^"''`]*Razorpay[^"''`]*["''`]/i.test(pricing);
if (pricingVisibleText || pricingMetadataProvider) {
  fail("provider name appears in customer-facing pricing copy");
}
pass("pricing is Free + Premium with ₹49/₹399 fallbacks");

const account = read("src/app/account/page.tsx");
for (const legacy of ["/desktop","/mobile","/developers","AJN API","AJN Sign"]) if (account.includes(legacy)) fail(`legacy account product link remains: ${legacy}`);
pass("account is PDF/Premium focused");

const sitemap = read("src/app/sitemap.ts");
for (const stale of ["/desktop","/mobile","/developers","/chrome-extension","/discover","/status"]) if (sitemap.includes(`"${stale}"`) || sitemap.includes(`'${stale}'`)) fail(`stale sitemap route ${stale}`);
pass("sitemap is focused on PDF/legal/content pages");

const footer = read("src/components/landing/main-footer.tsx");
for (const fake of ["200K","ProcessedPdfCounter","Systems operational","Demo"]) if (footer.includes(fake)) fail(`footer still contains unverified trust text: ${fake}`);
pass("footer has no demo counter/static operational claim");

const sourceFiles = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    const p = path.join(dir,ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|jsx|mdx)$/.test(ent.name)) sourceFiles.push(p);
  }
}
walk(path.join(root,"src"));
const stalePhrases = [
  "Use balanced compression for resumes and office documents.",
  "Use high quality for print files and small text.",
  "ADD I",
];
for (const p of sourceFiles) {
  const text = fs.readFileSync(p,"utf8");
  for (const phrase of stalePhrases) if (text.includes(phrase)) fail(`${phrase} remains in ${path.relative(root,p)}`);
  if (text.includes('"Shrink"') || text.includes("'Shrink'")) fail(`stale exact Shrink label remains in ${path.relative(root,p)}`);
}
pass("stale Compress/editorial placeholders removed");

const globals = read("src/app/globals.css");
if (!globals.includes("#0a101d") || !globals.includes("#111827") || !globals.includes("#b6c0d0")) fail("V9 dark semantic tokens missing");
if (/linear-gradient|radial-gradient/.test(globals)) fail("gradient remains in consolidated public globals.css");
pass("solid semantic light/dark theme installed");

if (process.exitCode) process.exit(process.exitCode);
console.log("AJN PDF V9 CONTRACT: PASS");
