"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { MainFooter } from "@/components/landing/main-footer";
import { ServicesGrid } from "@/components/landing/services-grid";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { sendAjnAnalytics } from "@/components/analytics/site-analytics";

type DirectoryCategory = "all" | "edit" | "organize" | "security";

const categories: Array<{ id: DirectoryCategory; label: string }> = [
  { id: "all", label: "All PDF Tools" },
  { id: "edit", label: "Edit & Sign" },
  { id: "organize", label: "Organize" },
  { id: "security", label: "Protect & Repair" },
];

function isDirectoryCategory(value: string | null): value is DirectoryCategory {
  return value === "all" || value === "edit" || value === "organize" || value === "security";
}

function queryBucket(value: string): string {
  const n = value.trim().length;
  return n === 0 ? "empty" : n <= 3 ? "1-3" : n <= 8 ? "4-8" : n <= 20 ? "9-20" : "21+";
}

function PDFToolsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<DirectoryCategory>("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("q") || "");
    const value = params.get("category");
    setActiveCategory(isDirectoryCategory(value) ? value : "all");
  }, []);

  const updateUrl = (nextSearch: string, nextCategory: DirectoryCategory, replace = false) => {
    const next = new URLSearchParams();

    if (nextSearch.trim()) next.set("q", nextSearch.trim());
    if (nextCategory !== "all") next.set("category", nextCategory);

    const url = next.toString() ? `${pathname}?${next}` : pathname;

    if (replace) router.replace(url, { scroll: false });
    else router.push(url, { scroll: false });
  };

  const selectCategory = (id: DirectoryCategory) => {
    setActiveCategory(id);
    updateUrl(search, id);
    sendAjnAnalytics({ event_name: "category_filter", path: pathname, category: id });
  };

  const changeSearch = (value: string) => {
    setSearch(value);

    window.clearTimeout((window as Window & { __ajnSearchTimer?: number }).__ajnSearchTimer);

    (window as Window & { __ajnSearchTimer?: number }).__ajnSearchTimer = window.setTimeout(() => {
      updateUrl(value, activeCategory, true);

      if (value.trim()) {
        sendAjnAnalytics({
          event_name: "search",
          path: pathname,
          query_length_bucket: queryBucket(value),
          category: activeCategory,
        });
      }
    }, 300);
  };

  return (
    <div className="ajn-page-shell">
      <Navbar />

      <main className="relative z-10 pb-16 pt-[84px] md:pt-[96px]">
        <section className="mx-auto w-full max-w-7xl px-4 md:px-6 xl:px-8">
          <div className="relative overflow-hidden rounded-[1.35rem] border border-[#e3e9f4] bg-white p-5 shadow-[0_14px_40px_rgba(14,27,44,.08)] dark:border-white/10 dark:bg-[#0c1220] dark:shadow-[0_20px_54px_rgba(0,0,0,.35)] sm:p-7">
            <span className="absolute left-0 top-0 h-1.5 w-28 bg-[#1a56db] dark:bg-[#3b82f6]" aria-hidden="true" />
            <span className="absolute right-7 top-7 h-5 w-5 rounded-full bg-[#f59e0b]" aria-hidden="true" />
            <span className="absolute bottom-7 right-16 h-3 w-3 rounded-full bg-[#0e9f6e] dark:bg-[#10b981]" aria-hidden="true" />

            <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#1a56db] dark:text-blue-300">AJN PDF</p>
            <h1 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#0e1b2c] dark:text-[#eef2f9] sm:text-3xl">
              Free online PDF tools for everyday document work.
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#5b6b80] dark:text-[#8b96ab]">
              Merge, split, compress, organize, edit, sign, protect, unlock and repair PDFs with clear workflow and file-handling details.
            </p>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="relative">
                <label htmlFor="directory-search" className="sr-only">Search PDF tools</label>
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1a56db] dark:text-[#3b82f6]" />

                <Input
                  id="directory-search"
                  value={search}
                  onChange={(event) => changeSearch(event.target.value)}
                  placeholder="Search PDF tools"
                  className="h-11 rounded-xl border-[#e3e9f4] bg-[#f8fafc] pl-10 pr-11 text-[#0e1b2c] shadow-none placeholder:text-[#8b96ab] focus-visible:ring-blue-500/25 dark:border-white/10 dark:bg-[#111827] dark:text-[#eef2f9]"
                />

                {search ? (
                  <button
                    type="button"
                    onClick={() => changeSearch("")}
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8b96ab] transition hover:bg-slate-100 hover:text-[#0e1b2c] dark:hover:bg-white/5 dark:hover:text-white"
                    aria-label="Clear PDF tool search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="ajn-scrollbar-hide flex gap-2 overflow-x-auto" aria-label="PDF tool categories">
                {categories.map(({ id, label }) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => selectCategory(id)}
                    aria-pressed={activeCategory === id}
                    className={cn(
                      "min-h-10 shrink-0 rounded-xl border px-3.5 py-2 text-[10px] font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                      activeCategory === id
                        ? "border-[#1a56db] bg-[#1a56db] text-white"
                        : "border-[#e3e9f4] bg-[#f8fafc] text-[#5b6b80] hover:border-blue-200 hover:bg-[#e1effe] hover:text-[#1a56db] dark:border-white/10 dark:bg-[#111827] dark:text-[#8b96ab] dark:hover:border-blue-400/30 dark:hover:bg-blue-400/10 dark:hover:text-blue-300",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <ServicesGrid query={search} category={activeCategory} />
          </div>

          <section className="mt-10 rounded-[1.35rem] border border-[#e3e9f4] bg-white/92 p-5 shadow-[0_14px_40px_rgba(14,27,44,.06)] sm:p-7" aria-labelledby="pdf-workflow-guide">
            <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#1a56db]">PDF workflow guide</p>
            <h2 id="pdf-workflow-guide" className="mt-2 text-2xl font-black tracking-[-.035em] text-[#0e1b2c] sm:text-3xl">
              Choose the right PDF task before you start.
            </h2>
            <p className="mt-3 max-w-4xl text-sm font-medium leading-7 text-[#5b6b80]">
              Similar PDF jobs can produce very different results. Pick the workflow that matches what you actually need, keep the original file until you verify the download, and review important documents in an independent PDF viewer before sharing them.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-blue-100 bg-blue-50/55 p-5">
                <h3 className="text-base font-black text-[#0e1b2c]">Merge, split or organize?</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#5b6b80]">
                  Merge PDF combines separate files into one document. Split PDF extracts a range or separates pages into smaller files. Organize PDF is the better choice when the pages are already in one PDF and you mainly need to reorder them. Remove Pages and Crop PDF are more precise when only selected pages need changing.
                </p>
              </article>

              <article className="rounded-2xl border border-emerald-100 bg-emerald-50/55 p-5">
                <h3 className="text-base font-black text-[#0e1b2c]">Compress without guessing.</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#5b6b80]">
                  PDF compression is a trade-off between file size and fidelity. Image-heavy documents usually offer more room for reduction than text-only PDFs. Very aggressive target sizes can reduce image clarity and may change searchable text, forms, links or accessibility features, so keep the source and inspect the result.
                </p>
              </article>

              <article className="rounded-2xl border border-violet-100 bg-violet-50/55 p-5">
                <h3 className="text-base font-black text-[#0e1b2c]">Edit, sign and inspect with the right tool.</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#5b6b80]">
                  Add Text, Add Image and Watermark PDF place visible content on pages without pretending to be a full desktop publishing editor. Sign PDF places a visual electronic signature; it is not a certificate-backed digital signature. Edit Metadata changes document properties, while Compare PDF helps review visible differences between two versions.
                </p>
              </article>

              <article className="rounded-2xl border border-amber-100 bg-amber-50/55 p-5">
                <h3 className="text-base font-black text-[#0e1b2c]">Protect, unlock and repair responsibly.</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#5b6b80]">
                  Protect PDF applies password-based security to a document. Unlock PDF requires the current valid password and should only be used when you own the file or have permission to remove protection. Repair PDF attempts recovery of damaged PDF structure but cannot guarantee that every corrupted object or missing page can be restored.
                </p>
              </article>
            </div>
          </section>

          <section className="mt-6 rounded-[1.35rem] border border-[#e3e9f4] bg-[#f8fafc] p-5 sm:p-7" aria-labelledby="pdf-processing-guide">
            <h2 id="pdf-processing-guide" className="text-xl font-black tracking-[-.03em] text-[#0e1b2c]">
              Understand how your PDF is processed.
            </h2>
            <p className="mt-3 max-w-4xl text-sm font-medium leading-7 text-[#5b6b80]">
              AJN PDF uses different processing models depending on the task. Supported browser workflows can operate within the active session, while security, recovery or other advanced operations may use a temporary online request. Each public tool explains its current processing mode and important limits instead of making one privacy claim for every workflow.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/transparency" className="rounded-xl border border-[#dbe4f0] bg-white px-4 py-2.5 text-xs font-black text-[#1a56db] hover:bg-blue-50">
                File handling details
              </Link>
              <Link href="/security" className="rounded-xl border border-[#dbe4f0] bg-white px-4 py-2.5 text-xs font-black text-[#1a56db] hover:bg-blue-50">
                Security practices
              </Link>
              <Link href="/limits" className="rounded-xl border border-[#dbe4f0] bg-white px-4 py-2.5 text-xs font-black text-[#1a56db] hover:bg-blue-50">
                Processing limits
              </Link>
              <Link href="/blog" className="rounded-xl border border-[#dbe4f0] bg-white px-4 py-2.5 text-xs font-black text-[#1a56db] hover:bg-blue-50">
                PDF guides
              </Link>
            </div>
          </section>
        </section>
      </main>

      <MainFooter />
    </div>
  );
}

export default function PDFToolsPage() {
  return <PDFToolsContent />;
}
