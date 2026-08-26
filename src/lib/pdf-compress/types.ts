'use client';

export type CompressionLevel = "extreme" | "recommended" | "less" | "custom";

export interface CompressionSettings {
  quality: number;
  maxWidth: number;
  grayscale: boolean;
  removeMetadata: boolean;
}

export const COMPRESSION_CONFIG: Record<string, CompressionSettings> = {
  extreme: {
    quality: 0.3,
    maxWidth: 800,
    grayscale: true,
    removeMetadata: true,
  },
  recommended: {
    quality: 0.6,
    maxWidth: 1200,
    grayscale: false,
    removeMetadata: true,
  },
  less: {
    quality: 0.85,
    maxWidth: 2000,
    grayscale: false,
    removeMetadata: false,
  },
};
