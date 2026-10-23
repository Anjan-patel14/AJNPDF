"use client";

import Image from "next/image";
import { cn } from "../../lib/utils";

/**
 * Shared AJN PDF brand mark. Keeping this component mark-only makes every
 * existing LogoAnimation usage consistent without changing surrounding UI.
 */
export function LogoAnimation({ className, showGlow = false }: { className?: string; showGlow?: boolean }) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      aria-label="AJN PDF"
      role="img"
      data-ajn-logo="mark-only"
    >
      {showGlow && <span aria-hidden="true" className="absolute -inset-3 rounded-full bg-blue-500/10 blur-xl" />}
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
