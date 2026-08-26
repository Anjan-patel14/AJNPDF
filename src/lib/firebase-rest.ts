"use client";

export type FirebaseSession = {
  idToken: string;
  refreshToken: string;
  expiresAt: number;
  localId: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
};

export type FirebaseClaims = {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  plan?: string;
  premium?: boolean;
  admin?: boolean;
  exp?: number;
  [key: string]: unknown;
};

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || '';
export const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || '';
export const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || (firebaseProjectId ? `${firebaseProjectId}.firebaseapp.com` : '');
export const firebaseAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || '';

export const firebaseAuthConfigured = Boolean(apiKey && firebaseProjectId);
export const firebaseSocialAuthConfigured = firebaseAuthConfigured && Boolean(firebaseAuthDomain);

const FIREBASE_CDN_VERSION = '12.17.1';
const FIREBASE_APP_SCRIPT = `https://www.gstatic.com/firebasejs/${FIREBASE_CDN_VERSION}/firebase-app-compat.js`;
const FIREBASE_AUTH_SCRIPT = `https://www.gstatic.com/firebasejs/${FIREBASE_CDN_VERSION}/firebase-auth-compat.js`;
let firebaseCompatPromise: Promise<any> | null = null;

function requireConfig() {
  if (!firebaseAuthConfigured) throw new Error('Firebase Authentication is not configured for this deployment.');
}

function decodeError(payload: any, fallback: string) {
  const raw = String(payload?.error?.message || '').trim();
  const known: Record<string, string> = {
    EMAIL_EXISTS: 'An account already exists for this email.',
    EMAIL_NOT_FOUND: 'No account was found for this email.',
    INVALID_EMAIL: 'Enter a valid email address.',
    INVALID_PASSWORD: 'The email or password is incorrect.',
    INVALID_LOGIN_CREDENTIALS: 'The email or password is incorrect.',
    USER_DISABLED: 'This account is disabled.',
    WEAK_PASSWORD: 'Use a stronger password with at least 6 characters.',
    OPERATION_NOT_ALLOWED: 'This sign-in method is not enabled yet.',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many attempts. Try again later.',
  };
  return known[raw] || raw.replaceAll('_', ' ').toLowerCase() || fallback;
}

function socialError(error: any, fallback: string) {
  const code = String(error?.code || '').trim();
  const known: Record<string, string> = {
    'auth/account-exists-with-different-credential': 'An account already exists for this email with another sign-in method. Sign in with that method first.',
    'auth/cancelled-popup-request': 'The previous sign-in window was cancelled. Try again.',
    'auth/network-request-failed': 'The sign-in service could not be reached. Check your connection and try again.',
    'auth/operation-not-allowed': 'Google sign-in is not enabled in Firebase yet.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow popups for AJN PDF and try again.',
    'auth/popup-closed-by-user': 'The Google sign-in window was closed before authentication finished.',
    'auth/unauthorized-domain': 'This AJN PDF domain is not authorized in Firebase Authentication.',
    'auth/user-disabled': 'This account is disabled.',
  };
  return new Error(known[code] || String(error?.message || fallback));
}

async function identity(path: string, body: Record<string, unknown>) {
  requireConfig();
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${path}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(decodeError(payload, 'Authentication failed.'));
  return payload;
}

function toSession(payload: any): FirebaseSession {
  const expiresIn = Math.max(60, Number(payload.expiresIn || 3600));
  return {
    idToken: String(payload.idToken || ''),
    refreshToken: String(payload.refreshToken || ''),
    expiresAt: Date.now() + expiresIn * 1000,
    localId: String(payload.localId || payload.user_id || ''),
    email: String(payload.email || ''),
    displayName: String(payload.displayName || payload.display_name || '') || undefined,
    photoUrl: String(payload.photoUrl || payload.photo_url || '') || undefined,
  };
}

function loadScript(src: string, marker: string) {
  if (typeof window === 'undefined') return Promise.reject(new Error('Google sign-in is only available in the browser.'));
  const existing = document.querySelector<HTMLScriptElement>(`script[data-ajn-auth="${marker}"]`);
  if (existing?.dataset.loaded === 'true') return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = existing || document.createElement('script');
    const done = () => { script.dataset.loaded = 'true'; resolve(); };
    const failed = () => reject(new Error('Firebase Google sign-in could not load. Check your connection and try again.'));
    script.addEventListener('load', done, { once: true });
    script.addEventListener('error', failed, { once: true });
    if (!existing) {
      script.src = src;
      script.async = true;
      script.defer = true;
      script.dataset.ajnAuth = marker;
      document.head.appendChild(script);
    }
  });
}

