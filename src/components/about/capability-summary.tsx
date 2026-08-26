'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Cloud, CloudOff, TriangleAlert } from 'lucide-react';
import { getConversionToolManifest, type ConversionToolManifest } from '@/lib/pdf-backend';

export function CapabilitySummary({ toolCount }: { toolCount: number }) {
  const [tools, setTools] = useState<ConversionToolManifest[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getConversionToolManifest(controller.signal)
      .then((items) => { setTools(items); setError(false); })
      .catch(() => { setTools([]); setError(true); });
    return () => controller.abort();
  }, []);

  const counts = useMemo(() => {
    const available = (tools || []).filter((tool) => tool.available !== false).length;
    const unavailable = (tools || []).filter((tool) => tool.available === false).length;
    return { available, unavailable };
  }, [tools]);

  return (
    <div className="relative grid gap-4 sm:grid-cols-2">
      <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-6 text-slate-950 sm:col-span-2">
        <p className="text-[10px] font-black tracking-[.15em] text-blue-700">AJN PDF TOOL DIRECTORY</p>
        <p className="mt-3 text-4xl font-black">{toolCount} focused tools</p>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">PDF, document, image and conversion workflows in one clear workspace.</p>
      </div>
      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 ">
        {tools === null ? <Cloud className="h-5 w-5 animate-pulse text-blue-600" /> : error ? <CloudOff className="h-5 w-5 text-amber-600" /> : <Cloud className="h-5 w-5 text-blue-600" />}
        <p className="mt-4 text-3xl font-black text-foreground">{tools === null ? '…' : error ? 'Offline' : counts.available}</p>
        <p className="mt-1 text-xs font-black text-muted-foreground">Conversion workflows ready</p>
      </div>
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 ">
        {error ? <TriangleAlert className="h-5 w-5 text-amber-600" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        <p className="mt-4 text-3xl font-black text-foreground">{error ? 'Check service' : counts.unavailable}</p>
        <p className="mt-1 text-xs font-black text-muted-foreground">Optional workflows unavailable</p>
      </div>
    </div>
  );
}
