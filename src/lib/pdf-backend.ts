import { configuredPdfBackendCandidates, DEFAULT_PDF_BACKEND_URL } from './backend-service-url';

const SERVICE_CANDIDATES = configuredPdfBackendCandidates(process.env.NODE_ENV === 'production');
const NORMALIZED_ENV_URL = SERVICE_CANDIDATES.find((candidate) => candidate !== DEFAULT_PDF_BACKEND_URL) || '';
export const PDF_BACKEND_URL = SERVICE_CANDIDATES[0] || DEFAULT_PDF_BACKEND_URL;
export const isPdfBackendConfigured = SERVICE_CANDIDATES.length > 0;
export const PDF_BACKEND_USING_FALLBACK = !NORMALIZED_ENV_URL;
let activeServiceUrl = PDF_BACKEND_URL;

function currentServiceUrl(): string { return activeServiceUrl || PDF_BACKEND_URL; }

export class PdfBackendError extends Error {
  code: string;
  status?: number;
  requestId?: string;

  constructor(message: string, code = 'REQUEST_FAILED', status?: number, requestId?: string) {
    super(message);
    this.name = 'PdfBackendError';
    this.code = code;
    this.status = status;
    this.requestId = requestId || undefined;
  }
}

export function getPdfBackendErrorCode(error: unknown): string | null {
  return error instanceof PdfBackendError ? error.code : null;
}

export function getPdfBackendErrorRequestId(error: unknown): string | null {
  return error instanceof PdfBackendError ? error.requestId || null : null;
}

export type PdfBackendHealth = {
  status: 'online' | 'offline' | 'not-configured';
  message: string;
  messageKey: string;
  service?: string;
  version?: string;
  maxFileMb?: number;
  maxTotalMb?: number;
  maxConcurrentJobs?: number;
  processingTimeoutSeconds?: number;
  conversionTools?: number;
  availableConversionTools?: number;
};

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller, { once: true });
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

export async function checkPdfBackendHealth(signal?: AbortSignal): Promise<PdfBackendHealth> {
  if (!isPdfBackendConfigured) {
    return { status: 'not-configured', message: 'This feature is temporarily unavailable.', messageKey: 'backend.notConfigured' };
  }

  for (const candidate of SERVICE_CANDIDATES) {
    try {
      const response = await fetchWithTimeout(`${candidate}/ready`, { method: 'GET', cache: 'no-store' }, 7000, signal);
      if (!response.ok) continue;
      const payload = await response.json().catch(() => ({}));
      if (payload?.status !== 'ok') continue;
      activeServiceUrl = candidate;
      return {
        status: 'online',
        message: 'Ready to use.',
        messageKey: 'backend.ready',
        service: payload.service,
        version: payload.version,
        maxFileMb: Number.isFinite(Number(payload.max_file_mb)) ? Number(payload.max_file_mb) : undefined,
        maxTotalMb: Number.isFinite(Number(payload.max_total_mb)) ? Number(payload.max_total_mb) : undefined,
        maxConcurrentJobs: Number.isFinite(Number(payload.max_concurrent_jobs)) ? Number(payload.max_concurrent_jobs) : undefined,
        processingTimeoutSeconds: Number.isFinite(Number(payload.processing_timeout_seconds)) ? Number(payload.processing_timeout_seconds) : undefined,
        conversionTools: Number.isFinite(Number(payload.conversion_tools)) ? Number(payload.conversion_tools) : undefined,
        availableConversionTools: Number.isFinite(Number(payload.available_conversion_tools)) ? Number(payload.available_conversion_tools) : undefined,
      };
    } catch {
      if (signal?.aborted) break;
    }
  }
  return { status: 'offline', message: 'Online tools are temporarily unavailable.', messageKey: 'backend.offline' };
}

const SECURITY_RETRY_STATUSES = new Set([502, 503, 504]);

