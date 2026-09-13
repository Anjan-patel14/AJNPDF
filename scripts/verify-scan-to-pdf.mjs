import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
let failed = false;
const pass = (m) => console.log(`PASS: ${m}`);
const fail = (m) => { failed = true; console.error(`FAIL: ${m}`); };
const need = (src, text, m) => src.includes(text) ? pass(m) : fail(m);
const forbid = (src, text, m) => !src.includes(text) ? pass(m) : fail(m);

const scannerPath = "src/components/junction/ScanToPdf.tsx";
const workerPath = "public/ajn-scan/opencv-worker.js";
const buildPath = "scripts/build-ajn-scan-opencv.ps1";
const policyPath = "src/lib/tool-policy.ts";
const toolsPath = "src/lib/tools-data.ts";
const workspacePath = "src/components/junction/tool-workspace-client.tsx";
const gridPath = "src/components/landing/services-grid.tsx";
const seoPath = "src/lib/seo-strategy.ts";

for (const file of [scannerPath, workerPath, buildPath, policyPath, toolsPath, workspacePath, gridPath, seoPath]) {
  fs.existsSync(file) ? pass(`exists: ${file}`) : fail(`missing: ${file}`);
}
if (failed) process.exit(1);

const scanner = read(scannerPath);
const worker = read(workerPath);
const builder = read(buildPath);
const policy = read(policyPath);
const tools = read(toolsPath);
const workspace = read(workspacePath);
const grid = read(gridPath);
const seo = read(seoPath);

need(policy, 'NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF', 'scanner public exposure is feature-gated');
need(policy, "PRODUCTION_PUBLIC_TOOL_IDS.add('scan-to-pdf')", 'scanner is added only when feature flag is enabled');
need(tools, "id: 'scan-to-pdf'", 'scan-to-pdf has a real registry record');
need(workspace, "'scan-to-pdf': dynamic(() => import('./ScanToPdf')", 'scan-to-pdf has a lazy browser workspace');
need(grid, '"scan-to-pdf"', 'primary PDF directory knows the scanner route');
need(grid, 'Create PDF from Images', 'scanner stays in the PDF creation directory group');
need(scanner, '>Use camera<', 'scanner page includes a camera entry action');
need(scanner, '>Upload document photos<', 'scanner page includes an upload entry action');
need(seo, "'scan-to-pdf':", 'scanner has explicit SEO metadata when enabled');

need(scanner, 'navigator.mediaDevices.getUserMedia', 'mobile/desktop camera capture is implemented');
need(scanner, 'capture', 'camera capture flow is implemented');
need(scanner, 'MAX_PAGES = 30', 'multi-page memory guard is explicit');
need(scanner, 'dragCorner', 'manual four-corner adjustment is implemented');
need(scanner, 'runDetect', 'automatic document edge detection is wired');
need(scanner, 'processPage', 'perspective correction/enhancement pipeline is wired');
need(scanner, 'ocr-preprocess', 'OCR uses a dedicated enhanced preprocessing image');
need(scanner, 'type OcrRecognizeResult', 'Tesseract recognize result is explicitly typed');
need(scanner, 'withTimeout<OcrRecognizeResult>', 'OCR timeout preserves the typed recognize result');
need(scanner, 'const OCR_RUNTIME_BASE = "/ajn-ocr"', 'AJN OCR same-origin base is configured');
need(scanner, 'workerPath: `${OCR_RUNTIME_BASE}/worker.min.js`', 'existing AJN OCR worker is reused');
need(scanner, 'corePath: `${OCR_RUNTIME_BASE}/core`', 'same-origin AJN OCR core is reused');
need(scanner, 'langPath: `${OCR_RUNTIME_BASE}/lang`', 'same-origin AJN OCR language data is reused');
for (const lang of ['eng','hin','tel','tam','kan','mal']) need(scanner, `value: "${lang}"`, `OCR language ${lang} is available`);
need(scanner, 'renderingMode: "invisible"', 'searchable PDF uses an invisible OCR text layer');
need(scanner, 'does not by itself make a fully tagged accessible PDF', 'scanner avoids false accessibility claims');
need(scanner, 'HEIC/HEIF', 'HEIC is explicitly conditional on decoder success');
need(scanner, 'pageSizeMode', 'PDF supports auto/A4/Letter page sizing');

