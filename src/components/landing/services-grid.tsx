"use client";

import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { useMemo } from "react";
import { BUILD_PUBLIC_TOOLS } from "../../lib/build-public-tools";
import { useLanguage } from "@/lib/i18n/language-context";
import { ToolArtwork } from "@/components/ajn/tool-artwork";
import { toolPath } from "@/lib/tool-routes";

interface ServicesGridProps {
  query: string;
  category: string;
}

type PublicTool = (typeof BUILD_PUBLIC_TOOLS)[number];

const GROUPS = [
  {
    id: "core",
    title: "Popular PDF Tools",
    description: "Essential PDF actions.",
    ids: ["merge-pdf", "compress-pdf", "split-pdf", "rotate-pdf"],
    board: "border-blue-100 bg-blue-50/55 dark:border-blue-400/15 dark:bg-blue-400/[.055]",
    bar: "bg-[#1a56db] dark:bg-[#3b82f6]",
  },
  {
    id: "organize",
    title: "Organize PDF",
    description: "Arrange and manage pages.",
    ids: ["delete-pdf-pages", "organize-pdf", "crop-pdf", "page-number", "flatten-pdf"],
    board: "border-amber-100 bg-amber-50/55 dark:border-amber-400/15 dark:bg-amber-400/[.055]",
    bar: "bg-[#f59e0b]",
  },
  {
    id: "edit",
    title: "Edit & Sign PDF",
    description: "Edit content and signatures.",
    ids: ["add-text", "add-image-to-pdf", "watermark-pdf", "compare-pdf", "pdf-metadata", "extract-images", "sign-pdf", "pdf-zip-extract"],
    board: "border-blue-100 bg-blue-50/35 dark:border-blue-400/15 dark:bg-blue-400/[.04]",
    bar: "bg-[#1a56db] dark:bg-[#3b82f6]",
  },
  {
    id: "security",
    title: "Protect & Repair",
    description: "Secure and recover PDFs.",
    ids: ["protect-pdf", "unlock-pdf", "repair-pdf"],
    board: "border-emerald-100 bg-emerald-50/55 dark:border-emerald-400/15 dark:bg-emerald-400/[.055]",
    bar: "bg-[#0e9f6e] dark:bg-[#10b981]",
  },
] as const;

const RED_IDS = new Set(["compress-pdf"]);
const ORGANIZE_IDS = new Set(["delete-pdf-pages", "organize-pdf", "crop-pdf", "page-number", "flatten-pdf"]);
const SECURITY_IDS = new Set(["protect-pdf", "unlock-pdf", "repair-pdf"]);

const INTENT_IDS: Record<string, string[]> = {
  edit: ["add-text", "add-image-to-pdf", "watermark-pdf", "crop-pdf", "rotate-pdf", "page-number", "flatten-pdf", "sign-pdf", "pdf-metadata", "compare-pdf", "delete-pdf-pages", "extract-images"],
  organize: ["merge-pdf", "split-pdf", "organize-pdf", "delete-pdf-pages", "rotate-pdf", "crop-pdf", "page-number", "flatten-pdf", "pdf-zip-extract"],
  security: ["protect-pdf", "unlock-pdf", "repair-pdf"],
};

const SEARCH_EXPANSIONS: Record<string, string[]> = {
  reduce: ["compress", "smaller", "optimize"],
  smaller: ["compress", "reduce"],
  secure: ["protect", "lock"],
  password: ["protect", "unlock"],
  combine: ["merge"],
  separate: ["split"],
  reorder: ["organize"],
  remove: ["delete"],
  signature: ["sign"],
  metadata: ["properties", "info"],
  pages: ["split", "organize", "delete", "rotate"],
};

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function distanceAtMostTwo(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    let min = row[0];

    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = old;
      min = Math.min(min, row[j]);
    }

    if (min > 2) return 3;
  }

  return row[b.length];
}

