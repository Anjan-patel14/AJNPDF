export type AjnConsentState = 'accepted' | 'declined' | null;

export const AJN_CONSENT_KEY = 'ajn_cookie_consent';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtag() {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
}

export function readAjnConsent(): AjnConsentState {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(AJN_CONSENT_KEY);
  return value === 'accepted' || value === 'declined' ? value : null;
}

export function installGoogleConsentDefault() {
  if (typeof window === 'undefined') return;
  ensureGtag();
  window.gtag?.('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });
  window.gtag?.('set', 'ads_data_redaction', true);
  window.gtag?.('set', 'url_passthrough', false);
}

export function updateGoogleConsent(value: AjnConsentState) {
  if (typeof window === 'undefined') return;
  ensureGtag();
  const granted = value === 'accepted' ? 'granted' : 'denied';
  window.gtag?.('consent', 'update', {
    analytics_storage: granted,
    ad_storage: granted,
    ad_user_data: granted,
    ad_personalization: granted,
  });
}