need(worker, 'const OPENCV_BASE = "/ajn-scan/opencv-4.10.0/";', 'OpenCV same-origin runtime base is versioned');
need(worker, 'const OPENCV_JS_URL = `${OPENCV_BASE}opencv.js`;', 'OpenCV JS URL is derived from the same-origin versioned base');
need(worker, 'importScripts(OPENCV_JS_URL)', 'OpenCV loads from the same-origin versioned URL inside a dedicated worker');
need(worker, 'cv.Canny', 'worker performs Canny edge detection');
need(worker, 'cv.findContours', 'worker finds document contours');
need(worker, 'cv.getPerspectiveTransform', 'worker computes perspective transform');
need(worker, 'cv.warpPerspective', 'worker performs perspective correction');
need(worker, 'cv.adaptiveThreshold', 'worker provides document B&W enhancement');
need(worker, 'equalizeHist', 'worker normalizes OCR contrast');
forbid(worker, 'https://', 'scanner worker contains no third-party runtime URL');
forbid(worker, 'http://', 'scanner worker contains no insecure external runtime URL');

need(builder, '--disable_single_file', 'OpenCV WASM is kept separate and cacheable');
need(builder, '--config_only', 'OpenCV platform script is configuration-only on Windows');
need(builder, '--build $BUILD --target opencv.js', 'CMake/Ninja builds opencv.js without Unix make');
need(builder, '-DBUILD_LIST=core,imgproc,js', 'OpenCV build keeps core + imgproc plus the required JS binding target');
need(builder, 'opencv_minimal.config.py', 'OpenCV build uses the AJN minimal API whitelist');
need(builder, 'opencv_js.wasm', 'builder verifies/copies a standalone WASM payload');

const staticAllowlist = policy.match(/PRODUCTION_PUBLIC_TOOL_IDS\s*=\s*new Set\(\[([\s\S]*?)\]\)/)?.[1] || "";
const defaultIds = [...staticAllowlist.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
if (defaultIds.length === 26 && !defaultIds.includes('scan-to-pdf')) pass('default production crawl surface remains exactly 26 tools');
else fail(`default allowlist must remain 26 tools without scanner; found ${defaultIds.length}`);

forbid(scanner, '/api/', 'scanner workspace has no backend processing endpoint');
forbid(scanner, 'fetch("http', 'scanner sends no document to an external HTTP endpoint');

if (fs.existsSync("public/ajn-scan/opencv-4.10.0/opencv.js")) {
  const js = read("public/ajn-scan/opencv-4.10.0/opencv.js");
  forbid(js, "data:application/wasm;base64", 'OpenCV runtime does not inline WASM as base64');
  pass(`OpenCV JS runtime present (${fs.statSync("public/ajn-scan/opencv-4.10.0/opencv.js").size} bytes)`);
} else {
  fail("public/ajn-scan/opencv-4.10.0/opencv.js missing — run the one-command installer/build");
}
if (fs.existsSync("public/ajn-scan/opencv-4.10.0/opencv_js.wasm")) {
  pass(`OpenCV WASM runtime present (${fs.statSync("public/ajn-scan/opencv-4.10.0/opencv_js.wasm").size} bytes)`);
} else {
  fail("public/ajn-scan/opencv-4.10.0/opencv_js.wasm missing — run the one-command installer/build");
}

if (failed) {
  console.error("AJN PDF SCAN TO PDF PRODUCTION VERIFY: FAIL");
  process.exit(1);
}
console.log("AJN PDF SCAN TO PDF PRODUCTION VERIFY: PASS");
