"use client";

import Image from 'next/image';
import { cn } from '../../lib/utils';

export function LogoAnimation({ className, showGlow = false }: { className?: string; showGlow?: boolean }) {
  return (
    <div
      className={cn('relative flex select-none items-center gap-2 opacity-100', className)}
      aria-label="AJN PDF"
      data-ajn-logo="visible"
    >
      {showGlow && <span className="absolute -inset-4 rounded-2xl bg-blue-500/8 blur-2xl" />}
      <span className="relative h-full aspect-square shrink-0">
        <Image
          src="/brand/ajn-logo-transparent.png"
          alt="AJN PDF"
          fill
          sizes="48px"
          className="object-contain drop-shadow-[0_5px_10px_rgba(37,99,235,.16)]"
          priority
        />
      </span>
      <span className="relative whitespace-nowrap text-[clamp(1.02rem,2vw,1.34rem)] font-black tracking-[-.04em] text-slate-950">
        AJN <span className="text-blue-600">PDF</span>
      </span>
    </div>
  );
}
