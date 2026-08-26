import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock, Info, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { AdSenseUnit } from '@/components/adsense-unit';
import { ADSENSE_SLOTS } from '@/lib/ad-slots';
import { AJN_BRAND } from '@/lib/brand';
import { SITE_URL } from '@/lib/seo-config';

export type GuideSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  note?: string;
};

export type RelatedGuideTool = {
  href: string;
  title: string;
  description: string;
};

type Props = {
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
  readTime: string;
  sections: GuideSection[];
  checklist?: string[];
  relatedTools: RelatedGuideTool[];
  datePublished?: string;
  dateModified?: string;
};

export function GuideArticle({ slug, eyebrow, title, summary, readTime, sections, checklist = [], relatedTools, datePublished = '2026-08-06', dateModified = '2026-08-13' }: Props) {
  const canonical = `${SITE_URL}/blog/${slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${canonical}#article`,
        headline: title,
        description: summary,
        url: canonical,
        datePublished,
        dateModified,
        inLanguage: 'en',
        isAccessibleForFree: true,
        author: { '@id': `${SITE_URL}/developer#anjan` },
        publisher: { '@id': `${SITE_URL}/ajn-studio#organization` },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'AJN PDF', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: title, item: canonical }],
      }],
  };

  return (
    <div className="ajn-page-shell">
      <Navbar />
      <main className="relative z-10 pb-24 pt-28 md:pt-36">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <article className="mx-auto max-w-5xl px-4 md:px-8">
          <header className="mx-auto max-w-4xl text-center">
            <span className="ajn-section-kicker"><BookOpen className="h-3.5 w-3.5" /> {eyebrow}</span>
            <h1 className="mt-7 text-[clamp(2.6rem,7vw,5.6rem)] font-black leading-[.98] tracking-[-.055em] text-foreground">{title}</h1>
            <p className="mx-auto mt-6 max-w-3xl text-base font-medium leading-8 text-muted-foreground md:text-lg">{summary}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2"><Clock className="h-3.5 w-3.5" /> {readTime}</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2"><CalendarDays className="h-3.5 w-3.5" /> Reviewed 13 August 2026</span>
              <Link href="/developer" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-blue-600 hover:bg-muted">By {AJN_BRAND.developerName}</Link>
            </div>
          </header>

          <div className="mt-14 space-y-6">
            {sections.map((section, index) => (
              <section key={section.title} className="ajn-theme-surface rounded-[1.75rem] p-6 md:p-9">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">{index + 1}</span>
                  <div className="min-w-0">
                    <h2 className="text-2xl font-black tracking-[-.03em] text-foreground md:text-3xl">{section.title}</h2>
                    <div className="mt-5 space-y-4">
                      {section.paragraphs.map((paragraph) => <p key={paragraph} className="text-sm font-medium leading-7 text-muted-foreground md:text-base">{paragraph}</p>)}
                    </div>
                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                        {section.bullets.map((item) => <li key={item} className="flex items-start gap-3 rounded-xl border border-border bg-muted/35 p-4 text-sm font-semibold leading-6 text-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}
                      </ul>
                    )}
                    {section.note && <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-950"><Info className="mt-0.5 h-4 w-4 shrink-0" />{section.note}</div>}
                  </div>
                </div>
              </section>
            ))}
          </div>

          {checklist.length > 0 && (
            <section className="mt-8 rounded-[1.75rem] bg-slate-950 p-7 text-white md:p-10">
              <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-emerald-300" /><h2 className="text-2xl font-black md:text-3xl">Practical checklist</h2></div>
              <ul className="mt-6 grid gap-3 md:grid-cols-2">
                {checklist.map((item) => <li key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-semibold leading-6 text-slate-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{item}</li>)}
              </ul>
            </section>
          )}

          <div className="ajn-ad-zone my-10">
            <AdSenseUnit slot={ADSENSE_SLOTS.blogContent} responsive className="min-h-[160px]" label="Guide advertisement" />
          </div>

          <section className="mt-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><span className="ajn-section-kicker">Continue with a tool</span><h2 className="mt-4 text-3xl font-black tracking-[-.04em] text-foreground md:text-4xl">Apply the guide to a real workflow.</h2></div>
              <Link href="/pdf-tools" className="text-sm font-black text-blue-600 hover:underline">View all tools</Link>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {relatedTools.map((tool) => (
                <Link key={tool.href} href={tool.href} className="ajn-tool-card group block p-6">
                  <h3 className="text-lg font-black text-foreground">{tool.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">{tool.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-blue-600">Open tool <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
          </section>
        </article>
      </main>
      <MainFooter />
    </div>
  );
}
