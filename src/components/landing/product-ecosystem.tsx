import Link from 'next/link';
import { ArrowRight, Code2, FileSignature, Images, Laptop, Smartphone } from 'lucide-react';

const products = [
  { title: 'AJN Desktop', text: 'A desktop home for private and offline PDF workflows.', href: '/desktop', icon: Laptop },
  { title: 'AJN Mobile', text: 'Use AJN PDF from Android and iOS when builds are available.', href: '/mobile', icon: Smartphone },
  { title: 'AJN Sign', text: 'Self-sign PDFs now and use electronic-signature API packages.', href: '/sign', icon: FileSignature },
  { title: 'AJN API', text: 'Automate supported PDF workflows with authenticated API v1 endpoints.', href: '/developers', icon: Code2 },
  { title: 'AJN IMG', text: 'Image utilities are moving to the blue AJN image experience.', href: '/img', icon: Images },
] as const;

export function ProductEcosystem() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
      <div className="rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-red-50/60 p-5 sm:p-7 md:p-10">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[.24em] text-violet-700">AJN ecosystem</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-slate-950 md:text-5xl">PDF work on web, mobile, desktop and API.</h2>
          <p className="mt-4 text-sm font-medium leading-7 text-slate-600 md:text-base">One product family, with each surface focused on a clear job instead of mixing every file tool into one homepage.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {products.map(({ title, text, href, icon: Icon }) => (
            <Link key={title} href={href} className="group rounded-2xl border border-white/90 bg-white p-5 shadow-[0_10px_30px_rgba(76,29,149,.06)] transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_18px_38px_rgba(76,29,149,.1)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 text-sm font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-[11px] font-medium leading-5 text-slate-600">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-black text-violet-700">Explore <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
