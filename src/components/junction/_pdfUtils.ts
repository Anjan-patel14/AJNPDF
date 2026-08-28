'use client';
// _pdfUtils.ts — all PDF operations run 100% in the browser
// Requires: pdf-lib  pdfjs-dist  jszip
// Install:  npm i pdf-lib pdfjs-dist jszip

import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { initPdfWorker } from '@/lib/pdfjs-worker';

/* ── load PDFDocument (handles both ArrayBuffer and Uint8Array) ── */
export async function loadPdf(file: File): Promise<PDFDocument> {
  const buf = await file.arrayBuffer();
  try {
    return await PDFDocument.load(buf, { ignoreEncryption: false });
  } catch (error: any) {
    const message = String(error?.message || error || '').toLowerCase();
    if (message.includes('encrypt') || message.includes('password')) {
      throw new Error('This PDF is encrypted. Unlock it with the authorized Unlock PDF tool first.');
    }
    throw new Error('The PDF is corrupted or uses unsupported structures.');
  }
}

export async function pdfToBytes(doc: PDFDocument): Promise<Uint8Array> {
  return doc.save();
}

export function bytesToBlob(bytes: Uint8Array, mime = "application/pdf"): Blob {
  return new Blob([bytes.buffer as ArrayBuffer], { type: mime });
}

/* ─────────────────────────────────────────────────────────────
   1. MERGE
───────────────────────────────────────────────────────────── */
export async function mergePdfs(files: File[]): Promise<Blob> {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const doc = await loadPdf(file);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach(p => merged.addPage(p));
  }
  return bytesToBlob(await merged.save());
}

/* ─────────────────────────────────────────────────────────────
   2. SPLIT
───────────────────────────────────────────────────────────── */
export async function splitPdf(file: File, ranges: string): Promise<{ name: string; blob: Blob }[]> {
  const doc = await loadPdf(file);
  const total = doc.getPageCount();
  const results: { name: string; blob: Blob }[] = [];

  if (!ranges.trim() || ranges.trim().toLowerCase() === "all") {
    for (let i = 0; i < total; i++) {
      const out = await PDFDocument.create();
      const [p] = await out.copyPages(doc, [i]);
      out.addPage(p);
      results.push({ name: `page_${i + 1}.pdf`, blob: bytesToBlob(await out.save()) });
    }
    return results;
  }

  const parts = ranges.split(",").map(s => s.trim());
  let idx = 1;
  for (const part of parts) {
    const out = await PDFDocument.create();
    if (part.includes("-")) {
      const [aStr, bStr] = part.split("-");
      const a = aStr ? Math.max(1, Math.min(total, parseInt(aStr))) - 1 : 0;
      const b = bStr ? Math.max(1, Math.min(total, parseInt(bStr))) - 1 : total - 1;
      const indices = Array.from({ length: b - a + 1 }, (_, i) => a + i);
      const pages = await out.copyPages(doc, indices);
      pages.forEach(p => out.addPage(p));
    } else {
      const n = Math.max(1, Math.min(total, parseInt(part))) - 1;
      if (!isNaN(n)) {
        const [p] = await out.copyPages(doc, [n]);
        out.addPage(p);
      }
    }
    results.push({ name: `part_${idx++}.pdf`, blob: bytesToBlob(await out.save()) });
  }
  return results;
}

/* ─────────────────────────────────────────────────────────────
   3. COMPRESS (re-save, strip unused objects)
───────────────────────────────────────────────────────────── */
export async function compressPdf(file: File): Promise<Blob> {
  const doc = await loadPdf(file);
  // pdf-lib re-saves removing orphaned objects
  const bytes = await doc.save({ useObjectStreams: true });
  return bytesToBlob(bytes);
}

/* ─────────────────────────────────────────────────────────────
   4. PROTECT
───────────────────────────────────────────────────────────── */
export async function protectPdf(): Promise<Blob> {
  throw new Error('Real PDF encryption requires the AJN PDF online workflow.');
}

/* ─────────────────────────────────────────────────────────────
   5. UNLOCK / REPAIR (re-save removing restrictions)
───────────────────────────────────────────────────────────── */
export async function unlockPdf(): Promise<Blob> {
  throw new Error('Real PDF decryption requires the AJN PDF online workflow.');
}

