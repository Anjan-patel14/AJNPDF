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
const SECURITY_IDS = new Set(["protect-pdf", "unlock-pdf", "repair-pdf"]);

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
      <article className="flex h-full min-h-[154px] flex-col rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,.055)] backdrop-blur-md transition duration-300 ease-out hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_38px_rgba(15,23,42,.11)] motion-reduce:transform-none motion-reduce:transition-none sm:p-5">
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
            <h3 className="text-[15px] font-extrabold leading-5 tracking-[-.025em] text-slate-950 sm:text-base">{localized.name}</h3>
            {browserConversion && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700">Browser</span>}
          </div>
          <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-[1.65] text-slate-600">{localized.desc}</p>
        </div>
      </article>
    </Link>
  );
}

function ScannerCard() {
  return (
    <Link href="/scanner" className="group block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2" aria-label="Scan to PDF">
      <article className="flex h-full min-h-[154px] flex-col rounded-2xl border border-blue-200/80 bg-blue-50/65 p-4 shadow-[0_8px_24px_rgba(37,99,235,.07)] backdrop-blur-md transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(37,99,235,.13)] motion-reduce:transform-none motion-reduce:transition-none sm:p-5">
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
          <h2 className="text-xl font-black tracking-[-.035em] text-slate-950 sm:text-2xl">PDF tools</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">Every public tool is shown directly. Nothing is hidden behind a More tools menu.</p>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black text-slate-600">{BUILD_PUBLIC_TOOLS.length} public tools</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {showScanner && <ScannerCard />}
        {filteredTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
      </div>
      {category === "all" && !normalized && (
        <section className="mt-12" aria-labelledby="ajn-tool-guides-title">
          <div className="mb-5 max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-blue-700">Tool guides</p>
            <h2 id="ajn-tool-guides-title" className="mt-2 text-2xl font-black leading-tight tracking-[-.04em] text-slate-950 sm:text-3xl">Find the right PDF tool for the job</h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600">Short explanations and visual previews help you choose a workflow before you open a file. Keep your original document until you have checked the downloaded result.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[["edit-pdf","Edit PDF","tool-guide-edit.svg","Edit existing PDF text, replace content where supported, and add text, images or signatures. Review the preview before downloading."],["merge-pdf","Merge PDF","tool-guide-merge.svg","Combine multiple PDF files into one document. Check the file order before creating the final PDF."],["compress-pdf","Compress PDF","tool-guide-compress.svg","Reduce PDF file size for sharing or upload limits. Compare readability and image quality after compression."],["split-pdf","Split PDF","tool-guide-split.svg","Extract selected page ranges or separate a large PDF into smaller documents for easier sharing."],["sign-pdf","Sign PDF","tool-guide-sign.svg","Place a visible signature on the document. This is a visual signature, not a certificate-backed digital signature."],["protect-pdf","Protect PDF","tool-guide-protect.svg","Add password-based PDF protection and review permission settings before sharing the protected file."],["organize-pdf","Organize PDF","tool-guide-organize.svg","Reorder pages into the sequence you need. Review the page order before saving the new document."],["image-to-pdf","Image to PDF","tool-guide-convert.svg","Combine supported images into a PDF. Check image orientation and page sizing in the output."],["extract-images","Extract Images","tool-guide-images.svg","Export supported embedded images from a PDF so you can reuse them separately."],["scanner","Scan to PDF","tool-guide-scan.svg","Capture paper pages with a compatible device camera and create a PDF from the scans."],["watermark-pdf","Watermark PDF","tool-guide-watermark.svg","Add visible text watermarking to pages and check placement so it does not obscure important content."],["page-number","Page Numbers","tool-guide-numbers.svg","Add page numbers with placement and starting-number controls to help readers navigate longer documents."]].map(([id, title, image, description]) => (
              <Link key={id} href={id === "scanner" ? "/scanner" : toolPath(id)} prefetch={false} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75 shadow-[0_8px_24px_rgba(15,23,42,.05)] backdrop-blur-md transition duration-300 ease-out hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_38px_rgba(15,23,42,.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none">
                <img src={`/images/${image}`} alt={`${title} workflow illustration`} width="480" height="260" loading="lazy" decoding="async" className="aspect-[12/7] w-full object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transform-none" />
                <div className="p-4 sm:p-5">
                  <h3 className="text-base font-extrabold leading-snug tracking-[-.025em] text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700">Open tool <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
