import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { File } from 'node:buffer';
import ts from 'typescript';
import { PDFDocument, degrees } from 'pdf-lib';

const root = process.cwd();
const sourcePath = path.join(root, 'src/lib/pdf-manipulator.ts');
const mergeSourcePath = path.join(root, 'src/lib/merge-pdf-browser.ts');
if (!fs.existsSync(sourcePath) || !fs.existsSync(mergeSourcePath)) {
  console.error('FAIL: browser PDF acceptance sources are missing.');
  process.exit(1);
}

const source = fs.readFileSync(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
  fileName: sourcePath,
}).outputText;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ajn-r13-pdf-acceptance-'));
const compiledPath = path.join(tempDir, 'pdf-manipulator.cjs');
fs.writeFileSync(compiledPath, transpiled);
const require = createRequire(import.meta.url);
const Module = require('node:module');
const originalPaths = Module._nodeModulePaths(tempDir);
originalPaths.unshift(path.join(root, 'node_modules'));
const tempRequire = createRequire(compiledPath);
const oldNodePath = process.env.NODE_PATH;
process.env.NODE_PATH = [path.join(root, 'node_modules'), oldNodePath].filter(Boolean).join(path.delimiter);
Module._initPaths();
const { PDFManipulator } = tempRequire(compiledPath);

// Compile the exact browser-local Merge helper used by the real UI. Inline the
// cycle-free limits constant for this isolated temporary-module acceptance and
// route the lazy pdf-lib import through CommonJS resolution from node_modules.
let mergeSource = fs.readFileSync(mergeSourcePath, 'utf8');
mergeSource = mergeSource.replace(
  "import { MERGE_PDF_LIMITS } from './tool-limit-constants';",
  "const MERGE_PDF_LIMITS = { maxFiles: 30, maxFileSizeMb: 50, maxTotalSizeMb: 150 } as const;",
).replace("await import('pdf-lib')", "await Promise.resolve(require('pdf-lib'))");
const mergeTranspiled = ts.transpileModule(mergeSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  fileName: mergeSourcePath,
}).outputText;
const mergeCompiledPath = path.join(tempDir, 'merge-pdf-browser.cjs');
fs.writeFileSync(mergeCompiledPath, mergeTranspiled);
const { mergePdfFiles, validateMergeSelection } = tempRequire(mergeCompiledPath);

const pass = (message) => console.log(`PASS: ${message}`);
const expect = (condition, message) => { if (!condition) throw new Error(message); };

async function makeSingle(name, width, height = 600, rotation = 0) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([width, height]);
  if (rotation) page.setRotation(degrees(rotation));
  const bytes = await doc.save();
  return new File([bytes], name, { type: 'application/pdf' });
}
async function makeMulti(name, widths) {
  const doc = await PDFDocument.create();
  widths.forEach((width) => doc.addPage([width, 600]));
  const bytes = await doc.save();
  return new File([bytes], name, { type: 'application/pdf' });
}
async function loadResult(result) {
  expect(result?.mimeType === 'application/pdf', `unexpected MIME: ${result?.mimeType}`);
  expect(String(result?.fileName || '').endsWith('.pdf'), `unexpected filename: ${result?.fileName}`);
  const bytes = new Uint8Array(await result.blob.arrayBuffer());
  expect(bytes.length > 100, 'output PDF is unexpectedly empty');
  return PDFDocument.load(bytes);
}
function widths(doc) { return doc.getPages().map((page) => Math.round(page.getWidth())); }

try {
  const files = [
    await makeSingle('A.pdf', 401),
    await makeSingle('B.pdf', 402),
    await makeSingle('C.pdf', 403),
    await makeSingle('D.pdf', 404),
    await makeSingle('E.pdf', 405)];

  const mergeQueue = [files[2], files[0], files[4], files[1], files[3]];
  expect(validateMergeSelection(mergeQueue) === null, 'real Merge helper rejected a valid five-file queue');
  const mergeBytes = await mergePdfFiles(mergeQueue);
  const merged = await PDFDocument.load(mergeBytes);
  expect(JSON.stringify(widths(merged)) === JSON.stringify([403,401,405,402,404]), `merge order mismatch: ${widths(merged)}`);
  pass('Real Merge UI helper preserves selected file order across five generated PDFs');

  const afterRemoveAndReAdd = [files[2], files[0], files[1], files[3], files[4]];
  const secondMerge = await PDFDocument.load(await mergePdfFiles(afterRemoveAndReAdd));
  expect(JSON.stringify(widths(secondMerge)) === JSON.stringify([403,401,402,404,405]), `reorder/remove/re-add mismatch: ${widths(secondMerge)}`);
  pass('Real Merge UI helper output matches reorder/remove/re-add queue');

  const multi = await makeMulti('multi.pdf', [411,412,413,414,415]);
  const splitResult = await loadResult(await new PDFManipulator(multi).runOperation('split-pdf', {
    outputName: 'r13-split',
    pageMap: [{ sourceIdx: 0, pageIdx: 1 }, { sourceIdx: 0, pageIdx: 3 }],
  }));
  expect(JSON.stringify(widths(splitResult)) === JSON.stringify([412,414]), `split page selection mismatch: ${widths(splitResult)}`);
  pass('Split PDF preserves the selected page range/order');

  const organizeResult = await loadResult(await new PDFManipulator(multi).runOperation('organize-pdf', {
    outputName: 'r13-organized',
    pageMap: [{ sourceIdx: 0, pageIdx: 4 }, { sourceIdx: 0, pageIdx: 0 }, { sourceIdx: 0, pageIdx: 2 }],
  }));
  expect(JSON.stringify(widths(organizeResult)) === JSON.stringify([415,411,413]), `organize order mismatch: ${widths(organizeResult)}`);
  pass('Organize PDF emits the exact visible page order');

  const rotateInput = await makeSingle('rotate.pdf', 421, 600, 0);
  const rotateResult = await loadResult(await new PDFManipulator(rotateInput).runOperation('rotate-pdf', { outputName: 'r13-rotated', angle: 90 }));
  expect(rotateResult.getPage(0).getRotation().angle === 90, `rotation mismatch: ${rotateResult.getPage(0).getRotation().angle}`);
  pass('Rotate PDF applies the requested page rotation');

  console.log('AJN PDF R13 REAL BROWSER-PDF ACCEPTANCE: PASS');
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  process.env.NODE_PATH = oldNodePath;
  fs.rmSync(tempDir, { recursive: true, force: true });
}
