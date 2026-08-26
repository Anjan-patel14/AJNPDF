import { getToolPolicy } from './tool-policy';
import { MERGE_PDF_LIMITS, SERVER_LIMIT_DEFAULTS } from './tool-limit-constants';
export { MERGE_PDF_LIMITS, SERVER_LIMIT_DEFAULTS } from './tool-limit-constants';

export type ExecutionMode = 'local' | 'server';
export type ToolLimitProfile = {
  executionMode: ExecutionMode; maxFiles: number; maxFileSizeMb: number; maxTotalSizeMb?: number;
  maxPdfPages?: number; maxImageMegapixels?: number; maxOutputMb?: number; processingTimeoutSeconds?: number;
};

export type BackendLimitSource = { maxFileMb?: number; maxTotalMb?: number; processingTimeoutSeconds?: number } | null | undefined;
function finitePositive(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}
export function resolveBackendLimits(health?: BackendLimitSource) {
  return {
    maxFileSizeMb: finitePositive(health?.maxFileMb) ?? SERVER_LIMIT_DEFAULTS.maxFileSizeMb,
    maxTotalSizeMb: finitePositive(health?.maxTotalMb) ?? SERVER_LIMIT_DEFAULTS.maxTotalSizeMb,
    processingTimeoutSeconds: finitePositive(health?.processingTimeoutSeconds) ?? SERVER_LIMIT_DEFAULTS.processingTimeoutSeconds,
  };
}
export function validateBackendSelection(files: File[], maxFiles: number, health?: BackendLimitSource): string | null {
  const limits = resolveBackendLimits(health);
  if (files.length > maxFiles) return `Choose no more than ${maxFiles} file${maxFiles === 1 ? '' : 's'} for this request.`;
  const maxFileBytes = limits.maxFileSizeMb * 1024 * 1024;
  const maxTotalBytes = limits.maxTotalSizeMb * 1024 * 1024;
  const oversized = files.find((file) => file.size > maxFileBytes);
  if (oversized) return `${oversized.name} exceeds the live ${limits.maxFileSizeMb} MB server limit.`;
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > maxTotalBytes) return `Selected files exceed the live ${limits.maxTotalSizeMb} MB total server limit.`;
  return null;
}

function hasPdfInput(id: string): boolean {
  return id.startsWith('pdf-') || id.startsWith('pdf-to-') || id.startsWith('scanned-pdf-') || id.endsWith('-pdf') || id.includes('pdf-pages');
}
function hasImageInput(id: string): boolean {
  return /image|jpg|jpeg|png|webp|tiff|bmp|gif|svg|heic|avif|camera|receipt|scanner|handwriting/.test(id);
}
export function getToolLimitProfile(id: string): ToolLimitProfile {
  const policy = getToolPolicy(id);
  if (policy.processingMode === 'temporary-server') {
    return { executionMode: 'server', maxFiles: policy.maxFiles, maxFileSizeMb: policy.maxFileSizeMb,
      maxTotalSizeMb: SERVER_LIMIT_DEFAULTS.maxTotalSizeMb, maxPdfPages: hasPdfInput(id) ? SERVER_LIMIT_DEFAULTS.maxPdfPages : undefined,
      maxImageMegapixels: hasImageInput(id) ? SERVER_LIMIT_DEFAULTS.maxImageMegapixels : undefined, maxOutputMb: SERVER_LIMIT_DEFAULTS.maxOutputMb,
      processingTimeoutSeconds: SERVER_LIMIT_DEFAULTS.processingTimeoutSeconds };
  }
  return { executionMode: 'local', maxFiles: policy.maxFiles, maxFileSizeMb: policy.maxFileSizeMb,
    maxTotalSizeMb: id === 'merge-pdf' ? MERGE_PDF_LIMITS.maxTotalSizeMb : undefined };
}
