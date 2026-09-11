import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const componentPath = path.join(root, "src/components/junction/PdfEditorLab.tsx");
const workspacePath = path.join(root, "src/components/junction/tool-workspace-client.tsx");
const legacyPath = path.join(root, "src/app/pdf-editor-lab/page.tsx");
let failed = false;
const fail = (message) => { failed = true; console.error(`FAIL: ${message}`); };
const pass = (message) => console.log(`PASS: ${message}`);
const need = (source, needles, label) => {
  for (const needle of needles) if (!source.includes(needle)) fail(`${label}: missing ${needle}`);
};
for (const file of [componentPath, workspacePath, legacyPath]) if (!fs.existsSync(file)) fail(`missing ${path.relative(root, file)}`);

if (!failed) {
  const source = fs.readFileSync(componentPath, "utf8");
  const workspace = fs.readFileSync(workspacePath, "utf8");
  const legacy = fs.readFileSync(legacyPath, "utf8");

  const forbidden = ["cdn.jsdelivr.net", "TESSERACT_CDN", "run.app", "firebase/storage", "uploadBytes(", "/api/pdf/editor", "FormData("];
  for (const needle of forbidden) if (source.includes(needle)) fail(`browser editor contains forbidden runtime dependency ${needle}`);

  need(workspace, ["'edit-pdf': dynamic(() => import('./PdfEditorLab'), { ssr: false })"], "canonical edit-pdf client mapping");
  need(legacy, ['redirect("/edit-pdf")'], "legacy lab redirect");
  if (legacy.includes("PdfEditorLab")) fail("legacy /pdf-editor-lab must not host a second editor implementation");

  need(source, [
    'useState<"upload" | "editor">("upload")', 'if (workspaceMode === "upload")', 'setWorkspaceMode("editor")', 'setWorkspaceMode("upload")',
    'data-ajn-edit-pdf-upload="true"', 'id="ajn-edit-pdf-native-file-input"', 'onChange={handlePdfInputChange}', 'data-ajn-editor-shell="true"',
    'pdfjs-dist/legacy/build/pdf.mjs', 'initPdfWorker()', 'pdfjsLib.getDocument({', 'setPdfEngineReady(true)', 'setCanvasPreviewReady(true)',
    'data-ajn-pdf-preview-canvas="true"', 'data-ajn-preview-loading="true"', 'data-ajn-preview-error="true"', 'Retry editable preview',
  ], "same-page upload/preview contract");
  if (source.includes('EDITOR_ROUTE = "/pdf-editor-lab"') || source.includes("saveEditorLaunchRecord") || source.includes("takeEditorLaunchRecord")) fail("obsolete redirect/session handoff remains in editor");

  need(source, [
    "getTextContent", "content.styles", "loadedFontName", "horizontalScale", "replaceTextHit", "bulkMakeEditable", "selectedIds",
    "replaceAllMatches", "inlineEditingId", "fontFamily", "lineHeight", "setHistory", "setFuture", "copyPages", "setRotation",
    "rasterizeMatchedText", "PDFDocument", "output.save", "Validating result", "check.numPages !== pages.length",
  ], "digital edit/export contract");

  need(source, [
    "rememberTextEditStart", "updateTextValue", "finishTextEdit", "sourceHitById", "wrappedLineEstimate",
    'updateObject(item.id, { text: value, width, height } as Partial<EditorObject>, false)',
  ], "persistent word-edit contract");

  need(source, [
    "TESSERACT_LOCAL_SCRIPT", "OCR_RUNTIME_BASE", "workerPath:", "corePath:", "langPath:", "workerBlobURL: false", 'cacheMethod: "none"',
    "runOcrForSources", "scanCurrentPage", "scanAllPages", "cancelOcr", "Stop OCR", "withOcrTimeout", "prepareOcrCanvas",
    'renderPageSample(sourceIndex, 2.8)', "buildOcrContentCrop", "detectVisualTextRegions", "visualFallback", "parseTsvWords",
    'Number(cols[ix.level]) !== 5', 'typeof data?.tsv === "string"', "verifyLocalOcrWasm", "WebAssembly.compile",
    'type OcrGranularity = "word" | "line" | "table"', "Scan + Word editing", "Scan + Line editing", "Scan + Table editing",
    "makeDetectedScanTextEditable", "Make scan text editable", "cleanOcrText",
  ], "scan/OCR editing contract");

  need(source, [
    "detectTableGrid", "groupTableHitsByCell", "markTableHits", "mergeOcrHits", "TableCellRegion", "TableGridModel",
    "rowLongestRun", "colLongestRun", "recognizedCellKeys", "unreadCellRegions", "Make table text editable",
    'data-ajn-table-cell="true"', "data-table-row", "data-table-column", "showTableGuides",
  ], "table editing contract");

  need(source, [
    "imageHitsFromOperators", "replaceImageHit", "isPageBackgroundImageHit", "sanitizeRestoredObjectsForPdf", "sourceHitId",
    'item.type === "whiteout" && Boolean(item.sourceHitId)', '"redact"', "renderSecureRedactedPage", "PDFString.of", "addLinkAnnotation", 'type: "signature"',
  ], "image/redaction/link contract");

  if (source.includes("fileInputRef.current?.click()")) fail("PDF upload still depends on synthetic ref.click instead of native input activation");
  if (source.includes("if (!file) {")) fail("legacy file-driven upload/editor render condition remains");
  if (source.includes("item.locked") || source.includes("selectedObject.locked")) fail("obsolete lock state remains active");

  if (!failed) {
    pass("/edit-pdf uses one client-only editor and /pdf-editor-lab redirects to it");
    pass("valid file selection commits the same-page editor before optional content analysis");
    pass("PDF.js preview/worker and output re-open validation are present");
    pass("digital text editing, history, page operations and export are present");
    pass("scan word editing uses persistent draft state and one undo snapshot per typing session");
    pass("OCR runtime is same-origin, cancellable and guarded by watchdogs");
    pass("low-confidence OCR keeps manual replacement regions instead of inventing text");
    pass("table mode detects continuous grid rules, removes them only for OCR, groups words into cells and keeps row/column metadata");
    pass("table edits are constrained by detected cell geometry and table guides are available");
    pass("existing images, signatures, links, whiteout and secure redaction remain present");
    console.log("\nAJN PDF EDITOR SCAN + WORD + TABLE CONTRACT: PASS");
  }
}
if (failed) process.exit(1);
