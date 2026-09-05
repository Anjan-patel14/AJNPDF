import Link from 'next/link';
import { ArrowRight, CheckCircle2, Monitor, Search } from 'lucide-react';
import { getSeoGrowthGuidesForTool, isSeoGrowthPillar, SEO_GROWTH_PILLARS } from '@/lib/seo-growth-guides';

export function SeoPillarSection({ toolId }: { toolId: string }) {
  if (!isSeoGrowthPillar(toolId)) return null;

  const pillar = SEO_GROWTH_PILLARS[toolId];
  const guides = getSeoGrowthGuidesForTool(toolId);

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 pb-12 md:px-8 md:pb-20" aria-labelledby={`seo-pillar-${toolId}`}>
      <div className="overflow-hidden rounded-[1.75rem] border border-blue-100 bg-gradient-to-b from-blue-50/70 to-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.08)] md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-blue-700">
              <Search className="h-3.5 w-3.5" /> Search-focused guide
            </span>
            <h2 id={`seo-pillar-${toolId}`} className="mt-5 text-2xl font-black tracking-[-.035em] text-slate-950 md:text-4xl">
              {pillar.headline}
            </h2>
            <p className="mt-5 max-w-3xl text-sm font-medium leading-7 text-slate-600 md:text-base">{pillar.summary}</p>

            <div className="mt-7 rounded-2xl border border-blue-100 bg-white p-5">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-950">
                <Monitor className="h-4 w-4 text-blue-600" /> File-processing mode
              </h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{pillar.browserNote}</p>
              <Link href="/trust" prefetch={false} className="mt-4 inline-flex items-center gap-2 text-xs font-black text-blue-700 hover:underline">
                Read the Trust Center <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <article className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
              <h3 className="text-sm font-black uppercase tracking-[.12em] text-emerald-900">Useful for</h3>
              <ul className="mt-4 space-y-3">
                {pillar.bestFor.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm font-semibold leading-6 text-emerald-950/75">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> {item}
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
              <h3 className="text-sm font-black uppercase tracking-[.12em] text-amber-900">Before download</h3>
              <ul className="mt-4 space-y-3">
                {pillar.beforeDownload.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm font-semibold leading-6 text-amber-950/75">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-amber-600" /> {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>

        <div className="mt-9 border-t border-blue-100 pt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-950">Specific guides for {pillar.label}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Device, workflow and file-size questions answered with a direct path back to the real tool.</p>
            </div>
            <Link href="/blog" prefetch={false} className="text-sm font-black text-blue-700 hover:underline">All PDF guides</Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/blog/${guide.slug}`}
                prefetch={false}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <span className="text-[10px] font-black uppercase tracking-[.14em] text-blue-600">{guide.primaryKeyword}</span>
                <h4 className="mt-2 text-base font-black leading-6 text-slate-950 group-hover:text-blue-700">{guide.title}</h4>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-blue-700">
                  Read guide <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
