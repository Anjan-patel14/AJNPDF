'use client';

import { PDFDocument } from 'pdf-lib';
import { compressPDF as baseCompress, type CompressionLevel } from './pdf-compress/pdf-compress';
import { initPdfWorker } from './pdfjs-worker';

if (typeof window !== 'undefined') initPdfWorker();

type Progress = (p: { stage: string; detail: string; pct: number }) => void;

/** Browser-native helpers used by public AJN PDF tools. */
export async function advancedCompressPDF(file: File, level: string, onProgress: Progress) {
  const selectedLevel: CompressionLevel =
    level === 'extreme' || level === 'less' || level === 'recommended'
      ? level
      : 'recommended';
  const res = await baseCompress(file, {
    level: selectedLevel,
    onProgress: (detail, pct) => onProgress({ stage: 'Compressing', detail, pct }),
  });
  const buffer = res.data.buffer as ArrayBuffer;
  return new Blob([buffer.slice(0)], { type: 'application/pdf' });
}

export async function pdfMetadata(file: File, options: Record<string, any>, onProgress: Progress) {
  onProgress({ stage: 'Preparing', detail: 'Loading document metadata…', pct: 10 });
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer.slice(0) as ArrayBuffer, { ignoreEncryption: true });
  if (options.title) pdfDoc.setTitle(options.title);
  if (options.author) pdfDoc.setAuthor(options.author);
  if (options.subject) pdfDoc.setSubject(options.subject);
  if (options.keywords) pdfDoc.setKeywords(String(options.keywords).split(',').map((s) => s.trim()).filter(Boolean));
  onProgress({ stage: 'Saving', detail: 'Writing the updated PDF…', pct: 90 });
  const bytes = await pdfDoc.save();
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

export async function imagesToPDF(files: File[], _options: Record<string, any>, onProgress: Progress) {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const buf = new Uint8Array(await file.arrayBuffer());
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    const image = isPng ? await pdfDoc.embedPng(buf) : await pdfDoc.embedJpg(buf);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    onProgress({ stage: 'Encoding', detail: `Adding image ${i + 1} of ${files.length}`, pct: Math.round(((i + 1) / files.length) * 100) });
  }
  const bytes = await pdfDoc.save();
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}
