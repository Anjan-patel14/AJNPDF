"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Cookie, Settings2 } from 'lucide-react';
import { Button } from './button';
import { sendAjnAnalytics } from '../analytics/site-analytics';
import { useLanguage } from '@/lib/i18n/language-context';

const CONSENT_KEY = 'ajn_cookie_consent';

export function CookieConsent() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const sync = () => setShow(!localStorage.getItem(CONSENT_KEY));
    const open = () => setShow(true);
    sync();
    window.addEventListener('ajn-open-cookie-consent', open);
    return () => window.removeEventListener('ajn-open-cookie-consent', open);
  }, []);

  const save = (value: 'accepted' | 'declined') => {
    localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new Event('ajn-cookie-consent-changed'));
    if (value === 'accepted') {
      sendAjnAnalytics({ event_name: 'consent_update', path: window.location.pathname, element_id: 'optional-consent-accepted' });
    }
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 28 }} className="fixed inset-x-0 bottom-0 z-[250] p-3 md:p-5">
          <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white/96 p-5 shadow-[0_-24px_70px_rgba(15,23,42,.16)] backdrop-blur-2xl md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Cookie className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-sm font-black text-slate-950">{t('cookie.title')}</h2>
                  <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-slate-600">{t('cookie.body')}</p>
                  <Link href="/cookies" className="mt-2 inline-flex text-xs font-black text-blue-600 hover:text-blue-800">{t('cookie.read')}</Link>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => save('declined')} data-analytics-id="cookie-decline" className="h-11 rounded-xl border-slate-200 px-5 text-xs font-black">{t('cookie.decline')}</Button>
                <Button type="button" onClick={() => save('accepted')} data-analytics-id="cookie-accept" className="h-11 rounded-xl bg-blue-600 px-5 text-xs font-black text-white hover:bg-blue-700"><Settings2 className="mr-2 h-4 w-4" />{t('cookie.allow')}</Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
