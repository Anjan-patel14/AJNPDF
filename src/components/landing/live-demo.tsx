"use client";

import Link from 'next/link';
import { ArrowRight, Cpu, FileCheck2, Monitor, Server, Trash2 } from 'lucide-react';
import { BackendStatus } from '@/components/junction/backend-status';
import { Button } from '@/components/ui/button';

const browserSteps = [
  'The file is read into the current browser session.',
  'The selected browser processor performs the supported operation.',
  'The result is prepared for download without intentional AJN PDF upload.'];

const serverSteps = [
  'The page confirms that temporary server processing is required.',
  'The file is sent to the configured Python service and validated.',
  'A unique temporary folder is removed after the response is delivered.'];

export function LiveDemo() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
      <div className="absolute -left-28 top-28 h-56 w-56 rounded-full bg-red-500/8" />
      <div className="absolute -right-28 bottom-8 h-64 w-64 rounded-full bg-blue-500/10" />
      <div className="relative overflow-hidden rounded-[2.2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_40px_90px_rgba(15,23,42,.2)] md:p-10 lg:p-12">
        <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full border-[70px] border-blue-500/12" />
        <div className="absolute -bottom-32 left-[34%] h-80 w-80 rounded-full border-[58px] border-emerald-400/8" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black tracking-[.14em] text-blue-200"><Cpu className="h-3.5 w-3.5" /> PROCESSING ARCHITECTURE</span>
            <h2 className="mt-5 text-4xl font-black tracking-[-.04em] md:text-5xl">Two modes, clearly explained.</h2>
            <p className="mt-5 text-sm font-medium leading-7 text-slate-300">The product does not use one privacy claim for every tool. Each tool page identifies whether processing is in-browser or through the temporary Python service.</p>
            <Link href="/transparency" className="mt-7 inline-block"><Button className="h-11 rounded-xl bg-white px-5 text-[11px] font-black text-slate-950 hover:bg-blue-50">Read processing transparency <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-white/7 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300"><Monitor className="h-5 w-5" /></span><div><p className="text-xs font-black text-emerald-300">BROWSER MODE</p><h3 className="text-lg font-black">Local-first tools</h3></div></div>
              <div className="mt-5 space-y-4">{browserSteps.map((step, index) => <div key={step} className="flex gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-[10px] font-black text-emerald-300">{index + 1}</span><p className="text-xs font-medium leading-5 text-slate-300">{step}</p></div>)}</div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/7 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-400/15 text-blue-300"><Server className="h-5 w-5" /></span><div><p className="text-xs font-black text-blue-300">SERVER MODE</p><h3 className="text-lg font-black">Security and recovery</h3></div></div>
              <div className="mt-5 space-y-4">{serverSteps.map((step, index) => <div key={step} className="flex gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-400/15 text-[10px] font-black text-blue-300">{index + 1}</span><p className="text-xs font-medium leading-5 text-slate-300">{step}</p></div>)}</div>
            </article>

            <div className="md:col-span-2 rounded-3xl border border-white/10 bg-white p-4 text-slate-900"><BackendStatus /></div>
          </div>
        </div>

        <div className="relative z-10 mt-8 grid gap-3 border-t border-white/10 pt-7 sm:grid-cols-3">
          {[{ icon: FileCheck2, text: 'Input validation before processing' }, { icon: Trash2, text: 'Temporary cleanup after delivery' }, { icon: Server, text: 'Live availability shown to the user' }].map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 text-xs font-bold text-slate-200"><Icon className="h-4 w-4 text-blue-300" />{text}</div>)}
        </div>
      </div>
    </section>
  );
}
