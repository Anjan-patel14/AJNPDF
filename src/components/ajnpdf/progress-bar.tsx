"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface ProgressBarProps {
  progress: number;
  status: string;
  className?: string;
}

export function ProgressBar({ progress, status, className }: ProgressBarProps) {
  const reduceMotion = useReducedMotion();
  const safeProgress = Math.min(100, Math.max(0, progress));
  return (
    <div role="status" aria-live="polite" className={cn("ajn-progress-card w-full rounded-[1.6rem] p-5 md:p-6", className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-400">Processing</p>
          <span className="mt-1 block truncate text-base font-black tracking-tight text-slate-950 md:text-lg">{status}</span>
        </div>
        <span className="ajn-progress-value shrink-0 text-2xl font-black tabular-nums md:text-3xl">{Math.round(safeProgress)}%</span>
      </div>
      <div role="progressbar" aria-label={status} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(safeProgress)} className="ajn-progress-track mt-4 h-2.5 overflow-hidden rounded-lg p-[2px]">
        <motion.div initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${safeProgress}%` }} className="ajn-progress-fill h-full rounded-md" transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }} />
      </div>
      <div className="mt-4 flex items-center gap-2 text-[10px] font-extrabold text-slate-500">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Keep this tab open until the result is ready.
      </div>
    </div>
  );
}
