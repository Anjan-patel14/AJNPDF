import { verify, X509Certificate } from 'node:crypto';

export type VerifiedFirebaseToken = {
  uid: string;
  email: string;
  claims: Record<string, unknown>;
};

const CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let certificateCache: { expiresAt: number; values: Record<string, string> } | null = null;

function decodeBase64Url(value: string) {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

async function firebaseCertificates() {
  if (certificateCache && certificateCache.expiresAt > Date.now()) return certificateCache.values;
  const response = await fetch(CERT_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error('Firebase signing certificates are unavailable.');
  const values = await response.json() as Record<string, string>;
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 3600);
  certificateCache = { expiresAt: Date.now() + Math.max(300, maxAge - 60) * 1000, values };
  return values;
}

export async function verifyFirebaseIdToken(rawToken: string): Promise<VerifiedFirebaseToken> {
  const projectId = (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '').trim();
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is not configured.');
  const parts = rawToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid Firebase ID token.');

  let header: Record<string, unknown>;
  let claims: Record<string, unknown>;
  try {
    header = JSON.parse(decodeBase64Url(parts[0]).toString('utf8'));
    claims = JSON.parse(decodeBase64Url(parts[1]).toString('utf8'));
  } catch {
    throw new Error('Invalid Firebase ID token payload.');
  }

  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new Error('Unsupported Firebase token signature.');
  const certificates = await firebaseCertificates();
  const certificate = certificates[header.kid];
  if (!certificate) throw new Error('Firebase token signing key is unknown.');

  // X509Certificate.publicKey is already a PublicKeyObject. Re-wrapping that
  // public object through another key-construction helper causes Node.js to
  // reject otherwise-valid Firebase sessions with an invalid key-object error.
  const publicKey = new X509Certificate(certificate).publicKey;
  const validSignature = verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), publicKey, decodeBase64Url(parts[2]));
  if (!validSignature) throw new Error('Firebase token signature is invalid.');

  const now = Math.floor(Date.now() / 1000);
  const exp = Number(claims.exp || 0);
  const iat = Number(claims.iat || 0);
  const aud = String(claims.aud || '');
  const iss = String(claims.iss || '');
  const sub = String(claims.sub || '');
  const email = String(claims.email || '').trim().toLowerCase();
  if (!sub || sub.length > 128) throw new Error('Firebase token subject is invalid.');
  if (!email) throw new Error('Firebase account email is required.');
  if (aud !== projectId || iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Firebase token project does not match this deployment.');
  if (!exp || exp <= now || !iat || iat > now + 300) throw new Error('Firebase token has expired or is not yet valid.');

  return { uid: sub, email, claims };
}

export function isAdminEmail(email: string) {
  const allowed = new Set((process.env.AJN_ADMIN_EMAILS || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean));
  return allowed.has(email.trim().toLowerCase());
}
