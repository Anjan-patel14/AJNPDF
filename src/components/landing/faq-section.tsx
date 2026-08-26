"use client";

import Link from 'next/link';
import { ArrowRight, CircleHelp, MessageSquareText } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { useLanguage } from '@/lib/i18n/language-context';

export function FAQSection() {
  const { t } = useLanguage();
  const faqs = Array.from({ length: 6 }, (_, index) => ({ q: t(`home.faqQ${index + 1}`), a: t(`home.faqA${index + 1}`) }));
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
      <div className="text-center">
        <span className="ajn-section-kicker"><CircleHelp className="h-3.5 w-3.5" /> {t('home.faqKicker')}</span>
        <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-black tracking-[-.04em] text-slate-950 md:text-6xl">{t('home.faqTitle')}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-7 text-slate-600">{t('home.faqDesc')}</p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {faqs.map((faq, index) => (
          <motion.article key={faq.q} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .05 }} className="ajn-glass-card rounded-2xl p-6 md:p-7">
            <div className="flex gap-4">
              <div className="ajn-white-icon-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-blue-600"><CircleHelp className="h-4.5 w-4.5" /></div>
              <div><h3 className="text-base font-black text-slate-950">{faq.q}</h3><p className="mt-3 text-sm font-medium leading-6 text-slate-500">{faq.a}</p></div>
            </div>
          </motion.article>
        ))}
      </div>
      <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row">
        <div className="flex items-center gap-4"><span className="ajn-white-icon-tile flex h-11 w-11 items-center justify-center rounded-xl text-emerald-600"><MessageSquareText className="h-5 w-5" /></span><div><p className="text-sm font-black text-slate-950">{t('home.faqHelpTitle')}</p><p className="mt-1 text-xs font-medium text-slate-500">{t('home.faqHelpDesc')}</p></div></div>
        <div className="flex gap-2"><Link href="/faq"><Button variant="outline" className="rounded-xl font-black">{t('home.faqFull')}</Button></Link><Link href="/contact"><Button className="rounded-xl bg-blue-600 font-black text-white">{t('common.contact')} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div>
      </div>
    </section>
  );
}
