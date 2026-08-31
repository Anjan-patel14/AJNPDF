"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileSignature, Home, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/pdf-tools", label: "PDF tools", icon: LayoutGrid },
  { href: "/sign", label: "Sign", icon: FileSignature },
  { href: "/status", label: "Status", icon: Activity },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-[#e3e9f4] bg-white/96 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-8px_28px_rgba(14,27,44,.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#070b14]/96 md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-black transition",
                active
                  ? "bg-[#e1effe] text-[#1a56db] dark:bg-blue-400/10 dark:text-blue-300"
                  : "text-[#64748b] hover:bg-slate-100 hover:text-[#0e1b2c] dark:text-[#8b96ab] dark:hover:bg-white/5 dark:hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
