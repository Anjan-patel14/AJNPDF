"use client";

import { cn } from '../../lib/utils';

export function LogoAnimation({ className, showGlow = false }: { className?: string; showGlow?: boolean }) {
  return (
    <div className={cn('relative flex select-none items-center gap-2 opacity-100', className)} aria-label="AJN PDF" data-ajn-logo="visible">
      {showGlow && <span className="absolute -inset-4 rounded-2xl bg-blue-500/8 blur-2xl" aria-hidden="true" />}
      <img src="/ajn-logo.svg" alt="" aria-hidden="true" className="relative h-full aspect-square w-auto shrink-0 object-contain" width={40} height={40} />
      <span className="relative whitespace-nowrap text-[clamp(1.02rem,2vw,1.34rem)] font-black tracking-[-.045em] text-slate-950 dark:text-slate-50">
        AJN <span className="text-blue-600 dark:text-blue-400">PDF</span>
      </span>
    </div>
  );
}
