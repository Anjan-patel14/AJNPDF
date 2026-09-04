"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ToolArtwork } from "@/components/ajn/tool-artwork";
import { toolPath } from "@/lib/tool-routes";

const quickTools = [
  { id: "edit-pdf", name: "Edit PDF", tone: "blue" },
  { id: "merge-pdf", name: "Merge PDF", tone: "blue" },
  { id: "compress-pdf", name: "Compress PDF", tone: "red" },
  { id: "split-pdf", name: "Split PDF", tone: "blue" },
  { id: "sign-pdf", name: "Sign PDF", tone: "blue" },
  { id: "protect-pdf", name: "Protect PDF", tone: "green" },
  { id: "organize-pdf", name: "Organize PDF", tone: "blue" },
] as const;

const toneClasses = {
  blue: {
    icon: "ajn-icon-blue",
    bar: "bg-[#1a56db] dark:bg-[#3b82f6]",
    hover:
      "hover:border-blue-200 dark:hover:border-blue-400/30",
  },
  red: {
    icon: "ajn-icon-red",
    bar: "bg-[#d92d20] dark:bg-[#ef4444]",
    hover:
      "hover:border-red-200 dark:hover:border-red-400/30",
  },
  green: {
    icon: "ajn-icon-green",
    bar: "bg-[#0e9f6e] dark:bg-[#10b981]",
    hover:
      "hover:border-emerald-200 dark:hover:border-emerald-400/30",
  },
} as const;

const editorFeatures = [
  "Edit existing text",
  "Match PDF font style",
  "Add text, images & signatures",
  "Undo, redo & live preview",
] as const;
export function QuickToolsScroller() {
  return (
    <section
      className="mx-auto w-full max-w-6xl px-4 md:px-8"
      aria-labelledby="ajn-quick-tools-title"
    >
      <Link
        href="/edit-pdf"
        prefetch={false}
        data-ajn-pdf-editor-feature-card="true"
        aria-label="Open AJN PDF Editor"
        className="group relative mb-5 block overflow-hidden rounded-[24px] border-2 border-blue-300 bg-[#eef5ff] p-5 shadow-[0_22px_58px_rgba(37,99,235,.18)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-white hover:shadow-[0_26px_70px_rgba(37,99,235,.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 sm:p-6"
      >
        <span className="absolute inset-y-0 left-0 w-1.5 bg-[#1a56db]" aria-hidden="true" />
        <span className="absolute right-0 top-0 h-24 w-24 rounded-bl-[56px] bg-blue-100/80" aria-hidden="true" />

        <div className="relative grid gap-5 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div className="flex min-w-0 gap-4 sm:gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] border border-blue-200 bg-white shadow-[0_10px_26px_rgba(37,99,235,.12)] sm:h-[74px] sm:w-[74px]">
              <ToolArtwork
                toolId="edit-pdf"
                toolName="PDF Editor"
                className="h-12 w-12 sm:h-14 sm:w-14"
              />
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#1a56db] px-3 py-1 text-[9px] font-black uppercase tracking-[.14em] text-white shadow-sm">
                  New • PDF Editor
                </span>
                <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[.12em] text-emerald-700">
                  Browser only • No upload
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-black tracking-[-.04em] text-[#0e1b2c] sm:text-3xl">
                Edit PDF Online
              </h2>
              <p className="mt-2 max-w-2xl text-xs font-semibold leading-5 text-[#506176] sm:text-sm sm:leading-6">
                Change names, dates, numbers and text. Match the original PDF font style, add images or signatures, manage pages and preview changes before download.
              </p>
            </div>
          </div>

          <div className="relative rounded-[18px] border border-blue-200 bg-white/95 p-4 shadow-sm">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {editorFeatures.map((feature) => (
                <span key={feature} className="flex items-center gap-2 text-[10.5px] font-black text-[#334155] sm:text-[11px]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0e9f6e]" />
                  {feature}
                </span>
              ))}
            </div>

            <span className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1a56db] px-5 text-xs font-black text-white shadow-[0_10px_24px_rgba(26,86,219,.22)] transition group-hover:bg-[#123fa8]">
              Open PDF Editor
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
      <div className="rounded-[20px] border border-[#e3e9f4] bg-white/95 p-4 shadow-[0_12px_36px_rgba(14,27,44,.06)] dark:border-white/10 dark:bg-[#111827]/95 dark:shadow-[0_18px_48px_rgba(0,0,0,.28)]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#1a56db] dark:text-blue-300">
              Quick access
            </p>

            <h2
              id="ajn-quick-tools-title"
              className="mt-1 text-base font-black tracking-[-.025em] text-[#0e1b2c] dark:text-[#eef2f9]"
            >
              Popular PDF tools
            </h2>

            <p className="mt-1 text-[11px] font-semibold text-[#64748b] dark:text-[#8b96ab]">
              Start with the PDF actions you use most.
            </p>
          </div>

          <Link
            href="/pdf-tools"
            className="hidden min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-black text-[#1a56db] transition hover:bg-[#e1effe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-blue-300 dark:hover:bg-blue-400/10 sm:inline-flex"
          >
            View all 26
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-7">
          {quickTools.map((tool) => {
            const tone = toneClasses[tool.tone];

            return (
              <Link
                key={tool.id}
                href={toolPath(tool.id)}
                prefetch={false}
                data-ajn-quick-tool-card="true"
                aria-label={`Open ${tool.name}`}
                className={`group relative flex min-h-[96px] min-w-0 flex-col overflow-hidden rounded-[16px] border border-[#e3e9f4] bg-[#f8fafc] p-3 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_26px_rgba(14,27,44,.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-white/10 dark:bg-[#0c1220] dark:hover:bg-[#151e2e] ${tone.hover}`}
              >
                <span
                  className={`absolute inset-x-0 top-0 h-[3px] ${tone.bar}`}
                  aria-hidden="true"
                />

                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tone.icon}`}
                >
                  <ToolArtwork
                    toolId={tool.id}
                    toolName={tool.name}
                    className="h-8 w-8"
                  />
                </span>

                <span className="mt-auto pt-3 text-[11.5px] font-black leading-4 tracking-[-.01em] text-[#0e1b2c] dark:text-[#eef2f9]">
                  {tool.name}
                </span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/pdf-tools"
          className="mt-3 flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#e3e9f4] bg-[#f8fafc] text-[11px] font-black text-[#1a56db] transition hover:border-blue-200 hover:bg-[#e1effe] dark:border-white/10 dark:bg-[#0c1220] dark:text-blue-300 dark:hover:border-blue-400/30 dark:hover:bg-blue-400/10 sm:hidden"
        >
          View all PDF tools
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
