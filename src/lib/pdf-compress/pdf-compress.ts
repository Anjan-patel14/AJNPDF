'use client';

import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { initPdfWorker } from '../pdfjs-worker';

/**
 * AJN MASTER PDF COMPRESSION — Production v4.0
 * Hardened for Memory Safety and High-Fidelity Local Processing.
 */

export type CompressionLevel = 'extreme' | 'recommended' | 'less';

export interface CompressionOptions {
  level: CompressionLevel;
  onProgress: (step: string, percent: number) => void;
}

export interface CompressionResult {
  data: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savedPercent: number;
  pageCount: number;
  timeTaken: number;
}

export const COMPRESSION_PRESETS = {
  extreme: {
    label: 'Extreme Compression',
    description: 'Minimal quality, maximum reduction',
    imageScale: 0.4,
    jpegQuality: 0.4,
    targetDPI: 72,
    badge: '🚀',
    color: 'text-red-500',
    bg: 'bg-red-500/10'
  },
  recommended: {
    label: 'Recommended Compression',
    description: 'Optimal quality and size',
    imageScale: 0.75,
    jpegQuality: 0.75,
    targetDPI: 150,
    badge: '⭐',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  less: {
    label: 'Less compression',
    description: 'High quality, minimal reduction',
    imageScale: 1.0,
    jpegQuality: 0.92,
    targetDPI: 300,
    badge: '✨',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
} as const;

export async function compressPDF(
  file: File,
  options: CompressionOptions
): Promise<CompressionResult> {
  const startTime = Date.now();
  const originalSize = file.size;
  const preset = COMPRESSION_PRESETS[options.level];
  const { onProgress } = options;

  onProgress('Preparing PDF data...', 5);
  const arrayBuffer = await file.arrayBuffer();

  // Validate integrity and check for encryption
  try {
    await PDFDocument.load(arrayBuffer.slice(0), { ignoreEncryption: false });
  } catch (err: any) {
    const msg = (err?.message ?? "").toString().toLowerCase();
    if (msg.includes('password') || msg.includes('encrypted')) {
      throw new Error("Encrypted buffer detected. Removal of protection is required first.");
    }
  }
  
  onProgress('Initializing worker thread...', 10);
  if (typeof window !== 'undefined') {
    initPdfWorker();
  }
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer.slice(0)),
  });
  const pdfjsDoc = await loadingTask.promise;
  const pageCount = pdfjsDoc.numPages;

  const newDoc = await PDFDocument.create();
  
  for (let i = 1; i <= pageCount; i++) {
    // Yield to main thread to keep UI responsive
    await new Promise(resolve => requestAnimationFrame(resolve));

    const pct = 10 + Math.round((i / pageCount) * 85);
    onProgress(`Optimizing page ${i} of ${pageCount}...`, pct);

    const page = await pdfjsDoc.getPage(i);
    const viewport = page.getViewport({ scale: preset.imageScale });
    const baseViewport = page.getViewport({ scale: 1 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })!;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    
    // Memory-safe Blob extraction
    const imageBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', preset.jpegQuality));
    if (!imageBlob) throw new Error("Memory error during page rasterization.");
    
    const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
    const jpgImage = await newDoc.embedJpg(imageBytes);
    
    const newPage = newDoc.addPage([baseViewport.width, baseViewport.height]);
    newPage.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height,
    });

    // Cleanup resources for this segment
    canvas.width = 0; 
    canvas.height = 0;
    page.cleanup();
  }

  onProgress('Finalizing document...', 98);
  const compressedData = await newDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  await pdfjsDoc.destroy();
  onProgress('Success', 100);

  return {
    data: compressedData,
    originalSize,
    compressedSize: compressedData.byteLength,
    savedBytes: originalSize - compressedData.byteLength,
    savedPercent: Math.max(0, ((originalSize - compressedData.byteLength) / originalSize) * 100),
    pageCount,
    timeTaken: Date.now() - startTime,
  };
}
