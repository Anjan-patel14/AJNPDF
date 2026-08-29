"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Navbar } from "../components/landing/navbar";
import Hero from "../components/landing/hero";
import { QuickToolsScroller } from "../components/landing/quick-tools-scroller";
import { ServicesGrid } from "../components/landing/services-grid";
import { Input } from "../components/ui/input";
import { cn } from "../lib/utils";
import { ADSENSE_SLOTS } from "../lib/ad-slots";
import { sendAjnAnalytics } from "../components/analytics/site-analytics";
import { useLanguage } from "@/lib/i18n/language-context";

const HowItWorks = dynamic(() => import("../components/landing/how-it-works").then((module) => module.HowItWorks));
const FAQSection = dynamic(() => import("../components/landing/faq-section").then((module) => module.FAQSection));
const MainFooter = dynamic(() => import("../components/landing/main-footer").then((module) => module.MainFooter));
const ExpansionSections = dynamic(() => import("../components/landing/expansion-sections"));
const AdSenseUnit = dynamic(() => import("../components/adsense-unit").then((module) => module.AdSenseUnit), { ssr: false });

const categories = [
  { id: "all", label: "All PDF Tools" },
  { id: "edit", label: "Edit & Sign" },
  { id: "organize", label: "Organize" },
  { id: "security", label: "Protect & Repair" },
] as const;

const valueCards = [
  {
    icon: CheckCircle2,
    title: "Focused workspaces",
    text: "Each PDF task opens in a clear, dedicated workspace.",
    tone: "blue",
  },
  {
    icon: ShieldCheck,
    title: "Clear processing",
    text: "Progress, results and download actions stay easy to follow.",
    tone: "green",
  },
  {
    icon: Sparkles,
    title: "Premium when needed",
    text: "Upgrade for an ad-free signed-in experience and plan benefits.",
    tone: "red",
  },
] as const;

const valueTone = {
  blue: {
    icon: "ajn-icon-blue text-[#1a56db] dark:text-[#3b82f6]",
    card: "ajn-card-blue",
  },
  green: {
    icon: "ajn-icon-green text-[#0e9f6e] dark:text-[#10b981]",
    card: "ajn-card-green",
  },
  red: {
    icon: "ajn-icon-red text-[#d92d20] dark:text-[#ef4444]",
    card: "ajn-card-red",
  },
} as const;

export default function HomePage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const normalized = search.trim();
    if (!normalized) return;

    const timer = window.setTimeout(() => {
      const length = normalized.length;
      const queryLengthBucket = length <= 3 ? "1-3" : length <= 7 ? "4-7" : length <= 15 ? "8-15" : "16+";

      sendAjnAnalytics({
        event_name: "search",
        path: window.location.pathname,
        category: activeCategory,
        query_length_bucket: queryLengthBucket,
        element_id: "home-tool-search",
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [search, activeCategory]);

  const chooseCategory = (category: string) => {
    setActiveCategory(category);
    sendAjnAnalytics({
      event_name: "category_filter",
      path: window.location.pathname,
      category,
      element_id: `home-category-${category}`,
    });
  };

  return (
    <div className="ajn-page-shell">
      <Navbar />

      <main>
        <Hero />

        <QuickToolsScroller />

        <section
          className="relative mx-auto max-w-7xl scroll-mt-[72px] px-4 pb-10 pt-6 md:px-8 md:pb-14 md:pt-8"
          id="public-tools"
        >
          <div className="rounded-[20px] border border-[#e3e9f4] bg-white/90 p-4 shadow-[0_14px_44px_rgba(14,27,44,.055)] dark:border-white/10 dark:bg-[#111827]/90 dark:shadow-[0_20px_60px_rgba(0,0,0,.28)] sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#1a56db] dark:text-blue-300">
                  PDF tools
                </p>
                <h2 className="mt-1.5 text-xl font-black tracking-[-.035em] text-[#0e1b2c] dark:text-[#eef2f9] sm:text-2xl">
                  Choose what you want to do.
                </h2>
              </div>

              <div className="h-1.5 w-14 rounded-full bg-[#1a56db] dark:bg-[#3b82f6]" aria-hidden="true" />
            </div>

            <div className="mt-4 rounded-xl border border-[#e3e9f4] bg-[#f8fafc] p-3 dark:border-white/10 dark:bg-[#0c1220]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <label htmlFor="home-tool-search" className="sr-only">
                    {t("nav.searchLabel")}
                  </label>

                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1a56db] dark:text-[#3b82f6]" />

                  <Input
                    id="home-tool-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search PDF tools"
                    enterKeyHint="search"
                    autoComplete="off"
                    className="h-11 rounded-xl border-[#e3e9f4] bg-white pl-10 pr-3 text-sm font-semibold text-[#0e1b2c] shadow-none transition placeholder:text-[#8b96ab] focus-visible:ring-blue-500/25 dark:border-white/10 dark:bg-[#111827] dark:text-[#eef2f9]"
                  />
                </div>

                <div className="ajn-scrollbar-hide flex gap-2 overflow-x-auto pb-0.5" aria-label="Filter PDF tools">
                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => chooseCategory(category.id)}
                      aria-pressed={activeCategory === category.id}
                      className={cn(
                        "min-h-10 shrink-0 rounded-xl border px-3.5 py-2 text-[10px] font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
                        activeCategory === category.id
                          ? "border-[#1a56db] bg-[#1a56db] text-white"
                          : "border-[#e3e9f4] bg-white text-[#5b6b80] hover:border-blue-200 hover:bg-[#e1effe] hover:text-[#1a56db] dark:border-white/10 dark:bg-[#111827] dark:text-[#8b96ab] dark:hover:border-blue-400/30 dark:hover:bg-blue-400/10 dark:hover:text-blue-300",
                      )}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <ServicesGrid query={search} category={activeCategory} />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#1a56db] dark:text-blue-300">
              Built for everyday PDF work
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#0e1b2c] dark:text-[#eef2f9] sm:text-3xl">
              Clean workflows. Clear results.
            </h2>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {valueCards.map(({ icon: Icon, title, text, tone }) => {
              const classes = valueTone[tone];

              return (
                <article key={title} className={`ajn-v4-card ${classes.card} p-6`}>
                  <span className={`flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border ${classes.icon}`}>
                    <Icon className="h-5 w-5" />
                  </span>

                  <h3 className="mt-5 text-base font-black tracking-[-.02em] text-[#0e1b2c] dark:text-[#eef2f9]">
                    {title}
                  </h3>

                  <p className="mt-2 text-xs font-medium leading-5 text-[#5b6b80] dark:text-[#8b96ab]">
                    {text}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <AdSenseUnit
          slot={ADSENSE_SLOTS.homePrimary}
          responsive
          className="ajn-ad-zone my-7 min-h-[100px] md:my-9"
          label={t("common.advertisement")}
        />

        <HowItWorks />
        <ExpansionSections />

        <AdSenseUnit
          slot={ADSENSE_SLOTS.homeSecondary}
          responsive
          className="ajn-ad-zone my-7 min-h-[120px] md:my-9"
          label={t("common.advertisement")}
        />

        <FAQSection />
        <MainFooter />
      </main>
    </div>
  );
}
