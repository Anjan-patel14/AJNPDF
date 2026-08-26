"use client";

import { Archive, FileSpreadsheet, FileText, ImageIcon, Presentation, Type } from 'lucide-react';

const formats = [
  { label: 'PDF', icon: FileText, style: 'text-red-600' },
  { label: 'JPG', icon: ImageIcon, style: 'text-blue-600' },
  { label: 'PNG', icon: ImageIcon, style: 'text-emerald-600' },
  { label: 'DOCX', icon: FileText, style: 'text-blue-700' },
  { label: 'XLSX', icon: FileSpreadsheet, style: 'text-emerald-700' },
  { label: 'PPTX', icon: Presentation, style: 'text-red-500' },
  { label: 'TXT', icon: Type, style: 'text-slate-700' },
  { label: 'ZIP', icon: Archive, style: 'text-blue-600' }];

export function FormatStrip() {
  return (
    <section className="border-y border-slate-200/70 bg-white/70 py-6 backdrop-blur-xl" aria-label="Popular formats">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black text-slate-900">Popular formats, ready when you need them</p>
          <p className="mt-1 text-[11px] font-medium text-slate-500">Each tool shows the formats and options available for that workflow.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {formats.map(({ label, icon: Icon, style }) => (
            <div key={label} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <span className={`ajn-white-icon-tile flex h-7 w-7 items-center justify-center rounded-lg ${style}`}><Icon className="h-3.5 w-3.5" /></span>
              <span className="text-[10px] font-black text-slate-700">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
