import { NextRequest } from 'next/server';
import { proxyBilling } from '@/lib/billing-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return proxyBilling(request, '/api/billing/account');
}
