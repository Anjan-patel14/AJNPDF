export const DEFAULT_PDF_BACKEND_URL = 'https://ajn-pdf-api-rswf5f4f3q-el.a.run.app';

export function normalizePdfBackendUrl(value: string | undefined, production = false): string {
  const trimmed = (value || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    const localhost = host === '127.0.0.1' || host === 'localhost';
    const localHttp = url.protocol === 'http:' && localhost;
    if (url.protocol !== 'https:' && !localHttp) return '';
    if (production && localhost) return '';
    const websiteHost = host === 'ajnpdf.com' || host === 'www.ajnpdf.com';
    const rootPath = !url.pathname || url.pathname === '/';
    if (websiteHost && rootPath) return '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function configuredPdfBackendCandidates(production = false): string[] {
  const candidates = [
    normalizePdfBackendUrl(process.env.NEXT_PUBLIC_PDF_BACKEND_URL, production),
    normalizePdfBackendUrl(process.env.NEXT_PUBLIC_AJN_PDF_API_URL, production),
    normalizePdfBackendUrl(DEFAULT_PDF_BACKEND_URL, production)].filter(Boolean);
  return [...new Set(candidates)];
}
