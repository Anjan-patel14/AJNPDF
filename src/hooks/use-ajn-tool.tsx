
'use client';

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { JobPhase, engine } from "@/lib/engine";
import { sendAjnAnalytics } from "@/components/analytics/site-analytics";

export interface ProgressState {
  stage: string;
  detail: string;
  pct: number;
  phase?: JobPhase;
}

export interface LogEntry extends ProgressState {
  ts: number;
}

/**
 * AJN Tool Lifecycle Hook - Production Core v6.0
 * Refined for high-fidelity async execution and cancel support.
 */
export function useAJNTool(toolId: string) {
  const [phase, setPhase] = useState<"idle" | "selecting" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState<ProgressState>({ stage: "", detail: "", pct: 0, phase: 'loading' });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const jobIdRef = useRef<string>(Math.random().toString(36).substr(2, 9));

  const onProgress = useCallback((p: ProgressState) => {
    setProgress(p);
    setLogs(prev => {
      if (prev.length > 0 && prev[prev.length - 1].stage === p.stage && prev[prev.length - 1].detail === p.detail) {
        return prev;
      }
      return [...prev.slice(-49), { ...p, ts: Date.now() }];
    });
  }, []);

  const run = useCallback(async (inputs: any, options = {}) => {
    setPhase("running");
    setLogs([]);
    setError(null);
    setResult(null);
    if (typeof window !== 'undefined') {
      sendAjnAnalytics({ event_name: 'tool_start', path: window.location.pathname, tool_id: toolId });
    }

    try {
      const res = await engine.runTool(toolId, inputs, options, onProgress, jobIdRef.current);
      
      if (!res.success) {
        if (res.error === 'ABORTED') {
          setPhase("idle");
          return;
        }
        throw new Error(res.message);
      }

      setResult(res);
      setPhase("done");
      if (typeof window !== 'undefined') {
        sendAjnAnalytics({ event_name: 'tool_complete', path: window.location.pathname, tool_id: toolId });
      }
    } catch (err: any) {
      console.error("[AJN Hook] Process failure:", err);
      setError(err.message || "An unexpected system error occurred.");
      setPhase("error");
      if (typeof window !== 'undefined') {
        sendAjnAnalytics({ event_name: 'tool_error', path: window.location.pathname, tool_id: toolId });
      }
    }
  }, [toolId, onProgress]);

  const abort = useCallback(() => {
    engine.cancelJob(jobIdRef.current);
    setPhase("idle");
  }, []);

  const reset = useCallback(() => {
    engine.cancelJob(jobIdRef.current);
    jobIdRef.current = Math.random().toString(36).substr(2, 9);
    setPhase("idle"); 
    setProgress({ stage: "", detail: "", pct: 0, phase: 'loading' });
    setLogs([]); 
    setResult(null); 
    setError(null);
    if (typeof window !== 'undefined') {
      sendAjnAnalytics({ event_name: 'tool_reset', path: window.location.pathname, tool_id: toolId });
    }
  }, [toolId]);

  return { phase, progress, logs, result, error, run, abort, reset, setPhase };
}

/**
 * Professional Progress Bar - Industrial Design
 */
export function ProgressBar({ pct, color = "#3B82F6", label, phase }: { pct: number, color?: string, label?: string, phase?: JobPhase }) {
  const phaseColors: Record<string, string> = {
    loading: '#3B82F6',   // Blue
    analyzing: '#8B5CF6', // Purple
    processing: '#F59E0B',// Amber
    finalizing: '#10B981' // Emerald
  };

  const activeColor = phase ? phaseColors[phase] : color;

  return (
    <div className="w-full font-sans animate-in fade-in duration-500">
      <div className="flex justify-between mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        <span className="flex items-center gap-2">
          <div className="h-3 w-1 rounded-sm" style={{ backgroundColor: activeColor }} />
          {label || 'Processing progress'}
        </span>
        <span className="tabular-nums text-slate-900">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 bg-black/5 rounded-md overflow-hidden shadow-inner border border-black/5 p-0.5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full rounded-sm shadow-[0_0_15px_rgba(0,0,0,0.1)]" 
          style={{ backgroundColor: activeColor }} 
        />
      </div>
    </div>
  );
}

/**
 * Live Process Log Stream
 */
export function LogStream({ logs }: { logs: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { 
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; 
  }, [logs]);

  return (
    <div ref={ref} className="h-48 overflow-y-auto p-6 bg-slate-950 rounded-[2.5rem] border border-white/10 font-mono text-[10px] leading-relaxed scrollbar-hide shadow-2xl">
      {logs.length === 0 ? (
        <div className="flex items-center justify-center h-full text-slate-600 uppercase font-black tracking-widest opacity-20">
          Waiting to start...
        </div>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="mb-2 text-slate-400 flex gap-4 animate-in slide-in-from-left-2">
            <span className={i === logs.length - 1 ? "text-white font-bold" : "text-slate-400"}>
              {log.stage}
              {log.detail && <span className="text-slate-600 ml-3">/ {log.detail}</span>}
            </span>
          </div>
        ))
      )}
      {logs.length > 0 && <div className="mt-2 h-0.5 w-8 bg-primary/50" />}
    </div>
  );
}
