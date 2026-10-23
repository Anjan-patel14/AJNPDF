"use client";

import Image from "next/image";
import { cn } from "../../lib/utils";

/** Shared mark-only brand component used by the existing application header. */
export function LogoAnimation({ className, showGlow = false }: { className?: string; showGlow?: boolean }) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      role="img"
      aria-label="AJN PDF"
      data-ajn-logo="mark-only"
    >
      {showGlow ? <span aria-hidden="true" className="absolute -inset-2 rounded-full bg-blue-500/10 blur-xl" /> : null}
      <Image
        src="/ajn-pdf-mark.svg"
        alt=""
        aria-hidden="true"
        width={128}
        height={128}
        priority
        className="relative h-full w-full object-contain"
      />
    </span>
  );
}
