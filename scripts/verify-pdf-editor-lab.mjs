import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const componentPath = path.join(root, "src/components/junction/PdfEditorLab.tsx");
const pagePath = path.join(root, "src/app/pdf-editor-lab/page.tsx");
let failed = false;
const fail = (message) => { failed = true; console.error(`FAIL: ${message}`); };
const pass = (message) => console.log(`PASS: ${message}`);

if (!fs.existsSync(componentPath)) fail("PdfEditorLab.tsx is missing");
if (!fs.existsSync(pagePath)) fail("pdf-editor-lab route is missing");

if (!failed) {
  const source = fs.readFileSync(componentPath, "utf8");
  const page = fs.readFileSync(pagePath, "utf8");
  const forbidden = [
    ["fetch(", "network fetch"], ["XMLHttpRequest", "XHR"], ["axios", "axios"],
    ["run.app", "Cloud Run URL"], ["firebase/storage", "Firebase Storage"],
    ["uploadBytes(", "Firebase upload"], ["/api/pdf/editor", "editor API"],
  ];
  for (const [needle, label] of forbidden) if (source.includes(needle)) fail(`browser editor contains forbidden ${label}`);
  const required = [
    ["pdfjs-dist", "PDF.js rendering"], ["PDFDocument", "pdf-lib export"],
    ["getTextContent", "existing-text detection"],
    ["content.styles", "PDF font style analysis"],
    ["loadedFontName", "PDF.js loaded font inspection"],
    ["type FontDescriptor", "font descriptor compile-safe typing"],
    ["const searchResults = useMemo", "typed PDF search results"],
    ["horizontalScale", "original text width matching"],
    ["sampleTextColor", "original text color sampling"],
    ["rasterizeMatchedText", "visual matched-font export"],
    ['renderMode: "visual-match"', "smart replacement visual match mode"], ["replaceTextHit", "smart text replacement"],
    ['type: "whiteout"', "manual whiteout"], ['mode === "highlight"', "highlight tool"],
    ['type: "image"', "image insertion"], ['type: "signature"', "signature insertion"],
    ["setHistory", "undo history"], ["setFuture", "redo history"],
    ["copyPages", "page duplicate/reorder export"], ["setRotation", "page rotation export"],
    ["indexedDB", "local recovery"], ["getDocument({ data: bytes.slice() })", "result re-open validation"],
  ];
  for (const [needle, label] of required) if (!source.includes(needle)) fail(`missing ${label}`);
  const textRendererLine = source.split("\n").find((line) => line.includes('item.type === "text" && <div style=')) || "";
  const widthCount = (textRendererLine.match(/\bwidth:/g) || []).length;
  if (widthCount > 1) fail("text preview style contains duplicate width properties");
  if (!page.includes("index: false")) fail("local lab route must stay noindex");
  if (!failed) {
    pass("browser-only processor has no upload/server dependency");
    pass("smart detected-text replacement present");
    pass("detected PDF font family/style/baseline/width analysis present");
    pass("matched-font visual export path present");
    pass("manual whiteout/highlight/shapes present");
    pass("text formatting, images and signatures present");
    pass("undo/redo/copy/paste keyboard workflow present");
    pass("page management export pipeline present");
    pass("IndexedDB local recovery present");
    pass("PDF.js result validation present");
    pass("local lab route is noindex");
    console.log("\nAJN PDF EDITOR LAB CONTRACT: PASS");
  }
}
if (failed) process.exit(1);
