"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ImageIcon, Menu, Search, X } from "lucide-react";
import { LogoAnimation } from "./logo-animation";
import { Button } from "../ui/button";
import { SearchModal } from "../search-modal";
import { LanguageSwitcher } from "../i18n/language-switcher";
import { useLanguage } from "@/lib/i18n/language-context";
import { toolPath } from "@/lib/tool-routes";
import { cn } from "@/lib/utils";
import { AllToolsMenu } from "./all-tools-menu";

const quickTools = [
  { id: "merge-pdf", fallback: "Merge" },
  { id: "compress-pdf", fallback: "Compress" },
  { id: "split-pdf", fallback: "Split" },
  { id: "add-text", fallback: "Edit" },
  { id: "sign-pdf", fallback: "Sign" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const { t, tool: localizeTool } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[100] border-b transition-all duration-200",
          scrolled || mobileOpen
            ? "border-[#e3e9f4] bg-white/95 shadow-[0_8px_28px_rgba(14,27,44,.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#070b14]/95 dark:shadow-[0_10px_34px_rgba(0,0,0,.28)]"
            : "border-[#e3e9f4]/80 bg-[#f7f9fd]/92 backdrop-blur-lg dark:border-white/10 dark:bg-[#070b14]/88",
        )}
      >
        <div className="mx-auto flex h-[62px] w-full max-w-[1540px] items-center gap-2 px-3 sm:px-4 md:h-[66px] min-[1080px]:px-5 xl:px-6">
          <Link
            href="/"
            className="mr-2 flex shrink-0 items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
            aria-label="AJN PDF home"
          >
            <LogoAnimation className="h-9 w-[126px] sm:w-[132px] md:h-10 md:w-[144px]" />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center gap-0.5 min-[1080px]:flex" aria-label={t("nav.primary")}>
            <Link
              href="/pdf-tools"
              className="inline-flex h-10 items-center rounded-xl bg-[#e1effe] px-3 text-[12px] font-extrabold text-[#1a56db] transition hover:bg-blue-100 dark:bg-blue-400/10 dark:text-blue-300 dark:hover:bg-blue-400/15"
            >
              PDF Tools
            </Link>

            {quickTools.map(({ id, fallback }) => {
              const localized = localizeTool(id, fallback, "", []);
              return (
                <Link
                  key={id}
                  href={toolPath(id)}
                  className="inline-flex h-10 items-center rounded-xl px-2.5 text-[11px] font-extrabold text-[#5b6b80] transition hover:bg-slate-100 hover:text-[#0e1b2c] dark:text-[#8b96ab] dark:hover:bg-white/5 dark:hover:text-white"
                >
                  {localized.name}
                </Link>
              );
            })}

            <Link
              href="/status"
              className="inline-flex h-10 items-center rounded-xl px-2.5 text-[11px] font-extrabold text-[#5b6b80] transition hover:bg-slate-100 hover:text-[#0e1b2c] dark:text-[#8b96ab] dark:hover:bg-white/5 dark:hover:text-white"
            >
              Status
            </Link>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            <a
              href="https://ajn.buzz"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open AJN Buzz Image Tools"
              className="hidden min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 lg:inline-flex"
            >
              <ImageIcon className="h-4 w-4" />
              Image Tools
              <span aria-hidden="true">↗</span>
            </a>
            <a
              href="https://ajn.buzz"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open AJN Buzz Image Tools"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 lg:hidden"
            >
              <ImageIcon className="h-[18px] w-[18px]" />
            </a>

            <AllToolsMenu className="hidden sm:inline-flex" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("nav.searchLabel")}
              onClick={() => setSearchOpen(true)}
              className="h-10 w-10 rounded-xl text-[#5b6b80] hover:bg-[#e1effe] hover:text-[#1a56db] dark:text-[#8b96ab] dark:hover:bg-blue-400/10 dark:hover:text-blue-300"
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>

            <LanguageSwitcher compact className="hidden xl:inline-flex" />

            <Link
              href="/pdf-tools"
              className="hidden min-h-10 items-center rounded-xl bg-[#1a56db] px-3.5 text-[11px] font-black text-white shadow-[0_7px_18px_rgba(26,86,219,.18)] transition hover:bg-[#123fa8] md:inline-flex"
            >
              All PDF Tools
            </Link>

            <AllToolsMenu iconOnly className="sm:hidden" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.menu")}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
              className="h-10 w-10 rounded-xl text-[#5b6b80] dark:text-[#8b96ab] min-[1080px]:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {mobileOpen && (
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.16 }}
              className="overflow-hidden border-t border-[#e3e9f4] bg-white dark:border-white/10 dark:bg-[#0c1220] min-[1080px]:hidden"
            >
              <nav className="mx-auto grid max-h-[calc(100dvh-62px)] max-w-7xl gap-1.5 overflow-y-auto px-3 py-4 sm:px-4" aria-label={t("nav.mobile")}>
                <div className="grid grid-cols-2 gap-2 min-[480px]:grid-cols-3">
                  {quickTools.map(({ id, fallback }) => {
                    const localized = localizeTool(id, fallback, "", []);
                    return (
                      <Link
                        key={id}
                        href={toolPath(id)}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-xl border border-[#e3e9f4] bg-[#f8fafc] px-2 py-3 text-center text-[11px] font-black text-[#0e1b2c] transition hover:border-blue-200 hover:bg-[#e1effe] hover:text-[#1a56db] dark:border-white/10 dark:bg-[#111827] dark:text-[#eef2f9] dark:hover:border-blue-400/30 dark:hover:bg-blue-400/10"
                      >
                        {localized.name}
                      </Link>
                    );
                  })}
                </div>

                <a
                  href="https://ajn.buzz"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-11 items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-800"
                >
                  <span className="inline-flex items-center gap-2"><ImageIcon className="h-4 w-4" /> AJN Buzz Image Tools</span>
                  <span aria-hidden="true">↗</span>
                </a>

                <div className="my-2 border-t border-[#e3e9f4] dark:border-white/10" />

                {[
                  { label: "All PDF Tools", href: "/pdf-tools" },
                  { label: "Service Status", href: "/status" },
                  { label: "Security", href: "/security" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-extrabold text-[#5b6b80] transition hover:bg-slate-100 hover:text-[#0e1b2c] dark:text-[#8b96ab] dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    {item.label}
                    <span aria-hidden="true">›</span>
                  </Link>
                ))}

                <Link
                  href="/pdf-tools"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 flex min-h-11 items-center justify-center rounded-xl bg-[#1a56db] px-3 text-sm font-black text-white"
                >
                  Open PDF Tools
                </Link>

                <div className="mt-2 flex items-center justify-between rounded-xl border border-[#e3e9f4] bg-[#f8fafc] px-3 py-2 dark:border-white/10 dark:bg-[#111827] xl:hidden">
                  <span className="text-xs font-black text-[#5b6b80] dark:text-[#8b96ab]">{t("common.language")}</span>
                  <LanguageSwitcher />
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
