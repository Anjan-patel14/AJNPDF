
'use client';

import { CompressionLevel, CompressionSettings } from "./types";

/**
 * AJN Master PDF Compression Wrapper
 * Transfers PDF data to the background worker.
 */
export function compressPDF(
  file: File,
  level: CompressionLevel = "recommended",
  customSettings?: Partial<CompressionSettings>,
  onProgress?: (p: number) => void
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    if (file.size > 200 * 1024 * 1024) {
      reject(new Error("File too large. Max 200MB allowed."));
      return;
    }

    const worker = new Worker(
      new URL("./pdfWorker.ts", import.meta.url),
      { type: "module" }
    );

    try {
      const buffer = await file.arrayBuffer();
      
      // Clone buffer to maintain integrity during transfer
      const workBuffer = buffer.slice(0);

      worker.postMessage({ 
        fileBuffer: workBuffer, 
        level,
        customSettings 
      }, [workBuffer]);

      worker.onmessage = (e) => {
        const { type, value, data, error } = e.data;

        if (type === "progress") {
          onProgress?.(value);
        }

        if (type === "done") {
          const blob = new Blob([data.buffer as ArrayBuffer], { type: "application/pdf" });
          worker.terminate();
          resolve(blob);
        }

        if (type === "error") {
          worker.terminate();
          reject(new Error(error));
        }
      };

      worker.onerror = () => {
        worker.terminate();
        reject(new Error("Worker thread failed. Check PDF integrity."));
      };
    } catch (err: any) {
      worker.terminate();
      reject(err);
    }
  });
}