function searchScore(query: string, haystack: string, name: string) {
  if (!query) return 1;

  const q = normalize(query);
  const h = normalize(haystack);
  const n = normalize(name);

  if (!q) return 1;

  let score = 0;
  if (n === q) score += 160;
  else if (n.startsWith(q)) score += 110;
  else if (n.includes(q)) score += 80;

  if (h.includes(q)) score += 55;

  const raw = q.split(" ").filter(Boolean);
  const tokens = [...new Set(raw.flatMap((token) => [token, ...(SEARCH_EXPANSIONS[token] || [])]))];
  const words = h.split(" ");

  for (const token of tokens) {
    if (words.includes(token)) score += 24;
    else if (words.some((word) => word.startsWith(token) || token.startsWith(word))) score += 12;
    else if (token.length >= 4 && words.some((word) => word.length >= 4 && distanceAtMostTwo(token, word) <= 1)) score += 7;
  }

  if (raw.every((token) => h.includes(token))) score += 35;
  return score;
}

function matchesCategory(tool: PublicTool, category: string) {
  if (category === "all") return true;
  return (INTENT_IDS[category] || []).includes(tool.id);
}

function cardTone(id: string) {
  if (RED_IDS.has(id)) {
    return {
      card: "ajn-card-red",
      accent: "bg-[#d92d20] dark:bg-[#ef4444]",
      icon: "ajn-icon-red",
      arrow: "group-hover:border-red-200 group-hover:bg-red-50 group-hover:text-red-700 dark:group-hover:border-red-400/20 dark:group-hover:bg-red-400/10 dark:group-hover:text-red-300",
    };
  }

  if (ORGANIZE_IDS.has(id)) {
    return {
      card: "ajn-card-blue",
      accent: "bg-[#1a56db] dark:bg-[#3b82f6]",
      icon: "ajn-icon-blue",
      arrow: "group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700 dark:group-hover:border-blue-400/20 dark:group-hover:bg-blue-400/10 dark:group-hover:text-blue-300",
    };
  }

  if (SECURITY_IDS.has(id)) {
    return {
      card: "ajn-card-green",
      accent: "bg-[#0e9f6e] dark:bg-[#10b981]",
      icon: "ajn-icon-green",
      arrow: "group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:group-hover:border-emerald-400/20 dark:group-hover:bg-emerald-400/10 dark:group-hover:text-emerald-300",
    };
  }

  return {
    card: "ajn-card-blue",
    accent: "bg-[#1a56db] dark:bg-[#3b82f6]",
    icon: "ajn-icon-blue",
    arrow: "group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700 dark:group-hover:border-blue-400/20 dark:group-hover:bg-blue-400/10 dark:group-hover:text-blue-300",
  };
}

