import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';

type ProductLandingProps = {
  eyebrow: string;
  title: string;
  description: string;
  features: string[];
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  accent?: 'pdf' | 'image';
  note?: string;
};

export function ProductLanding({ eyebrow, title, description, features, primaryLabel, primaryHref, secondaryLabel, secondaryHref, accent='pdf', note }: ProductLandingProps) {
  const image = accent === 'image';
  const accentText = image ? 'text-blue-700' : 'text-violet-700';
  const accentBg = image ? 'bg-blue-700 hover:bg-blue-800 shadow-blue-100' : 'bg-violet-700 hover:bg-violet-800 shadow-violet-100';
  const soft = image ? 'from-blue-50 via-white to-cyan-50' : 'from-violet-50 via-white to-red-50';
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-[92px] md:pt-[108px]">
        <section className="mx-auto max-w-7xl px-4 pb-10 md:px-8 md:pb-16">
          <div className={`rounded-[2rem] border border-slate-200 bg-gradient-to-br ${soft} p-6 shadow-[0_24px_70px_rgba(15,23,42,.07)] sm:p-8 md:p-12`}>
            <p className={`text-[10px] font-black uppercase tracking-[.24em] ${accentText}`}>{eyebrow}</p>
            <h1 className="mt-4 max-w-5xl text-balance text-[clamp(2.5rem,7vw,5.2rem)] font-black leading-[.98] tracking-[-.055em] text-slate-950">{title}</h1>
            <p className="mt-5 max-w-3xl text-sm font-medium leading-7 text-slate-600 md:text-lg md:leading-8">{description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {primaryLabel && primaryHref ? <Link href={primaryHref} className={`inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-xs font-black text-white shadow-lg transition hover:-translate-y-0.5 ${accentBg}`}>{primaryLabel}<ArrowRight className="h-4 w-4" /></Link> : null}
              {secondaryLabel && secondaryHref ? <Link href={secondaryHref} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-800 transition hover:border-slate-300 hover:bg-slate-50">{secondaryLabel}<ArrowRight className="h-4 w-4" /></Link> : null}
            </div>
            {note ? <p className="mt-4 max-w-2xl text-[11px] font-semibold leading-5 text-slate-500">{note}</p> : null}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => <div key={feature} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><CheckCircle2 className={`h-5 w-5 ${accentText}`} /><p className="mt-3 text-sm font-black leading-6 text-slate-900">{feature}</p></div>)}
          </div>
        </section>
      </main>
      <MainFooter />
    </div>
  );
}
