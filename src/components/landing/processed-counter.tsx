"use client";

import React, { useEffect, useState } from "react";
import { Zap } from "lucide-react";

const STORAGE_KEY = "ajn_session_completed_tools";

export function ProcessedCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const read = () => setCount(Number(sessionStorage.getItem(STORAGE_KEY) || "0"));
    const increment = () => {
      const next = Number(sessionStorage.getItem(STORAGE_KEY) || "0") + 1;
      sessionStorage.setItem(STORAGE_KEY, String(next));
      setCount(next);
    };
    read();
    window.addEventListener("ajn-tool-completed", increment);
    return () => window.removeEventListener("ajn-tool-completed", increment);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 px-6 py-3 bg-white border border-black/5 rounded-full shadow-xl">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center"><Zap className="w-4 h-4 text-primary" /></div>
        <div className="flex flex-col">
          <span className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{count.toLocaleString()}</span>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Completed in this browser session</span>
        </div>
      </div>
    </div>
  );
}
