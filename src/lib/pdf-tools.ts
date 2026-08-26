import { PDFDocument } from "pdf-lib";

/**
 * AJNPDF MASTER CLIENT-SIDE LOGIC
 * Browser-only helpers for workflows that remain inside the active tab.
 */

export interface FileItem {
  id: string;
  file: File;
  originalSize: string;
  pageCount?: number;
  processedSize?: string;
}

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Tool 1: Merge PDF Logic
 */
export async function mergePDFs(files: File[], onProgress: (p: number, s: string) => void) {
  onProgress(10, "Initializing Master Buffer...");
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const stepProgress = 10 + Math.round(((i) / files.length) * 80);
    onProgress(stepProgress, `Reading file: ${file.name}`);

    const arrayBuffer = await file.arrayBuffer();
    // Safety: use a copy of the buffer
    const pdf = await PDFDocument.load(arrayBuffer.slice(0));
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  onProgress(95, "Synchronizing Trailer...");
  const pdfBytes = await mergedPdf.save();
  onProgress(100, "Success");

  return {
    data: pdfBytes,
    pages: mergedPdf.getPageCount()
  };
}

/**
 * Tool 2: Split PDF Logic
 */
export async function splitPDFByRange(file: File, rangeStr: string, onProgress: (p: number, s: string) => void) {
  onProgress(20, "Analyzing Source Segments...");
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer.slice(0));
  const totalPages = sourcePdf.getPageCount();

  const pagesToExtract: number[] = [];
  const parts = rangeStr.split(',').map(p => p.trim());

  parts.forEach(part => {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= totalPages) pagesToExtract.push(i - 1);
      }
    } else {
      const num = Number(part);
      if (num >= 1 && num <= totalPages) pagesToExtract.push(num - 1);
    }
  });

  if (pagesToExtract.length === 0) throw new Error("No valid pages selected.");

  onProgress(50, "Extracting selected pages...");
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(sourcePdf, pagesToExtract);
  copiedPages.forEach(p => newPdf.addPage(p));

  const bytes = await newPdf.save();
  return { data: bytes, pages: newPdf.getPageCount() };
}

/**
 * Tool 3: Compress PDF Logic
 */
export async function compressPDF(file: File, _level: 'low' | 'medium' | 'high', onProgress: (p: number, s: string) => void) {
  onProgress(20, "Preparing PDF…");
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer.slice(0));

  onProgress(60, "Compressing PDF…");

  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  onProgress(100, "Fidelity Stabilized");
  return pdfBytes;
}
