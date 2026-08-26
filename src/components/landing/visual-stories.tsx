"use client";

import Link from 'next/link';
import { ArrowRight, Check, Download, ImageIcon, Layers3, MoveRight, ScanText } from 'lucide-react';
import { ToolArtwork } from '@/components/ajn/tool-artwork';

export function VisualStories() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
      <div className="max-w-3xl">
        <span className="ajn-section-kicker">Visual, focused, familiar</span>
        <h2 className="mt-5 text-4xl font-black tracking-[-.04em] text-slate-950 md:text-6xl">Built around the document, not around extra UI.</h2>
        <p className="mt-5 text-base font-medium leading-7 text-slate-600">Large previews appear only where they help. Everyday tools stay compact, fast to scan and easy to understand.</p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <article className="ajn-visual-story-card overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(37,62,113,.08)]">
          <div className="relative min-h-[310px] overflow-hidden bg-slate-50 p-6 md:p-8">
            <div className="relative z-10 mx-auto max-w-md">
              <div className="flex items-center justify-between"><div className="flex items-center gap-3"><ToolArtwork toolId="organize-pdf" toolName="Organize PDF" className="h-11 w-11"/><div><p className="text-sm font-black text-slate-950">Organize PDF</p><p className="text-[10px] font-semibold text-slate-500">Arrange pages visually</p></div></div><Layers3 className="h-5 w-5 text-violet-500"/></div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[1,2,3,4,5,6].map((page) => <div key={page} className="ajn-story-page"><span>{page}</span><i/><i/><i/></div>)}
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8"><h3 className="text-2xl font-black tracking-[-.03em] text-slate-950">See the change before you finish.</h3><p className="mt-3 text-sm font-medium leading-6 text-slate-500">Visual tools give more room to page order, placement and previews while keeping secondary controls quiet.</p><Link href="/organize-pdf" className="mt-5 inline-flex items-center gap-2 text-xs font-black text-blue-600">Open Organize PDF <ArrowRight className="h-4 w-4"/></Link></div>
        </article>

        <article className="ajn-visual-story-card overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(37,62,113,.08)]">
          <div className="relative min-h-[310px] overflow-hidden bg-slate-50 p-6 md:p-8">
            <div className="relative z-10 mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(37,62,113,.09)]">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="ajn-story-format"><ImageIcon className="h-6 w-6 text-emerald-600"/><b>Image</b><span>Source file</span></div>
                <MoveRight className="h-5 w-5 text-blue-500"/>
                <div className="ajn-story-format"><ToolArtwork toolId="image-to-pdf" toolName="Image to PDF" className="h-12 w-12"/><b>PDF</b><span>Ready result</span></div>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2"><div className="ajn-story-check"><Check/>Clean output</div><div className="ajn-story-check"><ScanText/>Clear options</div></div>
              <button type="button" className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-black text-white"><Download className="h-4 w-4"/>Download result</button>
            </div>
          </div>
          <div className="p-6 md:p-8"><h3 className="text-2xl font-black tracking-[-.03em] text-slate-950">Conversion without the clutter.</h3><p className="mt-3 text-sm font-medium leading-6 text-slate-500">Format tools keep the source, key options and final result easy to understand at a glance.</p><Link href="/conversion-tools" className="mt-5 inline-flex items-center gap-2 text-xs font-black text-blue-600">Browse conversions <ArrowRight className="h-4 w-4"/></Link></div>
        </article>
      </div>
    </section>
  );
}
