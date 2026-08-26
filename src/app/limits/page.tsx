import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileStack, Gauge, Globe2, HardDrive, Monitor, ShieldCheck, Timer } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { SERVER_LIMIT_DEFAULTS } from '@/lib/tool-limits';

export const metadata: Metadata = {
  title: 'File Size, Page & Processing Limits',
  description: 'See AJN PDF file-size, page, image, output and processing limits for on-device and online workflows.',
  alternates: { canonical: '/limits' },
};

const onlineLimits = [
  { icon: HardDrive, label: 'Per file', value: `${SERVER_LIMIT_DEFAULTS.maxFileSizeMb} MB`, note: 'Default limit; individual tools can be lower.' },
  { icon: Gauge, label: 'Combined upload', value: `${SERVER_LIMIT_DEFAULTS.maxTotalSizeMb} MB`, note: 'Maximum combined upload for one online request.' },
  { icon: FileStack, label: 'PDF pages', value: `${SERVER_LIMIT_DEFAULTS.maxPdfPages}`, note: 'Maximum PDF pages for applicable online workflows.' },
  { icon: Gauge, label: 'Image pixels', value: `${SERVER_LIMIT_DEFAULTS.maxImageMegapixels} MP`, note: 'Maximum decoded pixels for one uploaded image.' },
  { icon: HardDrive, label: 'Generated output', value: `${SERVER_LIMIT_DEFAULTS.maxOutputMb} MB`, note: 'Maximum generated output size before delivery.' },
  { icon: Timer, label: 'Processing time', value: `${SERVER_LIMIT_DEFAULTS.processingTimeoutSeconds}s`, note: 'Default online-task timeout.' }];

export default function LimitsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 md:px-8 md:pt-36">
        <section className="max-w-3xl">
          <span className="ajn-section-kicker">Processing policy</span>
          <h1 className="mt-5 text-4xl font-black tracking-[-.045em] md:text-6xl">Current policy limits.</h1>
          <p className="mt-5 text-base font-medium leading-8 text-slate-600">This page is the reference for AJN PDF processing limits. On-device workflows enforce their safety policy automatically; online workflows also follow the configured limits below and may enforce a lower live file or total-request limit when required.</p>
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-labelledby="online-limits-title">
          <h2 id="online-limits-title" className="sr-only">Online workflow limits</h2>
          {onlineLimits.map(({ icon: Icon, label, value, note }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm"><Icon className="h-4 w-4" /></span>
              <h3 className="mt-4 text-xs font-black uppercase tracking-[.09em] text-slate-600">{label}</h3>
              <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-600">{note}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-blue-100 bg-blue-50/55 p-6">
            <div className="flex items-center gap-3"><Monitor className="h-5 w-5 text-blue-700" /><h2 className="text-xl font-black">On-device tools</h2></div>
            <p className="mt-4 text-sm font-medium leading-7 text-slate-700">Local tools keep supported files in the active browser session. Safety limits are enforced automatically from the AJN PDF tool policy. Browser memory and device capability can still become the practical ceiling for unusually complex files.</p>
          </article>
          <article className="rounded-2xl border border-emerald-100 bg-emerald-50/55 p-6">
            <div className="flex items-center gap-3"><Globe2 className="h-5 w-5 text-emerald-700" /><h2 className="text-xl font-black">Online workflows</h2></div>
            <p className="mt-4 text-sm font-medium leading-7 text-slate-700">Selected files are uploaded only for the active request. Temporary request data is scheduled for cleanup after the result is returned. The workflow checks live availability and automatically applies any lower limits reported for the current deployment.</p>
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-amber-800" /><h2 className="text-lg font-black text-amber-950">Fair-use and abuse protection</h2></div>
          <p className="mt-3 text-sm font-medium leading-7 text-amber-950/80">AJN PDF may temporarily limit unusually high automated request volumes or reject workloads that exceed safety ceilings. This protects processing capacity for normal interactive use without publishing security-sensitive abuse thresholds.</p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/file-processing-policy" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-black text-white">File processing policy <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/status" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-800">Live availability <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </main>
      <MainFooter />
    </div>
  );
}
