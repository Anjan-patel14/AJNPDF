"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { inferRecoveryType, RECOVERY_MAP, type RecoveryType } from "@/lib/workspace/recovery-map";

export function RecoveryError({
  message,
  type,
  onRetry,
}: {
  message: string;
  type?: RecoveryType;
  onRetry?: () => void;
}) {
  if (!message) return null;
  const resolved = type || inferRecoveryType(message);
  const recovery = RECOVERY_MAP[resolved];

  return (
    <div role="alert" aria-live="assertive" className="ajn-recovery-card mt-3">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#d92d20] dark:text-[#ef4444]" />
        <div className="min-w-0">
          <p className="text-xs font-black text-[#0e1b2c] dark:text-[#eef2f9]">{recovery.title}</p>
          <p className="mt-1 text-[11px] font-semibold leading-5 text-[#475569] dark:text-[#b6c0d0]">{message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recovery.actionHref ? (
              <Link href={recovery.actionHref} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#1a56db] px-3 text-[10px] font-black text-white">
                {recovery.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
            {onRetry ? (
              <button type="button" onClick={onRetry} className="min-h-9 rounded-lg border border-[#e3e9f4] px-3 text-[10px] font-black text-[#0e1b2c] dark:border-white/10 dark:text-[#eef2f9]">
                Retry
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
