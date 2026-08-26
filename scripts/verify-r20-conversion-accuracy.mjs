import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const pass = (message) => console.log(`PASS: ${message}`);
const requireText = (source, needle, message) => {
  if (!source.includes(needle)) fail(message);
  else pass(message);
};
const forbidText = (source, needle, message) => {
  if (source.includes(needle)) fail(message);
  else pass(message);
};

const conversionTools = read('src/lib/conversion-tools.ts');
const toolsData = read('src/lib/tools-data.ts');
const toolPolicy = read('src/lib/tool-policy.ts');
const workspace = read('src/components/junction/tool-workspace-client.tsx');
const serverWorkspace = read('src/components/junction/ServerConversionTool.tsx');
const officeWorkspace = read('src/components/junction/OfficeConversionTool.tsx');
const backendEngine = read('backend/app/conversion_engine.py');
const processingQuality = read('backend/app/processing_quality.py');
const r19Fidelity = read('backend/app/r19_fidelity.py');
const jobWorker = read('backend/app/job_worker.py');
const junctionIndex = read('src/components/junction/index.ts');

const publicConversionIds = [...conversionTools.matchAll(/\btool\(\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
const duplicates = publicConversionIds.filter((id, index) => publicConversionIds.indexOf(id) !== index);
if (duplicates.length) fail(`Duplicate canonical conversion IDs: ${[...new Set(duplicates)].join(', ')}`);
else pass(`${publicConversionIds.length} canonical conversion IDs are unique`);

const pngPublicEntries = [...toolsData.matchAll(/\bid:\s*['"]png-to-pdf['"]/g)].length;
if (pngPublicEntries !== 1) fail(`PNG to PDF must have exactly one base public card; found ${pngPublicEntries}`);
else pass('PNG to PDF has exactly one public card definition');
forbidText(conversionTools, "tool('png-to-pdf'", 'PNG to PDF is not duplicated in the appended conversion display catalog');
requireText(backendEngine, "('.png', 'png-to-pdf', 'PNG to PDF')", 'PNG to PDF is registered by the backend engine');
forbidText(toolPolicy, "'jpg-pdf', 'png-to-pdf'", 'PNG to PDF is not routed through the legacy browser-stable list');
requireText(toolPolicy, "'repair-pdf', 'png-to-pdf', ...conversionBackendIds", 'PNG to PDF is classified as a backend capability');

const allowlistMatch = toolPolicy.match(/PRODUCTION_PUBLIC_TOOL_IDS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
const r21PublicAllowlist = allowlistMatch?.[1] || '';
const pngIsPublic = /['"]png-to-pdf['"]/.test(r21PublicAllowlist);
if (pngIsPublic) {
  requireText(toolPolicy, "'image-to-pdf', 'jpg-to-pdf', 'jpeg-to-pdf', 'png-to-pdf'", 'Public PNG to PDF uses the canonical multi-file backend policy');
} else {
  pass('PNG to PDF is intentionally outside the R21 AJN PDF public allowlist; public multi-file policy is not applicable');
}

requireText(workspace, "...CONVERSION_TOOLS.map((tool) => tool.id), 'png-to-pdf'", 'PNG public card is routed to the canonical server processor');
forbidText(workspace, "'png-to-pdf': dynamic(() => import('./PngToPdf')", 'PNG to PDF has no competing local workspace route');
requireText(serverWorkspace, "'image-to-pdf','jpg-to-pdf','jpeg-to-pdf','png-to-pdf'", 'Server image-to-PDF controls include PNG');
requireText(serverWorkspace, "'gif-to-pdf','svg-to-pdf','heic-to-pdf'", 'Server image-to-PDF controls include SVG and other supported formats');

requireText(workspace, "'pdf-to-word','pdf-to-docx'", 'PDF to Word/DOCX are included in the fidelity workspace route');
requireText(workspace, '<OfficeConversionTool toolId={serverToolId} />', 'Fidelity conversion IDs render through OfficeConversionTool');
requireText(jobWorker, 'from .processing_quality import run_conversion', 'Conversion worker uses the quality conversion entrypoint');
requireText(processingQuality, 'from .r19_fidelity import run_r19_conversion', 'Quality entrypoint imports the R19 fidelity engine');
requireText(processingQuality, 'if run_r19_conversion(spec, files, output, options, workdir, source_url):', 'R19 fidelity engine runs before legacy conversion fallbacks');
requireText(r19Fidelity, 'def pdf_to_docx_fidelity(', 'Layout-aware PDF to DOCX implementation exists');
requireText(r19Fidelity, "include_images = bool(options.get('include_images', True))", 'PDF to DOCX honors the embedded-images option');
requireText(r19Fidelity, 'page.find_tables()', 'PDF to DOCX detects real table structures');
requireText(r19Fidelity, 'document.add_picture(', 'PDF to DOCX can preserve embedded images');
requireText(r19Fidelity, "if spec.processor == 'pdf_docx':", 'R19 dispatcher owns PDF to DOCX processing');
requireText(backendEngine, "('pdf-to-word', 'PDF to Word', '.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'pdf_docx'", 'PDF to Word backend contract is DOCX with the correct MIME and processor');
requireText(officeWorkspace, 'Input: {inputFormats} → Output: {outputFormat}', 'Fidelity workspace shows the real input/output contract');
requireText(officeWorkspace, 'unexpected output format', 'Fidelity workspace rejects an unexpected returned extension');
requireText(officeWorkspace, 'include_images: includeImages', 'PDF to Word sends the embedded-images choice to the backend');

for (const id of ['pdf-to-image','pdf-to-jpg','pdf-to-jpeg','pdf-to-png','pdf-to-webp','pdf-to-bmp','pdf-to-svg','pdf-to-avif','pdf-to-heic']) {
  const pattern = new RegExp(`tool\\('${id.replaceAll('-', '\\-')}'[\\s\\S]*?Multi-page results are downloaded together as a ZIP\\.`);
  if (!pattern.test(conversionTools)) fail(`${id} must disclose its multi-page ZIP output contract`);
  else pass(`${id} discloses its multi-page ZIP output contract`);
}
requireText(backendEngine, "direct = fmt in {'gif', 'tiff'}", 'GIF and TIFF retain direct multi-page output contracts');
requireText(backendEngine, "f'.{fmt}' if direct else '.zip'", 'Other PDF-to-image formats retain ZIP backend contracts');
requireText(serverWorkspace, 'Input: {inputFormats} → Output: {outputFormat}', 'Server workspace shows the real input/output contract');
requireText(serverWorkspace, 'unexpected output format', 'Server workspace rejects an unexpected returned extension');
requireText(serverWorkspace, "manifest?.outputExtension==='.zip'", 'Server workspace explains ZIP-wrapped PDF-to-image results');

for (const id of ['psd-pdf','upscale-image','remove-bg','blur-face','smart-read','pdf-a']) {
  requireText(toolPolicy, `'${id}'`, `${id} remains explicitly hidden until a proven processor exists`);
}

if (fs.existsSync('src/components/junction/DocumentScanner.tsx')) fail('Retired scanner source must be physically deleted');
else pass('Retired scanner source is physically deleted');
forbidText(junctionIndex, 'DocumentScanner', 'Retired scanner component is not exported');

if (process.exitCode) {
  console.error('AJN PDF R20 CONVERSION ACCURACY: FAIL');
  process.exit(process.exitCode);
}
console.log(`AJN PDF R20 CONVERSION ACCURACY: PASS (${publicConversionIds.length} conversion-catalog IDs + PNG backend route checked)`);
