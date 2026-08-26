import Link from 'next/link';
import { ArrowLeft, FileText, Mail, ShieldCheck } from 'lucide-react';
import { MainFooter } from '@/components/landing/main-footer';
import { NightSky } from '@/components/dashboard/night-sky';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AJN_BRAND } from '@/lib/brand';

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  summary: string;
  effectiveDate?: string;
  sections: LegalSection[];
  contactLabel?: string;
};

export function LegalPageShell({
  eyebrow,
  title,
  summary,
  effectiveDate = 'August 5, 2026',
  sections,
  contactLabel = 'Questions about this policy',
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-transparent text-slate-950 relative overflow-x-hidden">
      <NightSky />
      <header className="sticky top-0 z-[100] h-16 bg-white/70 backdrop-blur-xl border-b border-black/5 px-4 md:px-8 flex items-center justify-between shadow-sm">
        <Link href="/" className="text-2xl font-black tracking-tighter text-primary font-serif">
          AJN<span className="text-slate-950">PDF</span>
        </Link>
        <Link href="/">
          <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase tracking-widest gap-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
        </Link>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 py-16 md:py-24">
        <section className="mb-12 md:mb-16">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-black px-4 h-7 uppercase tracking-[0.2em] rounded-full mb-5">
            {eyebrow}
          </Badge>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[0.92] text-slate-950">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-sm md:text-base text-slate-600 leading-7 font-medium">
            {summary}
          </p>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            Effective {effectiveDate} · AJN PDF
          </p>
        </section>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <section key={section.title} className="bg-white/70 backdrop-blur-xl border border-black/5 rounded-[2rem] p-7 md:p-10 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  {index % 2 === 0 ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-950">{section.title}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-4 text-sm md:text-[15px] text-slate-600 leading-7 font-medium">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="mt-5 space-y-3">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3 text-sm md:text-[15px] text-slate-600 leading-7 font-medium">
                          <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10 bg-slate-950 text-white rounded-[2rem] p-8 md:p-10 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">{contactLabel}</p>
              <h2 className="mt-2 text-2xl font-black">Contact AJN PDF</h2>
              <p className="mt-2 text-sm text-slate-300">Policy, privacy, copyright and security requests are reviewed through our official contact email.</p>
            </div>
            <a href={`mailto:${AJN_BRAND.contactEmail}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity">
              <Mail className="w-4 h-4" /> {AJN_BRAND.contactEmail}
            </a>
          </div>
        </section>
      </main>

      <MainFooter />
    </div>
  );
}