/* ─────────────────────────────────────────────────────────────
   6. ROTATE
───────────────────────────────────────────────────────────── */
export async function rotatePdf(file: File, deg: number, pageNums: string): Promise<Blob> {
  const doc = await loadPdf(file);
  const total = doc.getPageCount();
  const set = parsePageSet(pageNums, total);
  for (let i = 0; i < total; i++) {
    if (set.size === 0 || set.has(i + 1)) {
      const page = doc.getPage(i);
      page.setRotation(degrees((page.getRotation().angle + deg + 360) % 360));
    }
  }
  return bytesToBlob(await doc.save());
}

/* ─────────────────────────────────────────────────────────────
   7. DELETE PAGES
───────────────────────────────────────────────────────────── */
export async function deletePages(file: File, pageNums: string): Promise<Blob> {
  const doc = await loadPdf(file);
  const total = doc.getPageCount();
  const toDelete = parsePageSet(pageNums, total);
  const keep = Array.from({ length: total }, (_, i) => i).filter(i => !toDelete.has(i + 1));
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, keep);
  pages.forEach(p => out.addPage(p));
  return bytesToBlob(await out.save());
}

/* ─────────────────────────────────────────────────────────────
   8. ORGANIZE (reorder)
───────────────────────────────────────────────────────────── */
export async function organizePdf(file: File, orderStr: string): Promise<Blob> {
  const doc = await loadPdf(file);
  const total = doc.getPageCount();
  const order = orderStr.split(",").map(s => Math.max(1, Math.min(total, parseInt(s.trim()))) - 1);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, order);
  pages.forEach(p => out.addPage(p));
  return bytesToBlob(await out.save());
}

/* ─────────────────────────────────────────────────────────────
   9. CROP
───────────────────────────────────────────────────────────── */
export async function cropPdf(file: File, top: number, bottom: number, left: number, right: number): Promise<Blob> {
  const doc = await loadPdf(file);
  for (let i = 0; i < doc.getPageCount(); i++) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    page.setCropBox(left, bottom, width - left - right, height - top - bottom);
  }
  return bytesToBlob(await doc.save());
}

/* ─────────────────────────────────────────────────────────────
   10. WATERMARK
───────────────────────────────────────────────────────────── */
export async function watermarkPdf(
  file: File, text: string, opacity: number, size: number,
  hexColor: string, diagonal: boolean
): Promise<Blob> {
  const doc = await loadPdf(file);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const col = hexToRgb(hexColor);

  for (let i = 0; i < doc.getPageCount(); i++) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const tw = font.widthOfTextAtSize(text, size);

    page.drawText(text, {
      x: (width - tw) / 2,
      y: height / 2 - size / 2,
      size,
      font,
      color: rgb(col.r, col.g, col.b),
      opacity,
      rotate: diagonal ? degrees(45) : degrees(0),
    });
  }
  return bytesToBlob(await doc.save());
}

/* ─────────────────────────────────────────────────────────────
   11. ADD PAGE NUMBERS
───────────────────────────────────────────────────────────── */
export async function addPageNumbers(
  file: File, start: number, position: string, prefix: string, suffix: string, size: number
): Promise<Blob> {
  const doc = await loadPdf(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < doc.getPageCount(); i++) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const label = `${prefix}${start + i}${suffix}`;
    const tw = font.widthOfTextAtSize(label, size);

    let x = 0, y = 0;
    const margin = 24;
    switch (position) {
      case "bottom-center": x = (width - tw) / 2; y = margin; break;
      case "bottom-left":   x = margin; y = margin; break;
      case "bottom-right":  x = width - tw - margin; y = margin; break;
      case "top-center":    x = (width - tw) / 2; y = height - margin - size; break;
      case "top-left":      x = margin; y = height - margin - size; break;
      case "top-right":     x = width - tw - margin; y = height - margin - size; break;
      default:              x = (width - tw) / 2; y = margin;
    }
    page.drawText(label, { x, y, size, font, color: rgb(0, 0, 0) });
  }
  return bytesToBlob(await doc.save());
}

/* ─────────────────────────────────────────────────────────────
   12. FLATTEN PDF (remove form fields)
───────────────────────────────────────────────────────────── */
export async function flattenPdf(file: File): Promise<Blob> {
  const doc = await loadPdf(file);
  const form = doc.getForm();
  try { form.flatten(); } catch { /* no form fields */ }
  return bytesToBlob(await doc.save());
}

