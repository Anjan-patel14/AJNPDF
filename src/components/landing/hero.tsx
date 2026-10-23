"use client";

import Link from "next/link";
import { ArrowRight, FilePenLine, Files, ShieldCheck, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative px-4 pb-8 pt-[96px] sm:px-5 md:pb-10 md:pt-[112px]">
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.02fr_.98fr] lg:gap-12">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-bold tracking-wide text-blue-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-blue-300"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> A simpler PDF workspace</span>
          <h1 className="mt-5 text-balance text-[2.25rem] font-black leading-[1.04] tracking-[-.055em] text-[#0e1b2c] dark:text-[#eef2f9] sm:text-[3rem] lg:text-[3.65rem]">Edit PDFs with confidence.<span className="mt-2 block text-blue-600 dark:text-blue-400">Everything else, made simple.</span></h1>
          <p className="mx-auto mt-5 max-w-xl text-sm font-medium leading-7 text-[#5b6b80] dark:text-[#a3aec1] sm:text-base lg:mx-0">Edit, organize, convert, compress and sign documents in one clear, easy-to-use workspace.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/tools/edit-pdf" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(37,99,235,.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_14px_30px_rgba(37,99,235,.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><FilePenLine className="h-4 w-4" aria-hidden="true" /> Edit PDF <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
            <Link href="/pdf-tools" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white/70 px-5 py-3 text-sm font-extrabold text-slate-800 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-100">Explore all tools</Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold text-[#64748b] dark:text-[#a3aec1] lg:justify-start"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-blue-600" aria-hidden="true" /> Clear file requirements</span><span className="inline-flex items-center gap-1.5"><Files className="h-4 w-4 text-blue-600" aria-hidden="true" /> Tools for everyday PDFs</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-[540px]"><div className="absolute inset-8 rounded-[2rem] bg-blue-500/10 blur-3xl" aria-hidden="true" /><div className="relative overflow-hidden rounded-[1.8rem] border border-white/70 bg-white/65 p-3 shadow-[0_24px_70px_rgba(15,23,42,.13)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,.17)] dark:border-white/10 dark:bg-slate-900/45"><img src="/images/pdf-edit-preview.svg" alt="Illustration of a PDF page with editing controls and highlighted text" width="720" height="540" fetchPriority="high" className="h-auto w-full rounded-[1.25rem]" /></div><div className="absolute -bottom-4 -left-2 hidden items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-lg backdrop-blur-xl sm:flex dark:border-white/10 dark:bg-slate-900/80"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-300"><FilePenLine className="h-5 w-5" aria-hidden="true" /></span><span><strong className="block text-sm font-extrabold text-slate-900 dark:text-white">Edit PDF</strong><span className="text-xs text-slate-500 dark:text-slate-400">A clearer place to start</span></span></div></div>
      </div>
    </section>
  );
}
