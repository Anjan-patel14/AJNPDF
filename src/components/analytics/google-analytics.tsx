'use client';

import { useEffect } from 'react';
import {
  installGoogleConsentDefault,
  readAjnConsent,
  updateGoogleConsent,
} from '@/lib/google-consent';

const SCRIPT_ID = 'ajn-ga4-script';

function allowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'ajnpdf.com' || host === 'www.ajnpdf.com' || host === 'localhost' || host === '127.0.0.1';
}

export function GoogleAnalytics() {
  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim();
    if (!measurementId || !/^G-[A-Z0-9]+$/i.test(measurementId)) return;
    if (!allowedHost(window.location.hostname)) return;

    installGoogleConsentDefault();

    const sync = () => {
      const consent = readAjnConsent();
      updateGoogleConsent(consent);

      // Privacy-first mode: do not load GA4 until optional analytics consent exists.
      if (consent !== 'accepted') return;
      if (document.getElementById(SCRIPT_ID)) return;

      window.gtag?.('js', new Date());
      window.gtag?.('config', measurementId, {
        anonymize_ip: true,
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });

      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(script);
    };

    sync();
    window.addEventListener('ajn-cookie-consent-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('ajn-cookie-consent-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return null;
}