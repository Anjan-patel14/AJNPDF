"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const toneClass = {
  blue: "ajn-icon-blue",
  red: "ajn-icon-red",
  green: "ajn-icon-green",
} as const;

export function QuickToolsScroller() {
  const scroller = useRef<HTMLDivElement | null>(null);

  const move = (direction: -1 | 1) => {
    scroller.current?.scrollBy({
      left: direction * Math.min(560, Math.max(280, scroller.current.clientWidth * 0.68)),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 md:px-8" aria-label="Quick PDF tools">
      <div className="rounded-[20px] border border-[#e3e9f4] bg-white/90 p-3 shadow-[0_14px_44px_rgba(14,27,44,.07)] dark:border-white/10 dark:bg-[#111827]/90 dark:shadow-[0_20px_60px_rgba(0,0,0,.36)]">
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#5b6b80] dark:text-[#8b96ab]">
            Quick access
          </p>

          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Scroll quick PDF tools left"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e3e9f4] bg-white text-[#5b6b80] transition hover:border-blue-200 hover:text-[#1a56db] dark:border-white/10 dark:bg-[#0c1220] dark:text-[#8b96ab] dark:hover:border-blue-400/30 dark:hover:text-blue-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Scroll quick PDF tools right"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e3e9f4] bg-white text-[#5b6b80] transition hover:border-blue-200 hover:text-[#1a56db] dark:border-white/10 dark:bg-[#0c1220] dark:text-[#8b96ab] dark:hover:border-blue-400/30 dark:hover:text-blue-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={scroller}
          className="ajn-scrollbar-hide flex snap-x snap-proximity gap-3 overflow-x-auto pb-1"
        >
          {quickTools.map((tool) => (
            <Link
              key={tool.id}
              href={toolPath(tool.id)}
              prefetch={false}
              data-ajn-quick-tool-card="true"
              className="group flex min-w-[158px] snap-start items-center gap-3 border px-3 py-3 transition duration-200 sm:min-w-[180px]"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border ${toneClass[tool.tone]}`}>
                <ToolArtwork toolId={tool.id} toolName={tool.name} className="h-9 w-9" />
              </span>
              <span className="text-xs font-black text-[#0e1b2c] dark:text-[#eef2f9]">{tool.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
