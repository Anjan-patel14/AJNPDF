const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export function imageExtensionFromBlob(blob: Blob | null | undefined): string {
  if (!blob) return '.png';
  const extension = MIME_EXTENSION[blob.type];
  if (!extension) {
    throw new Error(`Unsupported image output MIME type: ${blob.type || 'unknown'}.`);
  }
  return extension;
}

export function safeImageOutputName(
  value: string,
  fallbackBase: string,
  blob: Blob | null | undefined,
): string {
  const extension = imageExtensionFromBlob(blob);
  const cleaned = String(value || '')
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .slice(0, 120);
  const withoutKnownExtension = cleaned.replace(/\.(jpe?g|png|webp|bmp|gif|tiff?)$/i, '');
  const base = withoutKnownExtension || fallbackBase;
  return `${base}${extension}`;
}

export function preferredImageExtension(file: File | null | undefined): string {
  const name = String(file?.name || '').toLowerCase();
  if (name.endsWith('.webp')) return '.webp';
  if (name.endsWith('.png') || name.endsWith('.gif') || name.endsWith('.bmp')) return '.png';
  return '.jpg';
}
