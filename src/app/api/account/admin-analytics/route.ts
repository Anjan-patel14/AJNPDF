import { NextRequest, NextResponse } from 'next/server';
import { configuredPdfBackendCandidates } from '@/lib/backend-service-url';
import { isAdminEmail, verifyFirebaseIdToken } from '@/lib/firebase-token';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });

  let identity;
  try {
    identity = await verifyFirebaseIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Your Firebase session is invalid or expired.' }, { status: 401 });
  }
  if (!isAdminEmail(identity.email) && identity.claims.admin !== true) {
    return NextResponse.json({ error: 'This AJN account is not authorized for the admin dashboard.' }, { status: 403 });
  }

  const adminToken = (process.env.AJN_ANALYTICS_ADMIN_TOKEN || process.env.AJN_ADMIN_TOKEN || '').trim();
  if (!adminToken) return NextResponse.json({ error: 'Server analytics admin token is not configured.' }, { status: 503 });
  const windowDays = Math.max(1, Math.min(365, Number(request.nextUrl.searchParams.get('window_days') || 30) || 30));
  const candidates = configuredPdfBackendCandidates(true);
  for (const base of candidates) {
    try {
      const response = await fetch(`${base}/api/admin/analytics?window_days=${windowDays}`, {
        headers: { 'X-AJN-Admin-Token': adminToken, 'X-Request-ID': `web-admin-${identity.uid.slice(0, 12)}` },
        cache: 'no-store',
      });
      const body = await response.text();
      if (!response.ok) continue;
      return new NextResponse(body, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    } catch {
      // Try the next configured backend candidate.
    }
  }
  return NextResponse.json({ error: 'AJN backend analytics are unavailable.' }, { status: 503 });
}
