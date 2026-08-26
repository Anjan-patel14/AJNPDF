const TOOL_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const RESERVED_ROOT_ROUTES = new Set([
  '', 'about', 'acceptable-use', 'admin', 'ajn-studio', 'blog', 'chrome-extension',
  'contact', 'conversion-tools', 'cookies', 'copyright', 'data-deletion', 'developer',
  'disclaimer', 'discover', 'dmca', 'faq', 'feed.xml', 'file-processing-policy',
  'image-licensing', 'image-sitemap.xml', 'image-tools', 'limits', '', 'pdf-tools',
  'pdf-utilities', 'privacy', 'psd-pdf', 'public-media', 'robots.txt', 'security', 'sitemap.xml',
  'status', 'terms', 'transparency', 'unlock-authorization-policy']);

export function toolPath(id: string): string {
  const normalized = id.trim().toLowerCase();
  if (!TOOL_ID_PATTERN.test(normalized)) throw new Error(`Invalid AJN PDF tool id: ${id}`);
  if (RESERVED_ROOT_ROUTES.has(normalized)) throw new Error(`AJN PDF tool id collides with reserved route: ${id}`);
  return `/${normalized}`;
}

export function legacyToolPath(id: string): string {
  const normalized = id.trim().toLowerCase();
  if (!TOOL_ID_PATTERN.test(normalized)) throw new Error(`Invalid AJN PDF tool id: ${id}`);
  return `/tools/${normalized}`;
}

export function toolIdFromPathname(pathname: string | null | undefined): string | undefined {
  if (!pathname) return undefined;
  const clean = pathname.split('?')[0].split('#')[0];
  const parts = clean.split('/').filter(Boolean);
  if (parts[0] === 'tools' && parts[1] && TOOL_ID_PATTERN.test(parts[1])) return parts[1];
  const first = parts[0];
  if (!first || RESERVED_ROOT_ROUTES.has(first) || !TOOL_ID_PATTERN.test(first)) return undefined;
  return first;
}
