import { MERGE_PDF_LIMITS } from './tool-limit-constants';

export type MergePdfInput = Blob & { name?: string };
export type MergePdfProgress = (percent: number, stage: string) => void;

export async function hasPdfHeader(file: Blob): Promise<boolean> {
  const first = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return first.length >= 5 && first[0] === 0x25 && first[1] === 0x50 && first[2] === 0x44 && first[3] === 0x46 && first[4] === 0x2d;
}

export function normalizeMergeOutputName(value: string): string {
  const raw = (value || 'merged.pdf').trim() || 'merged.pdf';
  const base = raw.toLowerCase().endsWith('.pdf') ? raw.slice(0, -4) : raw;
  const safe = base.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').replace(/[. ]+$/g, '').slice(0, 120) || 'merged';
  return `${safe}.pdf`;
}

export function validateMergeSelection(files: MergePdfInput[]): string | null {
  if (files.length < 2) return 'Add at least two PDF files to merge.';
  if (files.length > MERGE_PDF_LIMITS.maxFiles) return `You can merge up to ${MERGE_PDF_LIMITS.maxFiles} PDFs in one browser job.`;
  const perFile = MERGE_PDF_LIMITS.maxFileSizeMb * 1024 * 1024;
  const totalLimit = MERGE_PDF_LIMITS.maxTotalSizeMb * 1024 * 1024;
  const oversized = files.find((file) => file.size > perFile);
  if (oversized) return `${oversized.name || 'A PDF'} exceeds the ${MERGE_PDF_LIMITS.maxFileSizeMb} MB browser limit.`;
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > totalLimit) return `Selected files exceed the ${MERGE_PDF_LIMITS.maxTotalSizeMb} MB total browser-job limit.`;
  return null;
}

export async function mergePdfFiles(
  files: MergePdfInput[],
  options: { onProgress?: MergePdfProgress; isCancelled?: () => boolean } = {},
): Promise<Uint8Array> {
  const validation = validateMergeSelection(files);
  if (validation) throw new Error(validation);
  options.onProgress?.(0, 'Preparing browser-local merge…');
  const { PDFDocument } = await import('pdf-lib');
  const merged = await PDFDocument.create();

  for (let index = 0; index < files.length; index += 1) {
    if (options.isCancelled?.()) throw new DOMException('Merge cancelled by the user.', 'AbortError');
    const file = files[index];
    if (!(await hasPdfHeader(file))) throw new Error(`${file.name || `PDF ${index + 1}`} is not a readable PDF file.`);
    options.onProgress?.(Math.round((index / files.length) * 80), `Reading ${file.name || `PDF ${index + 1}`}…`);
    const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false, updateMetadata: false });
    const copied = await merged.copyPages(source, source.getPageIndices());
    copied.forEach((page) => merged.addPage(page));
    options.onProgress?.(Math.round(((index + 1) / files.length) * 80), `Added ${index + 1} of ${files.length} PDFs.`);
  }

  if (options.isCancelled?.()) throw new DOMException('Merge cancelled by the user.', 'AbortError');
  options.onProgress?.(90, 'Writing merged PDF…');
  merged.setProducer('AJN PDF');
  merged.setCreator('AJN PDF');
  const saved = await merged.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
  const bytes = new Uint8Array(saved.byteLength);
  bytes.set(saved);
  options.onProgress?.(100, `Merged ${files.length} PDFs successfully.`);
  return bytes;
}