/* ─────────────────────────────────────────────────────────────
   13. REPAIR (re-save with recovery)
───────────────────────────────────────────────────────────── */
export async function repairPdf(file: File): Promise<Blob> {
  const doc = await loadPdf(file);
  return bytesToBlob(await doc.save({ useObjectStreams: false }));
}

/* ─────────────────────────────────────────────────────────────
   14. COMPARE — returns diff text
───────────────────────────────────────────────────────────── */
export async function comparePdfs(f1: File, f2: File): Promise<string> {
  const [t1, t2] = await Promise.all([extractText(f1), extractText(f2)]);
  const lines1 = t1.split("\n");
  const lines2 = t2.split("\n");
  const max = Math.max(lines1.length, lines2.length);
  let diffs = 0;
  const report: string[] = [
    `=== PDF COMPARISON ===`,
    `File 1: ${f1.name}`,
    `File 2: ${f2.name}`,
    `Lines in file 1: ${lines1.length}`,
    `Lines in file 2: ${lines2.length}`,
    ``,
    `--- DIFFERENCES ---`];

  for (let i = 0; i < max; i++) {
    const a = lines1[i] ?? "(no line)";
    const b = lines2[i] ?? "(no line)";
    if (a !== b) {
      diffs++;
      report.push(`Line ${i + 1}:`);
      report.push(`  < ${a}`);
      report.push(`  > ${b}`);
    }
  }
  report.push(``, `Total differences: ${diffs}`);
  if (diffs === 0) report.push("✓ Files appear identical.");
  return report.join("\n");
}

/* ─────────────────────────────────────────────────────────────
   15. ADD TEXT
───────────────────────────────────────────────────────────── */
export async function addTextToPdf(
  file: File, text: string, x: number, y: number,
  pageNum: number, size: number, hexColor: string, bold: boolean
): Promise<Blob> {
  const doc = await loadPdf(file);
  const idx = Math.max(0, Math.min(doc.getPageCount() - 1, pageNum - 1));
  const page = doc.getPage(idx);
  const font = await doc.embedFont(bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
  const col = hexToRgb(hexColor);
  page.drawText(text, { x, y, size, font, color: rgb(col.r, col.g, col.b) });
  return bytesToBlob(await doc.save());
}

/* ─────────────────────────────────────────────────────────────
   15. SIGN (embed image)
───────────────────────────────────────────────────────────── */
export async function signPdf(
  pdfFile: File, sigDataUrl: string,
  x: number, y: number, w: number, h: number, pageNum: number
): Promise<Blob> {
  const doc = await loadPdf(pdfFile);
  const idx = Math.max(0, Math.min(doc.getPageCount() - 1, pageNum - 1));
  const page = doc.getPage(idx);

  const base64 = sigDataUrl.replace(/^data:image\/png;base64,/, "");
  const pngBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const img = await doc.embedPng(pngBytes);
  page.drawImage(img, { x, y, width: w, height: h });
  return bytesToBlob(await doc.save());
}

/* ─────────────────────────────────────────────────────────────
   16. IMAGES → PDF
───────────────────────────────────────────────────────────── */
export async function imagesToPdf(files: File[]): Promise<Blob> {
  const doc = await PDFDocument.create();
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isJpeg = file.type === "image/jpeg" || file.name.toLowerCase().endsWith(".jpg");
    const img = isJpeg ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  return bytesToBlob(await doc.save());
}

/* ─────────────────────────────────────────────────────────────
   17. PDF → JPG  (uses pdfjs-dist, dynamically imported)
───────────────────────────────────────────────────────────── */
export async function pdfToImages(file: File, dpi: number, quality: number): Promise<{ name: string; blob: Blob }[]> {
  // Ensure correct ESM worker is used
  initPdfWorker();

  const pdfjsLib = await import("pdfjs-dist");
  const arrayBuffer = await file.arrayBuffer();
  // Fix: Ensure data is passed as Uint8Array for pdfjs v4 compatibility
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const scale = dpi / 72;
  const results: { name: string; blob: Blob }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), "image/jpeg", quality / 100));
    results.push({ name: `page_${i}.jpg`, blob: blob! });
  }
  return results;
}

/* ─────────────────────────────────────────────────────────────
   18. EXTRACT TEXT (via pdfjs)
───────────────────────────────────────────────────────────── */
export async function extractText(file: File): Promise<string> {
  // Ensure correct ESM worker is used
  initPdfWorker();

  const pdfjsLib = await import("pdfjs-dist");
  const buf = await file.arrayBuffer();
  // Fix: Ensure data is passed as Uint8Array for pdfjs v4 compatibility
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((item: any) => item.str).join(" "));
  }
  return parts.join("\n");
}

