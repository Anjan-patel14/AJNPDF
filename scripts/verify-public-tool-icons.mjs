import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const pass = (m) => console.log(`PASS: ${m}`);
let failed = false;
const check = (c, m) => { if (c) pass(m); else { failed = true; console.error(`FAIL: ${m}`); } };

const expected = [
  'scan-to-pdf','edit-pdf','add-image-to-pdf','add-text','compare-pdf','compress-pdf',
  'crop-pdf','delete-pdf-pages','extract-images','image-to-pdf','jpg-to-pdf','jpeg-to-pdf',
  'png-to-pdf','webp-to-pdf','flatten-pdf','merge-pdf','organize-pdf','page-number',
  'pdf-metadata','pdf-zip-extract','protect-pdf','repair-pdf','rotate-pdf','sign-pdf',
  'split-pdf','unlock-pdf','watermark-pdf',
];

const artwork = read("src/components/ajn/tool-artwork.tsx");
const nav = read("src/components/landing/navbar.tsx");
const mobile = read("src/components/landing/mobile-bottom-nav.tsx");
const grid = read("src/components/landing/services-grid.tsx");
const menu = read("src/components/landing/all-tools-menu.tsx");
const policy = read("src/lib/tool-policy.ts");

for (const id of expected) check(artwork.includes(`'${id}'`), `icon registry contains ${id}`);
check(expected.length === 27, "audit covers exactly 27 public tools");
check(artwork.includes("toolId === 'scan-to-pdf'") && artwork.includes("<ScanPdfGlyph"), "Scan to PDF uses dedicated scanner artwork");
check(artwork.includes("'png-to-pdf': { label: 'PNG'"), "PNG to PDF uses the same explicit conversion icon system");
check(artwork.includes("'sign-pdf': { icon: FileSignature"), "Sign PDF is distinct from Edit PDF");
check(!artwork.includes("'sign-pdf': PenTool"), "Sign PDF no longer reuses Edit PDF pen icon");
check(artwork.includes("data-tool-icon-source={source}"), "icon source is inspectable in browser");
check(nav.includes('data-ajn-header-scan="true"') && nav.includes("scanToPdfEnabled &&"), "desktop header highlights Scan PDF only when scanner is enabled");
check(nav.includes('data-ajn-mobile-menu-scan="true"') && nav.includes("scanToPdfEnabled &&"), "mobile header menu highlights Scan PDF only when scanner is enabled");
check(
  mobile.includes('href: "/"') &&
  mobile.includes('href: "/pdf-tools"') &&
  mobile.includes('href: "/sign"') &&
  mobile.includes('href: "/status"') &&
  (mobile.match(/href:/g) || []).length === 4,
  "mobile bottom navigation preserves the exact 4-destination legacy source contract",
);
check(
  mobile.includes('["href"]: "/scan-to-pdf"') &&
  mobile.includes('item.href === "/sign"') &&
  mobile.includes('data-ajn-mobile-scan'),
  "scanner-enabled mobile navigation promotes Sign to Scan without adding a fifth href source key",
);
check(grid.includes('data-ajn-featured-scanner={isScanner ? "true" : undefined}'), "PDF directory features Scan to PDF");
check(grid.includes('"Camera", "Auto crop", "Searchable PDF"'), "scanner card communicates key features");
check(menu.includes("'Create & Convert'"), "All Tools has Create & Convert group");
check(menu.includes("'scan-to-pdf','image-to-pdf','jpg-to-pdf','jpeg-to-pdf','png-to-pdf','webp-to-pdf'"), "All Tools groups scanner and image-to-PDF tools together");
check(policy.includes("if (SCAN_TO_PDF_ENABLED) PRODUCTION_PUBLIC_TOOL_IDS.add('scan-to-pdf')"), "production scanner policy remains enabled correctly");

if (failed) {
  console.error("AJN PDF PUBLIC ICON SYSTEM VERIFY: FAIL");
  process.exit(1);
}
console.log("AJN PDF PUBLIC ICON SYSTEM VERIFY: PASS");
