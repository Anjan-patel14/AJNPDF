"use client";

import { useEffect } from 'react';
import { ADSENSE_PUBLISHER } from '@/lib/ad-slots';
import { useAuth } from '@/lib/auth-context';

const SCRIPT_ID = 'ajn-adsense-consent-script';
const READY_EVENT = 'ajn-adsense-ready';
const EXCLUDED_PREFIXES = [
  '/privacy', '/terms', '/cookies', '/copyright', '/dmca', '/disclaimer',
  '/acceptable-use', '/file-processing-policy', '/data-deletion',
  '/unlock-authorization-policy', '/security', '/status', '/transparency',
  '/contact', '/about', '/login', '/dashboard', '/admin', '/view', '/api'];

export function isAdEligiblePath(pathname: string): boolean {
  return !EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function AdSenseScriptLoader() {
  const auth = useAuth();
  useEffect(() => {
    const load = () => {
      const existing = document.getElementById(SCRIPT_ID);
      if (auth.plan !== 'free') {
        if (existing) existing.remove();
        return;
      }
      const host = window.location.hostname.toLowerCase();
      const isProductionHost = host === 'ajnpdf.com' || host === 'www.ajnpdf.com';
      const accepted = localStorage.getItem('ajn_cookie_consent') === 'accepted';
      if (!isProductionHost || !accepted || !isAdEligiblePath(window.location.pathname)) return;
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
    load();
    window.addEventListener('ajn-cookie-consent-changed', load);
    return () => window.removeEventListener('ajn-cookie-consent-changed', load);
  }, [auth.plan]);
  return null;
}
