'use client';

/**
 * AJN Master PDF Compression Module
 * Main entry point for decoupled worker-based processing.
 */

export interface CompressionSettings {
  imageQuality: number;
  maxImageWidth: number;
  maxImageHeight: number;
  grayscaleImages: boolean;
  removeMetadata: boolean;
  removeAnnotations: boolean;
  removeFormFields: boolean;
  recompressImages: boolean;
}

export const COMPRESSION_PROFILES: Record<string, CompressionSettings> = {
  low: {
    imageQuality: 0.92,
    maxImageWidth: 2400,
    maxImageHeight: 3400,
    grayscaleImages: false,
    removeMetadata: false,
    removeAnnotations: false,
    removeFormFields: false,
    recompressImages: true,
  },
  medium: {
    imageQuality: 0.75,
    maxImageWidth: 1600,
    maxImageHeight: 2200,
    grayscaleImages: false,
    removeMetadata: true,
    removeAnnotations: false,
    removeFormFields: false,
    recompressImages: true,
  },
  high: {
    imageQuality: 0.55,
    maxImageWidth: 1200,
    maxImageHeight: 1600,
    grayscaleImages: false,
    removeMetadata: true,
    removeAnnotations: true,
    removeFormFields: false,
    recompressImages: true,
  },
  extreme: {
    imageQuality: 0.35,
    maxImageWidth: 800,
    maxImageHeight: 1100,
    grayscaleImages: true,
    removeMetadata: true,
    removeAnnotations: true,
    removeFormFields: true,
    recompressImages: true,
  }
};

export async function compressPDF(
  file: File,
  settings: CompressionSettings,
  onProgress?: (pct: number, stage: string) => void
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    if (file.size > 100 * 1024 * 1024) {
      reject(new Error("File too large (max 100MB for local session)"));
      return;
    }

    const worker = new Worker(
      new URL('./worker.ts', import.meta.url),
      { type: 'module' }
    );

    try {
      const buffer = await file.arrayBuffer();
      worker.postMessage({ fileBuffer: buffer, settings }, [buffer]);

      worker.onmessage = (e) => {
        const { type, value, stage, data, error } = e.data;

        if (type === 'progress') {
          onProgress?.(value, stage);
        }

        if (type === 'done') {
          const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' });
          worker.terminate();
          resolve(blob);
        }

        if (type === 'error') {
          worker.terminate();
          reject(new Error(error));
        }
      };

      worker.onerror = (err) => {
        worker.terminate();
        reject(err);
      };
    } catch (err) {
      worker.terminate();
      reject(err);
    }
  });
}