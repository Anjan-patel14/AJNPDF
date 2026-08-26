'use client';

import Link from 'next/link';
import { ArrowRight, ImageDown, Puzzle, Search, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

export function ChromeExtensionPromo() {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10" aria-labelledby="chrome-extension-promo-title">
      <div className="grid items-center gap-6 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,.05)] md:grid-cols-[1fr_auto] md:p-7">
        <div className="flex items-start gap-4">
          <div className="ajn-white-icon-tile flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-blue-600 md:h-14 md:w-14"><Puzzle className="h-6 w-6" /></div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[.13em] text-blue-600">{t('chrome.promoKicker')}</span>
            <h2 id="chrome-extension-promo-title" className="mt-1 text-xl font-black tracking-[-.035em] text-slate-950 md:text-2xl">{t('chrome.promoTitle')}</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">{t('chrome.promoDesc')}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold text-slate-500">
              <span className="inline-flex items-center gap-1.5"><ImageDown className="h-3.5 w-3.5 text-emerald-600" />{t('chrome.nativeTools')}</span>
              <span className="inline-flex items-center gap-1.5"><Search className="h-3.5 w-3.5 text-blue-600" />{t('chrome.fastSearch')}</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-violet-600" />{t('chrome.noPageAccess')}</span>
            </div>
          </div>
        </div>
        <Link href="/chrome-extension" data-analytics-id="home-chrome-extension" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-blue-700">
          {t('chrome.learnMore')}<ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