/* ─────────────────────────────────────────────────────────────
   19. MAGE TO PDF
───────────────────────────────────────────────────────────── */
export async function addImageToPdf(
  pdfFile: File, imageFile: File,
  x: number, y: number, w: number, h: number, pageNum: number
): Promise<Blob> {
  const doc = await loadPdf(pdfFile);
  const idx = Math.max(0, Math.min(doc.getPageCount() - 1, pageNum - 1));
  const page = doc.getPage(idx);
  const imgBytes = new Uint8Array(await imageFile.arrayBuffer());
  const isJpeg = imageFile.type === "image/jpeg" || imageFile.name.toLowerCase().endsWith(".jpg");
  const img = isJpeg ? await doc.embedJpg(imgBytes) : await doc.embedPng(imgBytes);
  page.drawImage(img, { x, y, width: w, height: h });
  return bytesToBlob(await doc.save());
}

/* ─────────────────────────────────────────────────────────────
   20. PDF METADATA EDIT
───────────────────────────────────────────────────────────── */
export async function editMetadata(
  file: File, title: string, author: string, subject: string, keywords: string
): Promise<Blob> {
  const doc = await loadPdf(file);
  doc.setTitle(title || "");
  doc.setAuthor(author || "");
  doc.setSubject(subject || "");
  doc.setKeywords(keywords.trim() ? keywords.split(",").map(s => s.trim()).filter(Boolean) : []);
  return bytesToBlob(await doc.save());
}

/* ─────────────────────────────────────────────────────────────
   21. ZIP helpers (uses JSZip)
───────────────────────────────────────────────────────────── */
export async function filesToZip(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const f of files) zip.file(f.name, f.blob);
  return zip.generateAsync({ type: "blob" });
}

export async function zipToPdfs(zipFile: File): Promise<File[]> {
  const MAX_ARCHIVE = 50 * 1024 * 1024;
  const MAX_ENTRIES = 500;
  const MAX_ENTRY = 50 * 1024 * 1024;
  const MAX_TOTAL = 250 * 1024 * 1024;
  if (!/\.zip$/i.test(zipFile.name)) throw new Error('Please choose a ZIP file.');
  if (zipFile.size > MAX_ARCHIVE) throw new Error('ZIP file is too large. Maximum size is 50 MB.');
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await zipFile.arrayBuffer());
  const entries = Object.entries(zip.files).filter(([, zf]) => !zf.dir);
  if (entries.length > MAX_ENTRIES) throw new Error(`ZIP has too many files. Maximum is ${MAX_ENTRIES}.`);
  let total = 0;
  for (const [, zf] of entries) {
    const declared = Number((zf as any)?._data?.uncompressedSize || 0);
    if (declared > MAX_ENTRY) throw new Error('A file inside the ZIP is too large.');
    total += declared;
  }
  if (total > MAX_TOTAL) throw new Error('ZIP expands beyond the 250 MB safety limit.');
  total = 0;
  const results: File[] = [];
  for (const [name, zf] of entries) {
    if (!/\.(pdf|jpe?g|png|gif|bmp|webp)$/i.test(name)) continue;
    const blob = await zf.async("blob");
    if (blob.size > MAX_ENTRY) throw new Error(`File ${name} is too large.`);
    total += blob.size;
    if (total > MAX_TOTAL) throw new Error('ZIP expands beyond the 250 MB safety limit.');
    results.push(new File([blob], name, { type: blob.type }));
  }
  return results;
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
export function parsePageSet(str: string, total: number): Set<number> {
  const s = new Set<number>();
  if (!str.trim() || str.trim().toLowerCase() === "all") return s;
  for (const part of str.split(",")) {
    const t = part.trim();
    if (t.includes("-")) {
      const [aStr, bStr] = t.split("-");
      const a = aStr ? Math.max(1, Math.min(total, parseInt(aStr))) : 1;
      const b = bStr ? Math.max(1, Math.min(total, parseInt(bStr))) : total;
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) s.add(i);
    } else if (!isNaN(parseInt(t))) {
      s.add(parseInt(t));
    }
  }
  return s;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0.5, g: 0.5, b: 0.5 };
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}


