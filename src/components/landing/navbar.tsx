"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Crown, Menu, Search, UserRound, X } from "lucide-react";
import { LogoAnimation } from "./logo-animation";
import { Button } from "../ui/button";
import { SearchModal } from "../search-modal";
import { LanguageSwitcher } from "../i18n/language-switcher";
import { useLanguage } from "@/lib/i18n/language-context";
import { toolPath } from "@/lib/tool-routes";
import { cn } from "@/lib/utils";
import { AllToolsMenu } from "./all-tools-menu";
import { useAuth } from "@/lib/auth-context";


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
  const auth = useAuth();
  const premium = Boolean(auth.session && auth.plan !== "free");


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
              href="/pricing"
              className="inline-flex h-10 items-center rounded-xl px-2.5 text-[11px] font-extrabold text-[#5b6b80] transition hover:bg-[#fff7df] hover:text-[#a16207] dark:text-[#8b96ab] dark:hover:bg-amber-400/10 dark:hover:text-amber-300"
            >
              Premium
            </Link>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
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

            {auth.session ? (
              <Link
                href="/account"
                className={cn(
                  "hidden min-h-10 items-center gap-2 rounded-xl border px-3 text-[11px] font-black shadow-sm transition sm:inline-flex",
                  premium
                    ? "border-amber-200 bg-[#fff7df] text-amber-900 hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
                    : "border-[#e3e9f4] bg-white text-[#0e1b2c] hover:border-blue-200 hover:bg-[#e1effe] dark:border-white/10 dark:bg-[#111827] dark:text-[#eef2f9] dark:hover:border-blue-400/30 dark:hover:bg-blue-400/10",
                )}
              >
                {premium ? <Crown className="h-4 w-4 text-[#f59e0b]" /> : <UserRound className="h-4 w-4 text-[#1a56db] dark:text-[#3b82f6]" />}
                {premium ? "Premium" : "Account"}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden min-h-10 items-center rounded-xl px-3 text-[11px] font-black text-[#5b6b80] transition hover:bg-slate-100 hover:text-[#0e1b2c] dark:text-[#8b96ab] dark:hover:bg-white/5 dark:hover:text-white sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  href="/pricing"
                  className="hidden min-h-10 items-center gap-1.5 rounded-xl bg-[#1a56db] px-3.5 text-[11px] font-black text-white shadow-[0_7px_18px_rgba(26,86,219,.18)] transition hover:bg-[#123fa8] md:inline-flex"
                >
                  <Crown className="h-3.5 w-3.5 text-amber-300" />
                  Premium
                </Link>
              </>
            )}

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

                <div className="my-2 border-t border-[#e3e9f4] dark:border-white/10" />

                {[
                  { label: "All PDF Tools", href: "/pdf-tools" },
                  { label: "Premium", href: "/pricing" },
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

                <div className="my-2 border-t border-[#e3e9f4] dark:border-white/10" />

                <Link
                  href={auth.session ? "/account" : "/login"}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-11 items-center rounded-xl bg-[#e1effe] px-3 text-sm font-black text-[#1a56db] dark:bg-blue-400/10 dark:text-blue-300"
                >
                  {auth.session ? (premium ? "Premium account" : "Account") : "Sign in"}
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