function securityRetryDelay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function postPdf(path: string, form: FormData): Promise<Blob> {
  if (!isPdfBackendConfigured) {
    throw new PdfBackendError('The secure processing service is not configured.', 'SERVICE_UNAVAILABLE');
  }

  const candidates = [...new Set([currentServiceUrl(), ...SERVICE_CANDIDATES].filter(Boolean))];
  let lastError: PdfBackendError | null = null;

  for (const candidate of candidates) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 190_000);
      try {
        const response = await fetch(`${candidate}${path}`, {
          method: 'POST',
          body: form,
          signal: controller.signal,
        });

        if (response.ok) {
          activeServiceUrl = candidate;
          return await response.blob();
        }

        const payload = await response.json().catch(() => ({}));
        const requestError = new PdfBackendError(
          payload.error || `Could not complete this request (${response.status}).`,
          payload.code || 'PROCESSING_FAILED',
          response.status,
          response.headers.get('x-request-id') || payload.request_id,
        );
        lastError = requestError;

        // Validation, password, authorization, format and rate-limit failures are
        // definitive responses and must never be hidden behind a retry.
        if (!SECURITY_RETRY_STATUSES.has(response.status)) {
          throw requestError;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new PdfBackendError(
            'This request took too long. Try a smaller file or try again.',
            'TIMEOUT',
          );
        }

        if (error instanceof TypeError) {
          lastError = new PdfBackendError(
            'The secure processor could not be reached. Please try again.',
            'SERVICE_UNAVAILABLE',
          );
        } else if (error instanceof PdfBackendError) {
          lastError = error;
          if (!SECURITY_RETRY_STATUSES.has(error.status || 0)) {
            throw error;
          }
        } else {
          throw error;
        }
      } finally {
        window.clearTimeout(timeout);
      }

      if (attempt === 0) {
        await securityRetryDelay(1200);
      }
    }
  }

  throw lastError || new PdfBackendError(
    'The secure processor could not be reached. Please try again.',
    'SERVICE_UNAVAILABLE',
  );
}
export async function protectPdfOnServer(args: { file: File; userPassword: string; ownerPassword?: string; outputName: string; allowPrinting: boolean; allowCopying: boolean; allowEditing: boolean; allowAnnotations: boolean; allowFormFilling: boolean; }): Promise<Blob> {
  const form = new FormData();
  form.set('file', args.file); form.set('user_password', args.userPassword); form.set('owner_password', args.ownerPassword || '');
  form.set('output_name', args.outputName); form.set('allow_printing', String(args.allowPrinting)); form.set('allow_copying', String(args.allowCopying));
  form.set('allow_editing', String(args.allowEditing)); form.set('allow_annotations', String(args.allowAnnotations)); form.set('allow_form_filling', String(args.allowFormFilling));
  return postPdf('/api/pdf/protect', form);
}

export async function unlockPdfOnServer(args: { file: File; password: string; authorized: boolean; outputName: string; }): Promise<Blob> {
  const form = new FormData(); form.set('file', args.file); form.set('password', args.password); form.set('authorized', String(args.authorized)); form.set('output_name', args.outputName);
  return postPdf('/api/pdf/unlock', form);
}

export async function repairPdfOnServer(file: File, outputName: string): Promise<Blob> {
  const form = new FormData(); form.set('file', file); form.set('output_name', outputName); return postPdf('/api/pdf/repair', form);
}

export type ConversionToolManifest = { id: string; name: string; category: string; inputExtensions: string[]; outputExtension: string; available: boolean; unavailableReason?: string | null; limitation?: string | null; multiFile: boolean; recognitionLanguages?: string[]; };

export async function getConversionToolManifest(signal?: AbortSignal): Promise<ConversionToolManifest[]> {
  if (!isPdfBackendConfigured) return [];
  try {
    const response = await fetchWithTimeout(`${currentServiceUrl()}/api/tools`, { cache: 'no-store' }, 8000, signal);
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload?.tools) ? payload.tools : [];
  } catch { return []; }
}

export async function convertOnServer(args: { toolId: string; files: File[]; outputName: string; sourceUrl?: string; options?: Record<string, unknown>; }): Promise<{ blob: Blob; filename: string }> {
  if (!isPdfBackendConfigured) throw new PdfBackendError('This tool is temporarily unavailable.', 'SERVICE_UNAVAILABLE');
  const form = new FormData();
  for (const file of args.files) form.append('files', file);
  form.set('output_name', args.outputName); form.set('source_url', args.sourceUrl || ''); form.set('options_json', JSON.stringify(args.options || {}));
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 310_000);
  try {
    const response = await fetch(`${currentServiceUrl()}/api/convert/${encodeURIComponent(args.toolId)}`, { method: 'POST', body: form, signal: controller.signal });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new PdfBackendError(payload.error || `Could not complete this conversion (${response.status}).`, payload.code || 'PROCESSING_FAILED', response.status, response.headers.get('x-request-id') || payload.request_id);
    }
    const disposition = response.headers.get('content-disposition') || '';
    const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
    const filename = decodeURIComponent(utfMatch?.[1] || plainMatch?.[1] || `${args.toolId}-result`);
    return { blob: await response.blob(), filename };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new PdfBackendError('This conversion took too long. Try a smaller file or try again.', 'TIMEOUT');
    if (error instanceof TypeError) throw new PdfBackendError('This tool is temporarily unavailable. Please try again.', 'SERVICE_UNAVAILABLE');
    throw error;
  } finally { window.clearTimeout(timeout); }
}