function Highlight({ text, highlight }: { text: string; highlight: string }) {
  const q = highlight.trim();
  if (!q || q.includes(" ")) return <>{text}</>;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={index} className="rounded-sm bg-blue-100 px-0.5 text-blue-900 dark:bg-blue-400/20 dark:text-blue-200">{part}</mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function ToolCard({ tool, query, priority = false }: { tool: PublicTool; query: string; priority?: boolean }) {
  const { tool: localizeTool } = useLanguage();
  const localized = localizeTool(tool.id, tool.name, tool.desc, tool.keywords);
  const tone = cardTone(tool.id);

  return (
    <Link
      href={toolPath(tool.id)}
      prefetch={false}
      className="group block h-full rounded-[20px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a101d]"
      aria-label={localized.name}
      data-analytics-id={`tool-card-${tool.id}`}
      data-analytics-category="pdf"
    >
      <article className={`ajn-premium-tool-card ${tone.card} flex h-full min-h-[158px] flex-col p-4 sm:p-5`}>
        <div className="flex items-start justify-between gap-4">
          <div className={`flex h-[58px] w-[58px] items-center justify-center rounded-[14px] border p-1.5 ${tone.icon}`}>
            <ToolArtwork
              toolId={tool.id}
              toolName={localized.name}
              priority={priority}
              className="h-12 w-12 shrink-0"
            />
          </div>

          <span className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#e3e9f4] bg-white text-[#8b96ab] transition dark:border-white/10 dark:bg-[#0c1220] ${tone.arrow}`}>
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-4 min-w-0">
          <h3 className="text-[15px] font-black leading-5 tracking-[-.025em] text-[#0e1b2c] dark:text-[#eef2f9] sm:text-base">
            <Highlight text={localized.name} highlight={query} />
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[11.5px] font-medium leading-[1.55] text-[#5b6b80] dark:text-[#8b96ab] sm:text-xs">
            <Highlight text={localized.desc} highlight={query} />
          </p>
        </div>
      </article>
    </Link>
  );
}

export function ServicesGrid({ query, category }: ServicesGridProps) {
  const { language, tool: localizeTool } = useLanguage();

  const filteredTools = useMemo(() => {
    const normalized = query.toLocaleLowerCase(language).trim();

    return BUILD_PUBLIC_TOOLS.map((tool, index) => {
      const localized = localizeTool(tool.id, tool.name, tool.desc, tool.keywords);
      const haystack = [localized.name, localized.desc, ...localized.aliases, ...tool.keywords, tool.id].join(" ");
      return { tool, index, score: searchScore(normalized, haystack, localized.name) };
    })
      .filter((item) => matchesCategory(item.tool, category) && (!normalized || item.score > 0))
      .sort((a, b) => (normalized ? b.score - a.score || a.index - b.index : a.index - b.index))
      .map((item) => item.tool);
  }, [query, category, language, localizeTool]);

  const groupedMode = !query.trim() && category === "all";

  if (filteredTools.length === 0) {
    return (
      <div className="rounded-[20px] border border-[#e3e9f4] bg-white py-12 text-center shadow-[0_14px_44px_rgba(14,27,44,.07)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_20px_60px_rgba(0,0,0,.38)]">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#e3e9f4] bg-[#e1effe] text-[#1a56db] dark:border-blue-400/15 dark:bg-blue-400/10 dark:text-blue-300">
          <Search className="h-5 w-5" />
        </span>
        <p className="mt-4 text-base font-black text-[#0e1b2c] dark:text-[#eef2f9]">No matching PDF tool</p>
        <p className="mt-2 text-xs font-semibold text-[#5b6b80] dark:text-[#8b96ab]">Try merge, compress, split, sign or protect.</p>
      </div>
    );
  }

  if (groupedMode) {
    const byId = new Map(BUILD_PUBLIC_TOOLS.map((tool) => [tool.id, tool]));

    return (
      <div className="space-y-7" id="ajn-public-tool-grid">
        {GROUPS.map((group, groupIndex) => {
          const tools = group.ids.map((id) => byId.get(id)).filter((tool): tool is PublicTool => Boolean(tool));

          return (
            <section
              key={group.id}
              aria-labelledby={`tool-group-${group.id}`}
              className={`relative overflow-hidden rounded-[20px] border p-4 sm:p-5 ${group.board}`}
            >
              <span className={`absolute left-0 top-0 h-12 w-1.5 ${group.bar}`} aria-hidden="true" />

              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="pl-1">
                  <h3 id={`tool-group-${group.id}`} className="text-lg font-black tracking-[-.03em] text-[#0e1b2c] dark:text-[#eef2f9] sm:text-xl">
                    {group.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#5b6b80] dark:text-[#8b96ab]">
                    {group.description}
                  </p>
                </div>

                <span className="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-[#5b6b80] dark:border-white/10 dark:bg-[#111827]/80 dark:text-[#8b96ab]">
                  {tools.length} {tools.length === 1 ? "tool" : "tools"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tools.map((tool, index) => (
                  <ToolCard key={tool.id} tool={tool} query="" priority={groupIndex === 0 && index < 4} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-[#e3e9f4] bg-white/75 p-4 shadow-[0_14px_44px_rgba(14,27,44,.06)] dark:border-white/10 dark:bg-[#0c1220]/85 dark:shadow-[0_20px_60px_rgba(0,0,0,.3)] sm:p-5">
      <p className="mb-4 text-[10px] font-black uppercase tracking-[.12em] text-[#5b6b80] dark:text-[#8b96ab]" aria-live="polite">
        {filteredTools.length} {filteredTools.length === 1 ? "PDF tool" : "PDF tools"}
      </p>

      <div id="ajn-public-tool-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTools.map((tool, index) => (
          <ToolCard key={tool.id} tool={tool} query={query} priority={index < 4} />
        ))}
      </div>
    </div>
  );
}
