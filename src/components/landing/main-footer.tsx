"use client";

import Link from "next/link";
import { ArrowRight, Cookie, Mail } from "lucide-react";
import { LogoAnimation } from "./logo-animation";
import { AJN_BRAND } from "@/lib/brand";
import { useLanguage } from "@/lib/i18n/language-context";
import { toolPath } from "@/lib/tool-routes";

const commonToolIds = ["merge-pdf","compress-pdf","split-pdf","sign-pdf","protect-pdf","repair-pdf"] as const;
const productLinks = [
  ["All PDF Tools","/pdf-tools"],
  ["Status","/status"],
  ["About","/about"],
  ["Contact","/contact"],
] as const;
const legalLinks = [
  ["Privacy Policy","/privacy"],
  ["Terms","/terms"],
  ["Cookie Policy","/cookies"],
  ["File Processing Policy","/file-processing-policy"],
  ["Data Deletion","/data-deletion"],
] as const;

const fallback: Record<string,[string,string]> = {
  "merge-pdf":["Merge PDF","Combine PDF files."],
  "compress-pdf":["Compress PDF","Compress toward a target size."],
  "split-pdf":["Split PDF","Extract PDF pages."],
  "sign-pdf":["Sign PDF","Add a signature to a PDF."],
  "protect-pdf":["Protect PDF","Add password protection."],
  "repair-pdf":["Repair PDF","Try to recover a damaged PDF."],
};

export function MainFooter() {
  const { t, tool } = useLanguage();
  const openPrivacyChoices = () => window.dispatchEvent(new Event("ajn-open-cookie-consent"));

  return (
    <footer className="relative mt-16 border-t border-[#e3e9f4] bg-white text-[#0e1b2c] dark:border-white/10 dark:bg-[#08101d] dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-11 md:px-8 md:py-14">
        <div className="grid gap-9 lg:grid-cols-[1.2fr_.8fr_.75fr_1fr]">
          <div>
            <LogoAnimation className="h-11 w-[176px]" />
            <p className="mt-4 max-w-sm text-sm font-medium leading-6 text-[#475569] dark:text-[#b6c0d0]">
              Free online PDF tools for everyday document work.
            </p>
            <a
              href={`mailto:${AJN_BRAND.contactEmail}`}
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e3e9f4] bg-[#f8fafc] px-4 text-xs font-black text-[#0e1b2c] transition hover:border-blue-200 hover:bg-[#e1effe] dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <Mail className="h-4 w-4" />
              Contact AJN PDF
            </a>
          </div>

          <div>
            <h3 className="text-xs font-black tracking-[.12em] text-[#1a56db] dark:text-blue-300">PDF TOOLS</h3>
            <nav className="mt-4 space-y-3">
              {commonToolIds.map((id) => {
                const [name, desc] = fallback[id];
                const localized = tool(id, name, desc, []);
                return (
                  <Link
                    key={id}
                    href={toolPath(id)}
                    className="flex items-center gap-2 text-xs font-bold text-[#475569] transition hover:text-[#0e1b2c] dark:text-[#b6c0d0] dark:hover:text-white"
                  >
                    <ArrowRight className="h-3 w-3 text-[#1a56db]" />
                    {localized.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <h3 className="text-xs font-black tracking-[.12em] text-[#f59e0b]">AJN PDF</h3>
            <nav className="mt-4 space-y-3">
              {productLinks.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="block text-xs font-bold text-[#475569] transition hover:text-[#0e1b2c] dark:text-[#b6c0d0] dark:hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="text-xs font-black tracking-[.12em] text-[#0e9f6e] dark:text-[#10b981]">LEGAL & PRIVACY</h3>
            <nav className="mt-4 grid gap-3">
              {legalLinks.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="block text-xs font-bold text-[#475569] transition hover:text-[#0e1b2c] dark:text-[#b6c0d0] dark:hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <button
              type="button"
              onClick={openPrivacyChoices}
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e3e9f4] bg-[#f8fafc] px-4 py-2.5 text-xs font-black text-[#0e1b2c] transition hover:border-emerald-200 hover:bg-[#def7ec] dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <Cookie className="h-4 w-4" />
              {t("cookie.privacy")}
            </button>
          </div>
        </div>

        <div className="mt-9 border-t border-[#e3e9f4] dark:border-white/10" />
        <div className="mt-6 flex flex-col gap-3 text-[11px] font-semibold text-[#64748b] dark:text-[#8b96ab] sm:flex-row sm:items-center sm:justify-between">
          <p>{t("footer.copyright")}</p>
          <p>{t("footer.developed")}</p>
        </div>
      </div>
    </footer>
  );
}
