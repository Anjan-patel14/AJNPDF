import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let failed = false;
const pass = (message) => console.log(`PASS: ${message}`);
const fail = (message) => { failed = true; console.error(`FAIL: ${message}`); };
const assertFile = (rel, minBytes) => {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) { fail(`${rel} is missing`); return; }
  const size = fs.statSync(full).size;
  if (size < minBytes) fail(`${rel} is unexpectedly small (${size} bytes)`);
  else pass(`${rel} (${size} bytes)`);
};

assertFile("public/ajn-ocr/tesseract.min.js", 20000);
assertFile("public/ajn-ocr/worker.min.js", 40000);
for (const file of [
  "tesseract-core.wasm.js",
  "tesseract-core-simd.wasm.js",
  "tesseract-core-lstm.wasm.js",
  "tesseract-core-simd-lstm.wasm.js",
]) assertFile(`public/ajn-ocr/core/${file}`, 100000);
for (const lang of ["eng", "hin", "tel", "tam", "kan", "mal"]) assertFile(`public/ajn-ocr/lang/${lang}.traineddata.gz`, 100000);
assertFile("public/ajn-ocr/runtime.json", 20);

const editorPath = path.join(root, "src/components/junction/PdfEditorLab.tsx");
if (!fs.existsSync(editorPath)) fail("PdfEditorLab.tsx is missing");
else {
  const editor = fs.readFileSync(editorPath, "utf8");
  if (editor.includes("cdn.jsdelivr.net") || editor.includes("TESSERACT_CDN")) fail("PdfEditorLab still references an external OCR CDN");
  else pass("PdfEditorLab has no runtime OCR CDN reference");
  for (const needle of ["/ajn-ocr", "workerPath:", "corePath:", "langPath:", "workerBlobURL: false"]) {
    if (!editor.includes(needle)) fail(`PdfEditorLab missing ${needle}`);
  }
  if (editor.includes("workerBlobURL: true")) fail("PdfEditorLab still enables blob worker bootstrap");
  else pass("PdfEditorLab uses direct same-origin OCR worker bootstrap");
  if (!editor.includes("verifyLocalOcrWasm") || !editor.includes("WebAssembly.compile")) fail("PdfEditorLab missing browser WebAssembly preflight");
  else pass("PdfEditorLab checks WebAssembly permission before OCR startup");
}

const nextConfigPath = path.join(root, "next.config.ts");
if (!fs.existsSync(nextConfigPath)) fail("next.config.ts is missing");
else {
  const nextConfig = fs.readFileSync(nextConfigPath, "utf8");
  if (!nextConfig.includes("'wasm-unsafe-eval'")) fail("next.config.ts missing wasm-unsafe-eval required for Tesseract WebAssembly");
  else pass("next.config.ts permits Tesseract WebAssembly");
  if (!/frame-src[^\n"`]*\bblob:/.test(nextConfig)) fail("next.config.ts missing frame-src blob: required for browser-local PDF preview fallback");
  else pass("next.config.ts permits browser-local blob PDF preview frames");
  if (/(^|[^-])['"]unsafe-eval['"]/.test(nextConfig)) fail("next.config.ts must not enable JavaScript unsafe-eval");
  else pass("JavaScript unsafe-eval remains disabled");
}

if (failed) {
  console.error("\nAJN PDF LOCAL OCR ASSET CONTRACT: FAIL");
  process.exit(1);
}
console.log("\nAJN PDF LOCAL OCR ASSET CONTRACT: PASS");
