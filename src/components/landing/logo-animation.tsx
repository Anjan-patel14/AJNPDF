"use client";

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function LogoAnimation({ className, showGlow = false }: { className?: string; showGlow?: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn('relative flex select-none items-center gap-2', className)}
      aria-label="AJN PDF"
    >
      {showGlow && <span className="absolute -inset-4 rounded-2xl bg-blue-500/8 blur-2xl" />}
      <span className="relative h-full aspect-square shrink-0">
        <Image
          src="/brand/ajn-logo-transparent.png"
          alt=""
          fill
          sizes="48px"
          className="object-contain drop-shadow-[0_5px_10px_rgba(37,99,235,.16)]"
          priority
        />
      </span>
      <span className="relative whitespace-nowrap text-[clamp(1.02rem,2vw,1.34rem)] font-black tracking-[-.04em] text-slate-950">
        AJN <span className="text-blue-600">PDF</span>
      </span>
    </motion.div>
  );
}
