"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const params = useSearchParams();

  const initialCategory = params.get("category");
  const [search, setSearch] = useState(params.get("q") || "");
  const [activeCategory, setActiveCategory] = useState<DirectoryCategory>(
    isDirectoryCategory(initialCategory) ? initialCategory : "all",
  );

  useEffect(() => {
    setSearch(params.get("q") || "");
    const value = params.get("category");
    setActiveCategory(isDirectoryCategory(value) ? value : "all");
  }, [params]);

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
              All PDF tools.
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-[#5b6b80] dark:text-[#8b96ab]">
              Search or choose a category.
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
        </section>
      </main>

      <MainFooter />
    </div>
  );
}

export default function PDFToolsPage() {
  return (
    <Suspense
      fallback={
        <div className="ajn-page-shell flex min-h-screen items-center justify-center px-4 text-center">
          <p className="text-sm font-bold text-[#5b6b80] dark:text-[#8b96ab]">Loading PDF tools…</p>
        </div>
      }
    >
      <PDFToolsContent />
    </Suspense>
  );
}
