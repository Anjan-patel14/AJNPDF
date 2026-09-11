export const DEFAULT_PDF_BACKEND_URL = 'https://ajn-pdf-api-580158856470.asia-south1.run.app';

export function normalizePdfBackendUrl(value: string | undefined, _production = false): string {
  const trimmed = (value || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    const localhost = host === '127.0.0.1' || host === 'localhost';
    const localHttp = url.protocol === 'http:' && localhost;
    if (url.protocol !== 'https:' && !localHttp) return '';

    const websiteHost = host === 'ajnpdf.com' || host === 'www.ajnpdf.com';
    const rootPath = !url.pathname || url.pathname === '/';
    if (websiteHost && rootPath) return '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function configuredPdfBackendCandidates(production = false): string[] {
  // An explicit local/test service must never fall through to the live service.
  const configured = [process.env.NEXT_PUBLIC_PDF_BACKEND_URL, process.env.NEXT_PUBLIC_AJN_PDF_API_URL];
  const values = configured.some((value) => value?.trim()) ? configured : [DEFAULT_PDF_BACKEND_URL];
  return [...new Set(values.map((value) => normalizePdfBackendUrl(value, production)).filter(Boolean))];
}
