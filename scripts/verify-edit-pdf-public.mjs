import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const failures = [];
const check = (label, ok) => ok ? console.log(`PASS: ${label}`) : failures.push(label);

const ids = JSON.parse(read("scripts/r13-public-tool-ids.json"));
check("public catalog has exactly 26 unique tools", ids.length === 26 && new Set(ids).size === 26);
check("Edit PDF is public", ids.includes("edit-pdf"));

const tools = read("src/lib/tools-data.ts");
check("Edit PDF card exists", /\bid\s*:\s*['"]edit-pdf['"]/.test(tools) && /name\s*:\s*['"]Edit PDF['"]/.test(tools));
check("Edit PDF card has New badge", /id\s*:\s*['"]edit-pdf['"][\s\S]{0,1000}badge\s*:\s*['"]New['"]/.test(tools));
check("Edit PDF has rich capabilities", tools.includes("Smart existing-text replacement") && tools.includes("Change dates, names, numbers and amounts"));
check("Edit PDF has primary search terms", tools.includes("edit pdf online free") && tools.includes("best free pdf editor") && tools.includes("edit date in pdf"));

const policy = read("src/lib/tool-policy.ts");
check("Edit PDF is in production allowlist", /PRODUCTION_PUBLIC_TOOL_IDS[\s\S]*['"]edit-pdf['"]/.test(policy));
check("Edit PDF is stable browser processing", /stableBrowserIds[\s\S]*['"]edit-pdf['"]/.test(policy));

const workspace = read("src/components/junction/tool-workspace-client.tsx");
check("Edit PDF maps to browser editor", /['"]edit-pdf['"]\s*:\s*dynamic\(\(\)\s*=>\s*import\(['"]\.\/PdfEditorLab['"]\)/.test(workspace));

const grid = read("src/components/landing/services-grid.tsx");
check("Edit PDF is in Edit & Sign group", /id\s*:\s*["']edit["'][\s\S]{0,1200}ids\s*:\s*\[[^\]]*["']edit-pdf["']/.test(grid));
check("Edit PDF participates in edit intent", /const\s+INTENT_IDS[\s\S]*edit\s*:\s*\[[^\]]*["']edit-pdf["']/.test(grid));
check("Edit PDF card is visually featured", grid.includes("data-ajn-featured-editor") && grid.includes("New • Browser Editor"));
check("featured card states local handling", grid.includes("No file upload"));
check("featured card has Smart Replace feature chips", grid.includes("Smart text replace") && grid.includes("Font match") && grid.includes("Live preview"));

const quick = read("src/components/landing/quick-tools-scroller.tsx");
check("Edit PDF is in quick access", /id\s*:\s*["']edit-pdf["'][^\n]*name\s*:\s*["']Edit PDF["']/.test(quick));
check("quick access count shows 26", quick.includes("View all 26"));

const artwork = read("src/components/ajn/tool-artwork.tsx");
check("Edit PDF has vector artwork", /['"]edit-pdf['"]\s*:\s*PenTool/.test(artwork));

const seo = read("src/lib/seo-strategy.ts");
check("Edit PDF owns Edit PDF SEO title", seo.includes("Edit PDF Online Free - Change Text & Sign PDF | AJN PDF"));
check("Add Text has narrower SEO title", seo.includes("Add Text to PDF Online - Write on PDF | AJN PDF"));
check("Edit PDF has dedicated meta description", seo.includes("Edit PDF online in your browser with AJN PDF. Replace text, dates, names and numbers"));

const editorial = read("src/lib/tool-editorial.ts");
check("Edit PDF has dedicated editorial content", /['"]edit-pdf['"]\s*:\s*\{/.test(editorial) && editorial.includes("Smart Replace reads the PDF text layer"));
check("font matching limitation is honest", editorial.includes("Visual Match, Family Match or Fallback"));
check("whiteout is not mislabeled as secure redaction", editorial.includes("Whiteout is a visual cover"));

const nextConfig = read("next.config.ts");
check("legacy /tools/edit-pdf redirect will be generated", /publicToolIds[\s\S]*['"]edit-pdf['"]/.test(nextConfig));

const page = read("src/app/(tool-pages)/[id]/page.tsx");
check("public tool page provides WebApplication schema", page.includes("'@type': 'WebApplication'") && page.includes("featureList"));
check("public tool page builds SEO metadata", page.includes("buildToolMetadata(tool)"));

const editor = read("src/components/junction/PdfEditorLab.tsx");
for (const forbidden of ["fetch(", "XMLHttpRequest", "run.app", "firebase/storage", "uploadBytes(", "/api/pdf/editor"]) {
  check(`editor has no ${forbidden} processing dependency`, !editor.includes(forbidden));
}
check("font-match smart replacement remains present", editor.includes("fontMatch") && editor.includes("horizontalScale") && editor.includes("baselineOffset"));
check("browser output validation remains present", editor.includes("getDocument({ data: bytes.slice() })"));

const browserImageVerifier = read("scripts/verify-browser-image-pdf.mjs");
check("browser-image verifier count updated to 26", browserImageVerifier.includes("ids.length === 26") && browserImageVerifier.includes("new Set(ids).size === 26"));

const labPage = read("src/app/pdf-editor-lab/page.tsx");
check("test alias remains noindex", labPage.includes("index: false"));

if (failures.length) {
  console.error("\nAJN PDF PUBLIC EDITOR V3.1 CONTRACT: FAIL");
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}
console.log("\nAJN PDF PUBLIC EDITOR V3.1 CONTRACT: PASS");