export type ImagePageSize = 'auto' | 'a4' | 'letter';
export type ImageFit = 'contain' | 'cover' | 'original';
export interface ImagesToPdfOptions {
  pageSize: ImagePageSize;
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: number;
  fit: ImageFit;
  background: string;
}

function hexRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const n = Number.parseInt(normalized.length === 3 ? normalized.split('').map(c => c + c).join('') : normalized, 16);
  if (!Number.isFinite(n)) return rgb(1, 1, 1);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export async function imagesToPdfWithOptions(files: File[], options: ImagesToPdfOptions): Promise<Blob> {
  const doc = await PDFDocument.create();
  const standardSizes = { a4: [595.28, 841.89], letter: [612, 792] } as const;
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const lower = file.name.toLowerCase();
    const image = file.type === 'image/jpeg' || lower.endsWith('.jpg') || lower.endsWith('.jpeg')
      ? await doc.embedJpg(bytes)
      : await doc.embedPng(bytes);
    let pageW = image.width;
    let pageH = image.height;
    if (options.pageSize !== 'auto') [pageW, pageH] = [...standardSizes[options.pageSize]];
    const wanted = options.orientation === 'auto'
      ? (image.width > image.height ? 'landscape' : 'portrait')
      : options.orientation;
    if ((wanted === 'landscape' && pageH > pageW) || (wanted === 'portrait' && pageW > pageH)) {
      [pageW, pageH] = [pageH, pageW];
    }
    const page = doc.addPage([pageW, pageH]);
    page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: hexRgb(options.background) });
    const maxW = Math.max(1, pageW - options.margin * 2);
    const maxH = Math.max(1, pageH - options.margin * 2);
    let drawW = image.width;
    let drawH = image.height;
    if (options.fit !== 'original') {
      const scale = options.fit === 'cover'
        ? Math.max(maxW / image.width, maxH / image.height)
        : Math.min(maxW / image.width, maxH / image.height);
      drawW = image.width * scale;
      drawH = image.height * scale;
    } else {
      const scale = Math.min(1, maxW / image.width, maxH / image.height);
      drawW *= scale;
      drawH *= scale;
    }
    page.drawImage(image, { x: (pageW - drawW) / 2, y: (pageH - drawH) / 2, width: drawW, height: drawH });
  }
  return bytesToBlob(await doc.save({ useObjectStreams: true }));
}

export function parseRangeGroups(input: string, total: number): number[][] {
  const rawGroups = input.split(',').map(v => v.trim()).filter(Boolean);
  if (!rawGroups.length) throw new Error('Enter at least one page or range.');
  return rawGroups.map(group => {
    const match = group.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error(`Invalid page range: ${group}`);
    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);
    if (start < 1 || end < start || end > total) throw new Error(`Page range ${group} is outside 1-${total}.`);
    return Array.from({ length: end - start + 1 }, (_, index) => start - 1 + index);
  });
}

export async function splitPdfAdvanced(file: File, groups: number[][], prefix = 'part'): Promise<{ name: string; blob: Blob }[]> {
  const doc = await loadPdf(file);
  const results = [];
  for (let i = 0; i < groups.length; i++) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(doc, groups[i]);
    pages.forEach(page => out.addPage(page));
    results.push({ name: `${prefix}_${i + 1}.pdf`, blob: bytesToBlob(await out.save()) });
  }
  return results;
}

export async function getPdfPageCount(file: File): Promise<number> {
  return (await loadPdf(file)).getPageCount();
}

export async function pdfToImagesAdvanced(
  file: File,
  options: { dpi: number; quality: number; format: 'jpeg' | 'png'; pages?: number[]; prefix?: string }
): Promise<{ name: string; blob: Blob }[]> {
  initPdfWorker();
  const pdfjsLib = await import('pdfjs-dist');
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const selected = options.pages?.length ? options.pages : Array.from({ length: pdf.numPages }, (_, i) => i + 1);
  const results: { name: string; blob: Blob }[] = [];
  for (const pageNumber of selected) {
    if (pageNumber < 1 || pageNumber > pdf.numPages) throw new Error(`Page ${pageNumber} is outside the document.`);
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: options.dpi / 72 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
    const mime = options.format === 'png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image encoding failed.')), mime, options.quality / 100));
    results.push({ name: `${options.prefix || 'page'}_${pageNumber}.${options.format === 'png' ? 'png' : 'jpg'}`, blob });
  }
  return results;
}
