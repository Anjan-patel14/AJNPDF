export interface FileValidationOptions {
  extensions?: string[];
  mimeTypes?: string[];
  maxSizeMb?: number;
  maxFiles?: number;
  minFiles?: number;
}

export function validateFiles(files: File[], options: FileValidationOptions): string | null {
  const { extensions = [], mimeTypes = [], maxSizeMb = 50, maxFiles = 30, minFiles = 1 } = options;
  if (files.length < minFiles) return `Select at least ${minFiles} file${minFiles === 1 ? '' : 's'}.`;
  if (files.length > maxFiles) return `Select no more than ${maxFiles} files.`;
  const maxBytes = maxSizeMb * 1024 * 1024;
  for (const file of files) {
    if (file.size === 0) return `${file.name} is empty.`;
    if (file.size > maxBytes) return `${file.name} exceeds the ${maxSizeMb} MB limit.`;
    const ext = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
    if (extensions.length && !extensions.map(x => x.toLowerCase()).includes(ext)) {
      return `${file.name} is not a supported file type.`;
    }
    if (mimeTypes.length && file.type && !mimeTypes.includes(file.type)) {
      return `${file.name} does not match the expected file format.`;
    }
  }
  return null;
}

export async function hasPdfHeader(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return new TextDecoder().decode(bytes) === '%PDF-';
}

export function isPdfCandidate(file: File): boolean {
  const mime = String(file.type || '').toLowerCase();
  return mime === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export async function validatePdfFile(file: File, maxSizeMb = 50): Promise<string | null> {
  if (!isPdfCandidate(file)) return `${file.name} is not a PDF file.`;
  const basic = validateFiles([file], { minFiles: 1, maxFiles: 1, maxSizeMb });
  if (basic) return basic;
  if (!(await hasPdfHeader(file))) return `${file.name} is not a readable PDF file.`;
  return null;
}

export function safeOutputName(value: string, fallback: string, extension: string): string {
  const cleaned = value.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, ' ').slice(0, 120);
  const base = cleaned || fallback;
  return base.toLowerCase().endsWith(extension.toLowerCase()) ? base : `${base}${extension}`;
}
