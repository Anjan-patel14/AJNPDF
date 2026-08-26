'use client';

import * as pdfjsLib from 'pdfjs-dist';

const PDF_WORKER_SRC = '/pdf.worker.min.mjs';

/**
 * PDF.js worker configuration for AJN PDF browser workflows.
 * The worker is copied from the installed, pinned pdfjs-dist package into
 * public/ before dev/build so it is served from the AJN PDF origin and remains
 * compatible with the production worker-src/script-src CSP.
 */
export function initPdfWorker() {
  if (typeof window === 'undefined') return;
  if (pdfjsLib.GlobalWorkerOptions.workerSrc !== PDF_WORKER_SRC) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  }
}
