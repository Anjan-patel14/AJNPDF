"use client";

import Link from "next/link";
import { ArrowUpRight, ScanLine, Search } from "lucide-react";
import { useMemo } from "react";
import { BUILD_PUBLIC_TOOLS } from "../../lib/build-public-tools";
import { useLanguage } from "@/lib/i18n/language-context";
import { toolPath } from "@/lib/tool-routes";

interface ServicesGridProps {
  query: string;
  category: string;
}

type PublicTool = (typeof BUILD_PUBLIC_TOOLS)[number];

const EDIT_IDS = new Set([
  "edit-pdf", "add-text", "add-image-to-pdf", "watermark-pdf", "crop-pdf", "rotate-pdf",
  "page-number", "flatten-pdf", "sign-pdf", "pdf-metadata", "compare-pdf", "delete-pdf-pages", "extract-images",
]);
const ORGANIZE_IDS = new Set([
  "merge-pdf", "split-pdf", "organize-pdf", "delete-pdf-pages", "rotate-pdf", "crop-pdf", "page-number", "flatten-pdf", "pdf-zip-extract",
]);
const SECURITY_IDS = new Set<string>([]);

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function matchesCategory(tool: PublicTool, category: string) {
  if (category === "all") return true;
  if (category === "edit") return EDIT_IDS.has(tool.id);
  if (category === "organize") return ORGANIZE_IDS.has(tool.id);
  if (category === "security") return SECURITY_IDS.has(tool.id);
  if (category === "conversion") return tool.tag === "convert";
  return true;
}

function ToolCard({ tool }: { tool: PublicTool }) {
  const { tool: localizeTool } = useLanguage();
  const localized = localizeTool(tool.id, tool.name, tool.desc, tool.keywords);
  const Icon = tool.icon;
  const browserConversion = [
    "image-to-pdf", "jpg-to-pdf", "jpeg-to-pdf", "png-to-pdf", "webp-to-pdf", "heic-to-pdf",
    "pdf-to-jpg", "pdf-to-png", "txt-to-pdf", "html-to-pdf", "markdown-to-pdf", "json-to-pdf", "xml-to-pdf",
  ].includes(tool.id);

  return (
    <Link
      href={toolPath(tool.id)}
      prefetch={false}
      aria-label={localized.name}
      data-analytics-id={`tool-card-${tool.id}`}
      data-analytics-category="pdf"
      className="group block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
    >
      <article className="flex h-full min-h-[154px] flex-col rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,.055)] backdrop-blur-lg transition duration-300 ease-out hover:-translate-y-1 hover:border-blue-300/80 hover:shadow-[0_18px_38px_rgba(15,23,42,.11)] dark:border-white/10 dark:bg-slate-900/55 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-blue-600">
            <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700">
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-extrabold leading-5 tracking-[-.025em] text-slate-950 dark:text-slate-50 sm:text-base">{localized.name}</h3>
            {browserConversion && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700">Browser</span>}
          </div>
          <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">{localized.desc}</p>
        </div>
      </article>
    </Link>
  );
}

function ScannerCard() {
  return (
    <Link href="/scanner" className="group block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2" aria-label="Scan to PDF">
      <article className="flex h-full min-h-[154px] flex-col rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-[0_6px_20px_rgba(37,99,235,.06)] transition duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-[0_12px_28px_rgba(37,99,235,.10)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-700"><ScanLine className="h-5 w-5" strokeWidth={2} /></span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-500"><ArrowUpRight className="h-4 w-4" /></span>
        </div>
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2"><h3 className="text-[15px] font-black text-slate-950 sm:text-base">Scan to PDF</h3><span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">Camera</span></div>
          <p className="mt-1.5 text-xs font-medium leading-5 text-slate-600">Capture document pages with your phone camera and create a PDF locally.</p>
        </div>
      </article>
    </Link>
  );
}

export function ServicesGrid({ query, category }: ServicesGridProps) {
  const { language, tool: localizeTool } = useLanguage();
  const normalized = normalize(query.toLocaleLowerCase(language));

  const filteredTools = useMemo(() => BUILD_PUBLIC_TOOLS.filter((tool) => {
    if (!matchesCategory(tool, category)) return false;
    if (!normalized) return true;
    const localized = localizeTool(tool.id, tool.name, tool.desc, tool.keywords);
    const haystack = normalize([localized.name, localized.desc, ...localized.aliases, ...tool.keywords, tool.id].join(" "));
    return haystack.includes(normalized) || normalized.split(" ").every((part) => haystack.includes(part));
  }), [category, normalized, localizeTool]);

  const showScanner = category === "all" && (!normalized || "scan to pdf camera document scanner".includes(normalized));

  if (!filteredTools.length && !showScanner) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center shadow-sm">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-blue-600"><Search className="h-5 w-5" /></span>
        <p className="mt-4 text-base font-black text-slate-950">No matching PDF tool</p>
        <p className="mt-2 text-xs font-semibold text-slate-500">Try merge, compress, scan, convert, sign or protect.</p>
      </div>
    );
  }

  return (
    <div id="ajn-public-tool-grid">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-[-.035em] text-slate-950 dark:text-slate-50 sm:text-2xl">PDF tools</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">Every public tool is shown directly. Nothing is hidden behind a More tools menu.</p>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black text-slate-600">{BUILD_PUBLIC_TOOLS.length} public tools</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {showScanner && <ScannerCard />}
        {filteredTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
      </div>
      {category === "all" && !normalized && (
        <section className="mt-10" aria-labelledby="ajn-tool-visuals-title">
          <div className="mb-4 max-w-2xl">
            <h2 id="ajn-tool-visuals-title" className="text-xl font-black tracking-[-.035em] text-slate-950 dark:text-slate-50 sm:text-2xl">A clearer way to work with PDFs</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">Quick visual guides to editing, organizing and converting your documents.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <a href={toolPath("edit-pdf")} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75 shadow-lg backdrop-blur-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/55"><img src="/images/pdf-edit-preview.svg" alt="PDF editing interface illustration" width="720" height="540" loading="lazy" className="aspect-[16/9] w-full object-cover" /><div className="p-4"><h3 className="font-extrabold text-slate-950 dark:text-white">Edit PDF</h3><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Start with tools for changing and annotating a document.</p></div></a>
            <a href={toolPath("merge-pdf")} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75 shadow-lg backdrop-blur-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/55"><img src="/images/pdf-organize-preview.svg" alt="PDF document organization illustration" width="360" height="210" loading="lazy" className="aspect-[16/9] w-full object-cover" /><div className="p-4"><h3 className="font-extrabold text-slate-950 dark:text-white">Organize PDFs</h3><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Bring pages and files into the order you need.</p></div></a>
            <a href={toolPath("image-to-pdf")} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75 shadow-lg backdrop-blur-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/55"><img src="/images/pdf-convert-preview.svg" alt="PDF conversion illustration" width="360" height="210" loading="lazy" className="aspect-[16/9] w-full object-cover" /><div className="p-4"><h3 className="font-extrabold text-slate-950 dark:text-white">Convert files</h3><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">A visual guide to converting content into PDF workflows.</p></div></a>
          </div>
        </section>
      )}
    </div>
  );
}
