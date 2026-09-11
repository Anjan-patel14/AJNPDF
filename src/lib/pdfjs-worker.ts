'use client';

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const PDF_WORKER_SRC = '/pdf.worker.min.mjs';

/** All tools and the copied worker use the same pinned PDF.js compatibility build. */
export function initPdfWorker() {
  if (typeof window === 'undefined') return;
  if (pdfjsLib.GlobalWorkerOptions.workerSrc !== PDF_WORKER_SRC) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  }
}
