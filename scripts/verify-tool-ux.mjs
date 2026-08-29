import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const failures = [];
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');
const check = (label, ok) => ok ? console.log(`PASS: ${label}`) : failures.push(label);
const allJunction = fs.readdirSync(path.join(root,'src/components/junction')).filter(f=>f.endsWith('.tsx')).map(f=>read(`src/components/junction/${f}`)).join('\n');

const shared = read('src/components/junction/_shared.tsx');
check('Shared uploader reads input.files and dataTransfer.files', shared.includes('dataTransfer') && shared.includes('getFilesFromEvent'));
check('Shared uploader exposes keyboard button semantics', shared.includes('role="button"') && shared.includes('tabIndex={0}') && shared.includes('e.key === \"Enter\"') && shared.includes('e.key === \" \"'));
check('Processed PDF results expose a safe Preview PDF action beside Download', shared.includes('canPreviewPdf') && shared.includes('element_id: "preview_pdf"') && shared.includes('opener.target = "_blank"') && shared.includes('opener.rel = "noopener noreferrer"') && shared.includes('{canPreviewPdf && <Btn variant="secondary" onClick={previewPdf}>'));
check('PDF preview object URLs are revoked after the viewer has time to load', shared.includes('URL.revokeObjectURL(previewUrl)') && shared.includes('5 * 60 * 1000'));
check('No legacy drag event is cast into an input event', !/onDrop[^\n]*as any/.test(allJunction));

const zip = read('src/components/junction/ZipExtractor.tsx');
check('ZIP Extractor advertises ZIP only', !/\.rar|\.7z/i.test(zip));
check('ZIP Extractor has entry and expanded-size limits', /MAX_ENTRIES/.test(zip) && /MAX_TOTAL/.test(zip));

const output = read('src/components/junction/output-section.tsx');
check('No simulated email/download-link delivery remains', !/sent to recipient|setTimeout\(|email/i.test(output));

const server = read('src/components/junction/ServerConversionTool.tsx');
check('Server conversion uses stage-based progress, not synthetic percentages', !/setProgress|progress}%|progress\s*%/.test(server) && /processingStage/.test(server));

const watermark = read('src/components/junction/WatermarkPdf.tsx');
check('Watermark PDF no longer calls unrelated metadata processor', !/pdf-metadata/.test(watermark));

const addText = read('src/components/junction/AddText.tsx');
const addImage = read('src/components/junction/AddImageToPdf.tsx');
const sign = read('src/components/junction/SignPdf.tsx');
check('Add Text uses direct visual positioning', /VisualPositionOverlay/.test(addText) && /Advanced position/.test(addText));
check('Add Image uses direct drag/resize positioning', /VisualPositionOverlay/.test(addImage) && /resizable/.test(addImage) && /opacity/.test(addImage) && /rotation/.test(addImage));
check('Sign PDF supports Draw, Type and Upload signature sources', /signatureSource/.test(sign) && /'draw'/.test(sign) && /'type'/.test(sign) && /'upload'/.test(sign));
check('Sign PDF uses direct drag/resize positioning', /VisualPositionOverlay/.test(sign) && /Advanced position/.test(sign));
check('Visual editors do not show fake percentage progress', !/\{progress\}%/.test(addText + addImage + sign));
check('Custom output filenames are respected in image/sign editors', /safeOutputName\(outputName/.test(addImage) && /safeOutputName\(outputName/.test(sign));

const data = read('src/lib/tools-data.ts');
check('Watermark PDF public copy matches text-only implementation', /id: 'watermark-pdf', name: 'Watermark PDF', desc: 'Add a text watermark/i.test(data));
check('Add Text public copy does not claim unsupported custom fonts', !/Custom fonts/i.test(data));

if (failures.length) {
  console.error('FAIL: tool UX verification failed:');
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
console.log('AJN PDF tool UX and customization verification completed successfully.');
