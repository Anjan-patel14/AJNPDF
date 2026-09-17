"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ADSENSE_PUBLISHER } from '@/lib/ad-slots';
import { isAdEligiblePath } from '@/components/adsense-script-loader';
import { useLanguage } from '@/lib/i18n/language-context';
import { useAuth } from '@/lib/auth-context';

declare global {
  interface Window { adsbygoogle?: unknown[]; }
}

const CONSENT_EVENT = 'ajn-cookie-consent-changed';
const READY_EVENT = 'ajn-adsense-ready';

interface AdSenseUnitProps {
  slot?: string;
  className?: string;
  width?: number;
  height?: number;
  responsive?: boolean;
  label?: string;
}

export function AdSenseUnit({
  slot,
  className = '',
  width,
  height,
  responsive = false,
  label,
}: AdSenseUnitProps) {
  const { t } = useLanguage();
  const auth = useAuth();
  const accessibleLabel = label || t('common.advertisement');
  const adRef = useRef<HTMLModElement | null>(null);
  const initialized = useRef(false);
  const [allowed, setAllowed] = useState(false);
  const [adStatus, setAdStatus] = useState<'pending' | 'filled' | 'unfilled'>('pending');

  useEffect(() => {
    const syncConsent = () => {
      const host = window.location.hostname.toLowerCase();
      const productionHost = host === 'ajnpdf.com' || host === 'www.ajnpdf.com';
      setAllowed(auth.plan === 'free' && productionHost && isAdEligiblePath(window.location.pathname) && localStorage.getItem('ajn_cookie_consent') === 'accepted');
    };
    syncConsent();
    window.addEventListener(CONSENT_EVENT, syncConsent);
    window.addEventListener('storage', syncConsent);
    return () => {
      window.removeEventListener(CONSENT_EVENT, syncConsent);
      window.removeEventListener('storage', syncConsent);
    };
  }, [auth.plan]);

  useEffect(() => {
    if (!allowed || !slot) return;

    const requestAd = () => {
      if (initialized.current || !adRef.current || !window.adsbygoogle) return;
      try {
        window.adsbygoogle.push({});
        initialized.current = true;
      } catch {
        // Ad blockers, review status, privacy tools, or empty inventory may prevent rendering.
      }
    };

    requestAd();
    window.addEventListener(READY_EVENT, requestAd);
    return () => window.removeEventListener(READY_EVENT, requestAd);
  }, [allowed, slot]);

  useEffect(() => {
    const node = adRef.current;
    if (!allowed || !slot || !node || typeof MutationObserver === 'undefined') return;
    const syncStatus = () => {
      const value = node.getAttribute('data-ad-status');
      if (value === 'unfilled') setAdStatus('unfilled');
      else if (value === 'filled') setAdStatus('filled');
    };
    const observer = new MutationObserver(syncStatus);
    observer.observe(node, { attributes: true, attributeFilter: ['data-ad-status'] });
    syncStatus();
    return () => observer.disconnect();
  }, [allowed, slot]);

  // Keep verification independent through the AdSense meta tag and /ads.txt.
  // Premium/Business account sessions remain ad-free; free ads require consent.
  if (auth.plan !== 'free' || !slot || process.env.NODE_ENV !== 'production' || !allowed || adStatus === 'unfilled') return null;

  const adStyle: React.CSSProperties = responsive
    ? { display: 'block', width: '100%' }
    : { display: 'inline-block', width: width || 300, height: height || 250, maxWidth: '100%' };

  return (
    <aside aria-label={accessibleLabel} className={`w-full min-w-0 flex flex-col items-center justify-center ${className}`}>
      <span className="mb-2 text-[8px] font-black uppercase tracking-[0.18em] text-slate-400">{t('common.advertisement')}</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={adStyle}
        data-ad-client={ADSENSE_PUBLISHER}
        data-ad-slot={slot}
        {...(responsive ? { 'data-ad-format': 'auto', 'data-full-width-responsive': 'true' } : {})}
      />
    </aside>
  );
}
