"use client";
import Link from 'next/link';
import { ArrowRight, FileCheck2, KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

export function TrustSecurity(){
  const { t } = useLanguage();
  const controls=[
    {icon:FileCheck2,title:t('home.safeguardChecksTitle'),text:t('home.safeguardChecksDesc')},
    {icon:KeyRound,title:t('home.safeguardAccessTitle'),text:t('home.safeguardAccessDesc')},
    {icon:Trash2,title:t('home.safeguardCleanupTitle'),text:t('home.safeguardCleanupDesc')},
    {icon:ShieldCheck,title:t('home.safeguardPolicyTitle'),text:t('home.safeguardPolicyDesc')}];
  return <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28"><div className="relative overflow-hidden rounded-[1.8rem] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/45 p-6 shadow-[0_28px_75px_rgba(37,62,113,.08)] md:p-10 lg:p-12"><div className="relative grid gap-10 lg:grid-cols-[.9fr_1.1fr]"><div><span className="ajn-section-kicker">{t('home.safeguardsKicker')}</span><h2 className="mt-5 text-4xl font-black tracking-[-.04em] text-slate-950 md:text-6xl">{t('home.safeguardsTitle')}</h2><p className="mt-5 text-sm font-medium leading-7 text-slate-600">{t('home.safeguardsDesc')}</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/security" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-[11px] font-black text-white">{t('home.securityPractices')} <ArrowRight className="h-4 w-4"/></Link><Link href="/file-processing-policy" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-[11px] font-black text-slate-700">{t('home.fileHandlingDetails')}</Link></div></div><div className="grid gap-4 sm:grid-cols-2">{controls.map(({icon:Icon,title,text})=><article key={title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><span className="ajn-white-icon-tile flex h-10 w-10 items-center justify-center rounded-xl text-blue-600"><Icon className="h-4.5 w-4.5"/></span><h3 className="mt-4 text-sm font-black text-slate-950">{title}</h3><p className="mt-2 text-xs font-medium leading-5 text-slate-500">{text}</p></article>)}</div></div></div></section>;
}
