"use client";

import { cn } from '../../lib/utils';

export function LogoAnimation({ className, showGlow = false }: { className?: string; showGlow?: boolean }) {
  return (
    <div
      className={cn('relative flex select-none items-center gap-2 opacity-100', className)}
      aria-label="AJN PDF"
      data-ajn-logo="visible"
    >
      {showGlow && <span className="absolute -inset-4 rounded-2xl bg-blue-500/8 blur-2xl" />}
      <span className="relative flex h-full aspect-square shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black tracking-tight text-white shadow-sm" aria-hidden="true">
        AJN
      </span>
      <span className="relative whitespace-nowrap text-[clamp(1.02rem,2vw,1.34rem)] font-black tracking-[-.04em] text-slate-950">
        AJN <span className="text-blue-600">PDF</span>
      </span>
    </div>
  );
}
