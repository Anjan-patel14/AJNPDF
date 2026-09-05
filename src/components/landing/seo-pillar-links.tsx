import Link from 'next/link';
import { ArrowRight, FileText, Files, Scissors, Shrink } from 'lucide-react';

const PILLAR_LINKS = [
  {
    href: '/edit-pdf',
    title: 'Edit PDF',
    text: 'Change text, dates, names and numbers, then add images or signatures in the browser.',
    icon: FileText,
  },
  {
    href: '/merge-pdf',
    title: 'Merge PDF',
    text: 'Combine multiple PDFs, control their order and download one final document.',
    icon: Files,
  },
  {
    href: '/compress-pdf',
    title: 'Compress PDF',
    text: 'Reduce PDF file size for email and uploads with practical quality controls.',
    icon: Shrink,
  },
  {
    href: '/split-pdf',
    title: 'Split PDF',
    text: 'Extract selected pages or divide one document into smaller PDF files.',
    icon: Scissors,
  },
] as const;

export function SeoPillarLinks() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-5 pt-4 md:px-8 md:pb-7" aria-labelledby="popular-pdf-actions">
      <div className="rounded-[20px] border border-blue-100 bg-blue-50/45 p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.15em] text-blue-700">Popular PDF actions</p>
            <h2 id="popular-pdf-actions" className="mt-1.5 text-xl font-black tracking-[-.035em] text-slate-950 sm:text-2xl">
              Start with the four core AJN PDF workflows.
            </h2>
          </div>
          <Link href="/blog" prefetch={false} className="inline-flex items-center gap-2 text-xs font-black text-blue-700 hover:underline">
            Practical PDF guides <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PILLAR_LINKS.map(({ href, title, text, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className="group rounded-2xl border border-white bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <h3 className="mt-4 text-base font-black text-slate-950 group-hover:text-blue-700">{title}</h3>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-600">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-black text-blue-700">
                Open {title} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
