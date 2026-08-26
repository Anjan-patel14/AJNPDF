"use client";

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { CheckCircle2, Download, FileText, Settings2, UploadCloud } from 'lucide-react';

const STEPS = [
  ['Upload', UploadCloud],
  ['Adjust', Settings2],
  ['Process', FileText],
  ['Download', Download],
] as const;

export function ProcessingAnimation() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setActive(STEPS.length - 1);
      return;
    }
    const timer = window.setInterval(() => setActive((value) => (value + 1) % STEPS.length), 1800);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div className="flex w-full items-center justify-center overflow-hidden py-10 md:py-16">
      <div className="w-full max-w-xl rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(37,62,113,.09)] sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><FileText className="h-5 w-5" /></span><div><p className="text-sm font-black text-slate-950">Focused file workflow</p><p className="text-[10px] font-semibold text-slate-500">The same clear pattern across AJN PDF tools</p></div></div>
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STEPS.map(([label, Icon], index) => {
            const selected = index === active;
            const complete = index < active;
            return <div key={label} className={`rounded-xl border p-3 transition ${selected ? 'border-violet-200 bg-violet-50 shadow-sm' : complete ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-200 bg-slate-50/70'}`}>
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${selected ? 'bg-violet-600 text-white' : complete ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500'}`}><Icon className="h-4 w-4" /></span>
              <p className="mt-3 text-[10px] font-black text-slate-900">{index + 1}. {label}</p>
            </div>;
          })}
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600 transition-all duration-500 motion-reduce:transition-none" style={{ width: `${((active + 1) / STEPS.length) * 100}%` }} /></div>
      </div>
    </div>
  );
}
