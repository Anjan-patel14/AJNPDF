"use client";

import { Loader2 } from "lucide-react";

export function ProcessingState({
  label,
  progress,
  canCancel = false,
  onCancel,
}: {
  label: string;
  progress?: number;
  canCancel?: boolean;
  onCancel?: () => void;
}) {
  const known = typeof progress === "number";
  const pct = known ? Math.max(0, Math.min(100, progress)) : undefined;

  return (
    <div role="status" aria-live="polite" aria-busy="true" className="rounded-2xl border border-[#e3e9f4] bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-[#1a56db] dark:text-[#3b82f6]" />
        <p className="min-w-0 flex-1 text-xs font-black text-[#0e1b2c] dark:text-[#eef2f9]">{label}</p>
        {known ? <span className="text-[10px] font-black text-[#64748b] dark:text-[#8b96ab]">{Math.round(pct!)}%</span> : null}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eef2f9] dark:bg-white/10">
        <div
          className={known ? "h-full rounded-full bg-[#1a56db] transition-[width]" : "h-full w-2/5 rounded-full bg-[#1a56db] ajn-route-skeleton"}
          style={known ? { width: `${pct}%` } : undefined}
        />
      </div>
      {canCancel && onCancel ? (
        <button type="button" onClick={onCancel} className="mt-3 text-[10px] font-black text-[#d92d20] dark:text-[#ef4444]">
          Cancel
        </button>
      ) : null}
    </div>
  );
}