async function ensureFirebaseCompat() {
  if (!firebaseSocialAuthConfigured) throw new Error('Firebase Google sign-in is not configured for this deployment.');
  if (typeof window === 'undefined') throw new Error('Google sign-in is only available in the browser.');
  const current = (window as any).firebase;
  if (current?.auth && current?.initializeApp) {
    if (!current.apps?.length) current.initializeApp({ apiKey, authDomain: firebaseAuthDomain, projectId: firebaseProjectId, ...(firebaseAppId ? { appId: firebaseAppId } : {}) });
    return current;
  }
  if (!firebaseCompatPromise) {
    firebaseCompatPromise = (async () => {
      await loadScript(FIREBASE_APP_SCRIPT, 'firebase-app');
      await loadScript(FIREBASE_AUTH_SCRIPT, 'firebase-auth');
      const firebase = (window as any).firebase;
      if (!firebase?.auth || !firebase?.initializeApp) throw new Error('Firebase Authentication SDK did not initialize correctly.');
      if (!firebase.apps?.length) firebase.initializeApp({ apiKey, authDomain: firebaseAuthDomain, projectId: firebaseProjectId, ...(firebaseAppId ? { appId: firebaseAppId } : {}) });
      firebase.auth().useDeviceLanguage?.();
      return firebase;
    })().catch((error) => {
      firebaseCompatPromise = null;
      throw error;
    });
  }
  return firebaseCompatPromise;
}

async function sessionFromCompatUser(user: any): Promise<FirebaseSession> {
  if (!user) throw new Error('Firebase did not return an authenticated user.');
  const idToken = await user.getIdToken(true);
  const tokenResult = await user.getIdTokenResult?.();
  const expiration = tokenResult?.expirationTime ? Date.parse(tokenResult.expirationTime) : Date.now() + 3600_000;
  return {
    idToken: String(idToken || ''),
    refreshToken: String(user.refreshToken || ''),
    expiresAt: Number.isFinite(expiration) ? expiration : Date.now() + 3600_000,
    localId: String(user.uid || ''),
    email: String(user.email || ''),
    displayName: String(user.displayName || '') || undefined,
    photoUrl: String(user.photoURL || '') || undefined,
  };
}

export async function signUpWithEmail(email: string, password: string) {
  const payload = await identity('accounts:signUp', { email: email.trim(), password, returnSecureToken: true });
  return toSession(payload);
}

export async function signInWithEmail(email: string, password: string) {
  const payload = await identity('accounts:signInWithPassword', { email: email.trim(), password, returnSecureToken: true });
  return toSession(payload);
}

export async function sendPasswordReset(email: string) {
  await identity('accounts:sendOobCode', { requestType: 'PASSWORD_RESET', email: email.trim() });
}

export async function signInWithGoogleProvider() {
  try {
    const firebase = await ensureFirebaseCompat();
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await auth.signInWithPopup(provider);
    return await sessionFromCompatUser(result.user);
  } catch (error) {
    throw socialError(error, 'Google sign-in failed.');
  }
}

export async function signOutFirebaseCompat() {
  if (typeof window === 'undefined') return;
  try {
    const firebase = (window as any).firebase;
    if (firebase?.auth && firebase?.apps?.length) await firebase.auth().signOut();
  } catch {
    // Local AJN session is still cleared even if the provider SDK cannot sign out.
  }
}

export async function refreshFirebaseSession(session: FirebaseSession): Promise<FirebaseSession> {
  requireConfig();
  if (!session.refreshToken) throw new Error('Your session has expired. Please sign in again.');
  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: session.refreshToken }),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(decodeError(payload, 'Your session could not be refreshed.'));
  return {
    ...session,
    idToken: String(payload.id_token || ''),
    refreshToken: String(payload.refresh_token || session.refreshToken),
    expiresAt: Date.now() + Math.max(60, Number(payload.expires_in || 3600)) * 1000,
    localId: String(payload.user_id || session.localId),
  };
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  if (typeof window !== 'undefined') return decodeURIComponent(Array.from(atob(padded)).map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function parseFirebaseClaims(token: string): FirebaseClaims {
  try {
    const segment = token.split('.')[1];
    if (!segment) return {};
    return JSON.parse(base64UrlDecode(segment));
  } catch {
    return {};
  }
}
