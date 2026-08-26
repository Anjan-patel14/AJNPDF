import { NextRequest } from 'next/server';
import { proxyBilling } from '@/lib/billing-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyBilling(request, '/api/billing/verify', { method: 'POST', body });
}
