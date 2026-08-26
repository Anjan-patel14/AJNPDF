export const SERVER_LIMIT_DEFAULTS = {
  maxFileSizeMb: 30, maxTotalSizeMb: 30, maxPdfPages: 300, maxImageMegapixels: 80,
  maxOutputMb: 500, processingTimeoutSeconds: 300,
} as const;
export const MERGE_PDF_LIMITS = { maxFiles: 30, maxFileSizeMb: 50, maxTotalSizeMb: 150 } as const;
