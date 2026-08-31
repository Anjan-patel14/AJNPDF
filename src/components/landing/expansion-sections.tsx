"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  FileCheck2,
  Image as ImageIcon,
  Laptop,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

const workCards = [
  {
    icon: Laptop,
    title: "Fast on desktop",
    text: "Open any PDF tool directly for longer editing, organization and document workflows.",
    cta: "Open PDF tools",
    href: "/pdf-tools",
    tone: "blue",
  },
  {
    icon: Smartphone,
    title: "Designed for mobile",
    text: "Use the same focused PDF tools from a phone or tablet with a responsive interface.",
    cta: "Browse tools",
    href: "/pdf-tools",
    tone: "green",
  },
  {
    icon: ShieldCheck,
    title: "Clear processing",
    text: "Each tool shows the relevant file handling, limits and processing behavior before you work.",
    cta: "View security",
    href: "/security",
    tone: "amber",
  },
] as const;

const toneClasses = {
  blue: "border-blue-100 bg-[#f8fbff] dark:border-blue-400/15 dark:bg-blue-400/[.045]",
  green: "border-emerald-100 bg-[#f8fffc] dark:border-emerald-400/15 dark:bg-emerald-400/[.045]",
  amber: "border-amber-100 bg-[#fffdf7] dark:border-amber-400/15 dark:bg-amber-400/[.045]",
} as const;

const confidenceItems = [
  "20 focused public PDF tools",
  "No public login required",
  "Responsive desktop and mobile UI",
  "Clear file-processing information",
] as const;

export default function ExpansionSections() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#1a56db] dark:text-blue-300">
            Simple PDF workflow
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#0e1b2c] dark:text-[#eef2f9] sm:text-3xl">
            Open a tool. Process your PDF. Download the result.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-6 text-[#64748b] dark:text-[#94a3b8]">
            AJN PDF keeps everyday PDF work direct, responsive and easy to understand.
          </p>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {workCards.map(({ icon: Icon, title, text, cta, href, tone }) => (
            <article
              key={title}
              className={`rounded-[22px] border p-6 shadow-[0_14px_38px_rgba(14,27,44,.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(14,27,44,.075)] ${toneClasses[tone]}`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#111827]">
                <Icon className="h-5 w-5 text-[#1a56db] dark:text-blue-300" />
              </span>
              <h3 className="mt-5 text-base font-black tracking-[-.02em] text-[#0e1b2c] dark:text-[#eef2f9]">{title}</h3>
              <p className="mt-2 min-h-[60px] text-xs font-medium leading-5 text-[#5b6b80] dark:text-[#8b96ab]">{text}</p>
              <Link href={href} className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-black text-[#1a56db] transition hover:gap-2 dark:text-blue-300">
                {cta}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-7">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <article className="rounded-[24px] border border-blue-100 bg-white p-6 shadow-[0_16px_46px_rgba(14,27,44,.055)] dark:border-white/10 dark:bg-[#111827]">
            <div className="flex items-center gap-3">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px] border border-blue-100 bg-[#e1effe] text-[#1a56db] dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
                <FileCheck2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#1a56db] dark:text-blue-300">AJN PDF</p>
                <h2 className="mt-1 text-xl font-black tracking-[-.03em] text-[#0e1b2c] dark:text-[#eef2f9]">
                  Professional PDF tools, direct access
                </h2>
              </div>
            </div>

            <ul className="mt-5 space-y-3">
              {[
                "Merge, split, compress, organize, rotate and crop PDFs.",
                "Add text, images, signatures, page numbers and watermarks.",
                "Protect, unlock and repair supported PDFs with clear validation.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-medium leading-6 text-[#5b6b80] dark:text-[#8b96ab]">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#1a56db]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/pdf-tools"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1a56db] px-5 text-xs font-black text-white shadow-[0_9px_24px_rgba(26,86,219,.16)] transition hover:bg-[#123fa8]"
            >
              View all PDF tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="relative overflow-hidden rounded-[24px] border border-emerald-100 bg-[#f8fffc] p-6 shadow-[0_16px_46px_rgba(14,27,44,.055)] dark:border-emerald-400/15 dark:bg-emerald-400/[.045]">
            <div className="absolute right-5 top-5 flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-[#0e9f6e] shadow-sm dark:border-emerald-400/15 dark:bg-[#111827] dark:text-emerald-300">
              <Sparkles className="h-3 w-3" />
              Image tools
            </div>

            <div className="flex items-center gap-3 pr-24">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px] border border-emerald-100 bg-[#def7ec] text-[#0e9f6e] dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                <ImageIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#0e9f6e] dark:text-emerald-300">AJN BUZZ</p>
                <h2 className="mt-1 text-xl font-black tracking-[-.03em] text-[#0e1b2c] dark:text-[#eef2f9]">
                  Need image tools?
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm font-medium leading-6 text-[#5b6b80] dark:text-[#8b96ab]">
              Continue to AJN Buzz for image compression, resize, crop, conversion and quick image editing tools.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {["Compress","Resize","Edit"].map((label) => (
                <div key={label} className="rounded-2xl border border-emerald-100 bg-white px-3 py-4 text-center text-[10px] font-black text-[#334155] shadow-sm dark:border-emerald-400/10 dark:bg-[#111827] dark:text-[#cbd5e1]">
                  {label}
                </div>
              ))}
            </div>

            <a
              href="https://ajn.buzz"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0e9f6e] px-5 text-xs font-black text-white shadow-[0_9px_24px_rgba(14,159,110,.14)] transition hover:bg-[#087f5b]"
            >
              Open AJN Buzz Image Tools
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <div className="rounded-[22px] border border-[#e3e9f4] bg-white p-6 shadow-[0_14px_44px_rgba(14,27,44,.05)] dark:border-white/10 dark:bg-[#111827]">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#1a56db] dark:text-blue-300">Built for daily PDF work</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#0e1b2c] dark:text-[#eef2f9] sm:text-3xl">
              Simple, focused and production-ready.
            </h2>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {confidenceItems.map((item) => (
              <div key={item} className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-[#e3e9f4] bg-[#f8fafc] px-4 py-3 dark:border-white/10 dark:bg-[#0c1220]">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0e9f6e]" />
                <span className="text-xs font-black text-[#334155] dark:text-[#cbd5e1]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
