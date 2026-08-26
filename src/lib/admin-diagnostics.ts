export type AdminArea = 'analytics' | 'media';

const TOKEN_ENV: Record<AdminArea, string> = {
  analytics: 'AJN_ANALYTICS_ADMIN_TOKEN',
  media: 'AJN_MEDIA_ADMIN_TOKEN',
};

export function formatAdminApiError(area: AdminArea, status: number, detail: string): string {
  const message = detail.trim();
  const tokenName = TOKEN_ENV[area];

  if (area === 'analytics' && status === 404 && /analytics.*disabled/i.test(message)) {
    return 'Anonymous analytics are disabled for the connected deployment. Set AJN_ANALYTICS_ENABLED=true and redeploy the connected service.';
  }

  if (status === 401 || status === 403 || /valid .*admin token|required/i.test(message)) {
    return `${area === 'media' ? 'Media' : 'Analytics'} admin token was rejected. Use the value configured as ${tokenName} for the connected deployment, then redeploy after any environment change.`;
  }

  if (status === 404) {
    return `${area === 'media' ? 'Media admin' : 'Analytics admin'} endpoint is not available for the connected deployment. Confirm the AJN PDF 3.1.0 service configuration and redeploy if necessary.`;
  }

  if (status === 429) {
    return 'Admin requests are temporarily rate limited. Wait for the Retry-After period and try again.';
  }

  return message || `${area === 'media' ? 'Media' : 'Analytics'} admin request failed with status ${status}.`;
}
