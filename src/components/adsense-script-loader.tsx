"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ADSENSE_PUBLISHER } from '@/lib/ad-slots';
import { useAuth } from '@/lib/auth-context';

const SCRIPT_ID = 'ajn-adsense-consent-script';
const READY_EVENT = 'ajn-adsense-ready';

const AD_ELIGIBLE_TOOL_PATHS = new Set([
  '/add-image-to-pdf',
  '/add-text',
  '/compare-pdf',
  '/compress-pdf',
  '/crop-pdf',
  '/delete-pdf-pages',
  '/extract-images',
  '/flatten-pdf',
  '/merge-pdf',
  '/organize-pdf',
  '/page-number',
  '/pdf-metadata',
  '/pdf-zip-extract',
  '/protect-pdf',
  '/repair-pdf',
  '/rotate-pdf',
  '/sign-pdf',
  '/split-pdf',
  '/unlock-pdf',
  '/watermark-pdf',
]);

export function isAdEligiblePath(pathname: string): boolean {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return normalized === '/' || AD_ELIGIBLE_TOOL_PATHS.has(normalized);
}

export function AdSenseScriptLoader() {
  const auth = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const syncAds = () => {
      const existing = document.getElementById(SCRIPT_ID);
      const host = window.location.hostname.toLowerCase();
      const isProductionHost = host === 'ajnpdf.com' || host === 'www.ajnpdf.com';
      const accepted = localStorage.getItem('ajn_cookie_consent') === 'accepted';
      const allowed =
        process.env.NODE_ENV === 'production' &&
        auth.plan === 'free' &&
        isProductionHost &&
        accepted &&
        isAdEligiblePath(pathname);

      if (!allowed) {
        if (existing) existing.remove();
        return;
      }

      if (existing) {
        window.dispatchEvent(new Event(READY_EVENT));
        return;
      }

      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER}`;
      script.addEventListener('load', () => window.dispatchEvent(new Event(READY_EVENT)), { once: true });
      document.head.appendChild(script);
    };

    syncAds();
    window.addEventListener('ajn-cookie-consent-changed', syncAds);
    return () => window.removeEventListener('ajn-cookie-consent-changed', syncAds);
  }, [auth.plan, pathname]);

  return null;
}
