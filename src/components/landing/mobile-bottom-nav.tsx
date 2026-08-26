"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSignature, Home, LayoutGrid, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const baseItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Tools", href: "/pdf-tools", icon: LayoutGrid },
  { label: "Sign", href: "/sign-pdf", icon: FileSignature },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const auth = useAuth();
  if (["/admin", "/login", "/signup", "/forgot-password"].some((prefix) => pathname.startsWith(prefix))) return null;
  const items = [...baseItems, { label: auth.session ? "Account" : "Login", href: auth.session ? "/account" : "/login", icon: UserRound }];

  return (
    <nav className="ajn-mobile-bottom-nav md:hidden" aria-label="Quick navigation">
      <div className="ajn-mobile-bottom-nav-inner">
        {items.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("ajn-mobile-nav-item", active && "is-active")} data-analytics-id={`bottom-nav-${label.toLowerCase()}`}>
              <span className="ajn-mobile-nav-icon"><Icon aria-hidden="true" /></span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
