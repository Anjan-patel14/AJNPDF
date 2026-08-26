import { getPdfBackendErrorCode, getPdfBackendErrorRequestId } from '@/lib/pdf-backend';

type Translator = (key: string, vars?: Record<string, string | number>) => string;

const KNOWN_CODES = new Set([
  'INVALID_FILE', 'FILE_TOO_LARGE', 'WRONG_PASSWORD', 'CORRUPT_FILE', 'CORRUPT_PDF',
  'UNSUPPORTED_FORMAT', 'RATE_LIMITED', 'SERVICE_UNAVAILABLE', 'INVALID_REQUEST',
  'PROCESSING_FAILED', 'REQUEST_FAILED', 'TIMEOUT', 'CANCELLED']);

export function friendlyBackendError(t: Translator, error: unknown, fallbackKey = 'errors.processingFailed'): string {
  const code = getPdfBackendErrorCode(error);
  const message = code && KNOWN_CODES.has(code) ? t(`errors.${code}`) : t(fallbackKey);
  const requestId = getPdfBackendErrorRequestId(error);
  return requestId ? `${message} · Ref ${requestId}` : message;
}
