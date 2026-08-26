"use client";

import Link from "next/link";
import { ArrowRight, FileText, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUILD_PUBLIC_TOOLS } from "@/lib/build-public-tools";

export function MobileHomeHero() {
  return (
    <section className="relative px-4 pb-3 pt-[78px] md:hidden">
      <div className="ajn-mobile-hero relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_18px_44px_rgba(37,62,113,.07)]">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[9px] font-black text-violet-700"><Sparkles className="h-3 w-3" /> {BUILD_PUBLIC_TOOLS.length} focused tools</span>
          <h1 className="mt-4 text-[2.05rem] font-black leading-[.99] tracking-[-.052em] text-slate-950">All the PDF tools you need. <span className="text-violet-600">Simple, fast, focused.</span></h1>
          <p className="mt-3 max-w-sm text-[12.5px] font-semibold leading-5 text-slate-600">Edit, organize, protect, sign, optimize and manage PDFs and images with a smaller maintained toolkit.</p>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <Button asChild className="ajn-primary-action h-11 rounded-xl text-[11px] font-black"><Link href="/pdf-tools">Explore {BUILD_PUBLIC_TOOLS.length} <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" className="ajn-secondary-action h-11 rounded-xl text-[11px] font-black"><Link href="/merge-pdf"><FileText className="h-4 w-4" /> Merge PDF</Link></Button>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/75 px-3 py-2 text-[10px] font-bold text-slate-500"><Search className="h-3.5 w-3.5 text-violet-600" /> Search merge, compress, sign, protect or image.</div>
        </div>
      </div>
    </section>
  );
}
