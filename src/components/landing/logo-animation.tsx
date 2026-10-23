"use client";

import Image from "next/image";
import { cn } from "../../lib/utils";

export function LogoAnimation({ className, showGlow = false }: { className?: string; showGlow?: boolean }) {
  return (
    <div
      className={cn("relative flex select-none items-center gap-2 opacity-100", className)}
      aria-label="AJN PDF"
      data-ajn-logo="visible"
    >
      {showGlow && <span className="absolute -inset-4 rounded-2xl bg-blue-500/8 blur-2xl" />}
      <Image
        src="/ajn-pdf-mark.svg"
        alt=""
        aria-hidden="true"
        width={44}
        height={44}
        priority
        className="relative h-9 w-9 shrink-0 object-contain md:h-10 md:w-10"
      />
      <span className="relative whitespace-nowrap text-[clamp(1.02rem,2vw,1.34rem)] font-black tracking-[-.04em] text-slate-950 dark:text-slate-100">
        AJN <span className="text-blue-600 dark:text-blue-400">PDF</span>
      </span>
    </div>
  );
}
