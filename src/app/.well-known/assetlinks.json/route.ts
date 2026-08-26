import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PACKAGE_RE = /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/;
const FINGERPRINT_RE = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;

function configuredFingerprints(): string[] {
  const raw = process.env.AJN_ANDROID_SHA256_FINGERPRINTS
    || process.env.AJN_ANDROID_SHA256_FINGERPRINT
    || '';
  return [...new Set(raw
    .split(/[;,\n]/)
    .map((value) => value.trim().toUpperCase())
    .filter((value) => FINGERPRINT_RE.test(value)))];
}

export function GET() {
  const packageId = (process.env.AJN_ANDROID_PACKAGE_ID || '').trim();
  const fingerprints = configuredFingerprints();

  const payload = PACKAGE_RE.test(packageId) && fingerprints.length > 0
    ? [{
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: packageId,
          sha256_cert_fingerprints: fingerprints,
        },
      }]
    : [];

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
