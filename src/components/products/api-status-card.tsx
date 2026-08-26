"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react';
import { configuredPdfBackendCandidates } from '@/lib/backend-service-url';

type ApiStatus = { enabled?: boolean; configured_keys?: number; configuration_valid?: boolean; authentication?: string; supported_scopes?: string[] };

export function ApiStatusCard() {
  const [state, setState] = useState<{ loading: boolean; data?: ApiStatus; error?: string }>({ loading: true });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const candidates = configuredPdfBackendCandidates(process.env.NODE_ENV === 'production');
      for (const base of candidates) {
        try {
          const response = await fetch(`${base}/api/v1/status`, { cache: 'no-store' });
          if (!response.ok) continue;
          const data = await response.json();
          if (!cancelled) setState({ loading: false, data });
          return;
        } catch {
          // Try the next configured processing service.
        }
      }
      if (!cancelled) setState({ loading: false, error: 'AJN API status is currently unavailable.' });
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.loading) return <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3 text-sm font-black text-slate-700"><Loader2 className="h-5 w-5 animate-spin text-violet-700" /> Checking API v1…</div></div>;
  if (state.error || !state.data) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><CircleAlert className="mt-0.5 h-5 w-5 text-amber-700"/><div><p className="text-sm font-black text-amber-950">API status unavailable</p><p className="mt-1 text-xs font-medium leading-5 text-amber-900/70">{state.error}</p></div></div></div>;
  const ready = state.data.enabled && state.data.configuration_valid && Number(state.data.configured_keys || 0) > 0;
  return <div className={`rounded-2xl border p-5 ${ready ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}><div className="flex items-start gap-3">{ready?<CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700"/>:<CircleAlert className="mt-0.5 h-5 w-5 text-slate-500"/>}<div><p className="text-sm font-black text-slate-950">{ready ? 'AJN API v1 is enabled' : 'AJN API v1 is installed but not publicly enabled'}</p><p className="mt-1 text-xs font-medium leading-5 text-slate-600">Authentication: {state.data.authentication || 'X-AJN-API-Key'} · Configured keys: {state.data.configured_keys ?? 0}</p><div className="mt-3 flex flex-wrap gap-2">{(state.data.supported_scopes || []).map(scope=><span key={scope} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-600 shadow-sm">{scope}</span>)}</div></div></div></div>;
}
