import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
let failed = false;

const pass = (message) => console.log(`PASS: ${message}`);
const fail = (message) => { failed = true; console.error(`FAIL: ${message}`); };

const home = read("src/app/page.tsx");
const hero = read("src/components/landing/hero.tsx");
const grid = read("src/components/landing/services-grid.tsx");
const navbar = read("src/components/landing/navbar.tsx");
const menu = read("src/components/landing/all-tools-menu.tsx");
const footer = read("src/components/landing/main-footer.tsx");
const css = read("src/app/globals.css");
const ambient = read("src/app/ambient-light.css");
const layout = read("src/app/layout.tsx");
const themeProvider = read("src/components/theme/theme-provider.tsx");
const policy = read("src/lib/tool-policy.ts");
const next = read("next.config.ts");
const pkg = JSON.parse(read("package.json"));

hero.includes("Free Online PDF Tools") ? pass("Focused hero heading is exact") : fail("Focused hero heading is missing or changed");
const heroDescriptionOk = hero.includes("Merge, compress, split, organize, edit, sign and protect PDF files") && hero.includes("all in one simple workspace.");
heroDescriptionOk ? pass("Hero description is correct") : fail("Hero description is missing or changed");

for (const forbidden of ["Choose a PDF tool","Start with Merge PDF","Workspace preview","Report.pdf","Proposal.pdf","Statement.pdf"]) {
  !hero.includes(forbidden) ? pass(`Hero excludes retired content: ${forbidden}`) : fail(`Hero still contains retired content: ${forbidden}`);
}

for (const id of ["all", "edit", "organize", "security"]) {
  new RegExp(`id:\\s*["']${id}["']`).test(home) ? pass(`Homepage category ${id} wired`) : fail(`Homepage category ${id} missing`);
}
for (const retired of ["image", "pdf", "conversion"]) {
  !new RegExp(`id:\\s*["']${retired}["']`).test(home) ? pass(`Retired homepage category ${retired} absent`) : fail(`Retired homepage category ${retired} remains`);
}

const directGrid = grid.includes("filteredTools.map((tool) => <ToolCard") && grid.includes("BUILD_PUBLIC_TOOLS.length") && grid.includes("Nothing is hidden behind a More tools menu");
directGrid ? pass("Every public tool renders directly in the homepage grid") : fail("Homepage still hides or groups public tools instead of direct rendering");
grid.includes("const Icon = tool.icon") && grid.includes("strokeWidth={2}") ? pass("Tool cards use simple visible line icons") : fail("Simple line-icon tool cards missing");
!grid.includes("Image Tools") ? pass("Image tool group is absent") : fail("Image tool group remains");
grid.includes("normalize(") && grid.includes("haystack") ? pass("Tool search normalization remains present") : fail("Tool search normalization missing");

for (const id of ["merge-pdf","compress-pdf","split-pdf","edit-pdf","sign-pdf"]) {
  new RegExp(`id:\\s*["']${id}["']`).test(navbar) ? pass(`Header quick tool ${id}`) : fail(`Header quick tool missing ${id}`);
}
for (const route of ["/pdf-tools", "/status", "/security"]) {
  navbar.includes(`href="${route}"`) || navbar.includes(`href='${route}'`) || navbar.includes(`href: "${route}"`) || navbar.includes(`href: '${route}'`) ? pass(`Focused navigation route present: ${route}`) : fail(`Focused navigation route missing: ${route}`);
}
for (const retiredRoute of ["/pricing", "/login", "/account"]) {
  !navbar.includes(`href="${retiredRoute}"`) && !navbar.includes(`href='${retiredRoute}'`) ? pass(`Retired account route absent from header: ${retiredRoute}`) : fail(`Retired account route remains in header: ${retiredRoute}`);
}

next.includes("source: '/pricing'") && next.includes("source: '/login'") && next.includes("source: '/account/:path*'") && next.includes("destination: '/pdf-tools'") ? pass("Retired account/pricing routes redirect to PDF tools") : fail("Retired account/pricing redirects are incomplete");
navbar.includes("<AllToolsMenu") ? pass("All Tools launcher remains available as a secondary shortcut") : fail("All Tools launcher missing");
navbar.includes("All PDF Tools") ? pass("Mobile All PDF Tools entry present") : fail("Mobile All PDF Tools entry missing");
!navbar.includes("/conversion-tools") && !navbar.includes("/image-tools") ? pass("Retired converter/image navigation absent") : fail("Retired converter/image navigation remains");
menu.includes("BUILD_PUBLIC_TOOLS.length") && !menu.includes("Image Tools") ? pass("All Tools menu derives from the focused public inventory") : fail("All Tools menu inventory is stale");
!footer.includes("/conversion-tools") && !footer.includes("/image-tools") ? pass("Footer excludes retired conversion/image directories") : fail("Footer still links retired conversion/image directory");

for (const marker of ["prefers-reduced-motion", "overflow-x: hidden"]) css.includes(marker) ? pass(`Responsive/accessibility marker ${marker}`) : fail(`Missing responsive/accessibility marker ${marker}`);
for (const marker of [".ajn-ambient-root",".ajn-ambient-canvas",".ajn-ambient-ribbons",".ajn-ambient-sheen","radial-gradient","linear-gradient","prefers-reduced-motion","forced-colors"]) ambient.includes(marker) ? pass(`Ambient production marker ${marker}`) : fail(`Missing ambient production marker ${marker}`);

layout.includes('data-theme="light"') && layout.includes("classList.remove('dark')") && !layout.includes("prefers-color-scheme: dark") ? pass("Root layout is permanently light-only") : fail("Root layout still permits dark-mode boot behavior");
themeProvider.includes('theme: "light"') && themeProvider.includes('classList.remove("dark")') && !themeProvider.includes("matchMedia") ? pass("Theme provider is a light-only compatibility provider") : fail("Theme provider can still activate dark mode");
!navbar.includes("toggleTheme") && !navbar.includes("useTheme") && !navbar.includes("Moon") && !navbar.includes("Sun") ? pass("Theme switch control is removed from navigation") : fail("Theme switch control remains in navigation");
css.includes(".ajn-tool-card") || css.includes(".ajn-premium-tool-card") ? pass("Focused tool-card styling exists") : fail("Focused tool-card styling missing");
/linear-gradient|radial-gradient/.test(ambient) ? pass("Approved ambient gradients are isolated in the production background layer") : fail("Approved ambient gradient layer is missing");

const publicBlock = policy.match(/PRODUCTION_PUBLIC_TOOL_IDS\s*=\s*new Set\(\[([\s\S]*?)\]\)/)?.[1] || "";
const ids = [...publicBlock.matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
ids.length === 34 && new Set(ids).size === 34 ? pass("Exactly 34 focused public PDF tools") : fail(`Expected exactly 34 public PDF tools; found ${ids.length}`);

for (const prohibited of [/100%\s*(private|local|secure)/i,/trusted by (millions|thousands)/i,/99\.9%\s*uptime/i,/free forever/i,/no limits/i,/90\+\s*tools/i,/100\+\s*tools/i,/107\s+tools/i]) {
  prohibited.test([home, hero, grid, navbar, menu, footer].join("\n")) ? fail(`Unsupported claim ${prohibited}`) : pass(`Avoids ${prohibited}`);
}

pkg.scripts?.check?.includes("verify:final-ui") ? pass("Final UI verifier remains in production check") : fail("Final UI verifier missing from production check");

if (failed) process.exit(1);
console.log("AJN PDF FOCUSED FINAL UI VERIFICATION: PASS");
