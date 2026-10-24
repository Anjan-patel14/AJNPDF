'use client';

import { useEffect } from 'react';

const CONSENT_KEY = 'ajn_cookie_consent';
const SCRIPT_ID = 'ajn-ga4-script';

function allowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'ajnpdf.com' || host === 'www.ajnpdf.com' || host === 'localhost' || host === '127.0.0.1';
}

export function GoogleAnalytics() {
  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim();
    if (!measurementId || !/^G-[A-Z0-9]+$/i.test(measurementId)) return;

    const load = () => {
      const accepted = localStorage.getItem(CONSENT_KEY) === 'accepted';
      const existing = document.getElementById(SCRIPT_ID);

      // Consent can change after analytics has loaded. Remove the loader and stop
      // issuing further events when the visitor withdraws optional consent.
      if (!accepted || !allowedHost(window.location.hostname)) {
        existing?.remove();
        if (!accepted) {
          window.gtag = undefined;
          window.dataLayer = [];
        }
        return;
      }
      if (existing) return;

      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(...args: unknown[]) { window.dataLayer?.push(args); };
      window.gtag('js', new Date());
      window.gtag('config', measurementId, {
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

    load();
    window.addEventListener('ajn-cookie-consent-changed', load);
    return () => window.removeEventListener('ajn-cookie-consent-changed', load);
  }, []);

  return null;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
