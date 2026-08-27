"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToolArtwork } from "@/components/ajn/tool-artwork";
import { toolPath } from "@/lib/tool-routes";

const quickTools = [
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

export function QuickToolsScroller() {
  return (
    <section
      className="mx-auto w-full max-w-6xl px-4 md:px-8"
      aria-labelledby="ajn-quick-tools-title"
    >
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
            View all 20
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
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