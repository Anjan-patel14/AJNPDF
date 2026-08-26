'use client';

import type { OutputBuffer } from '@/lib/engine';
import { CheckCircle2, Download, ExternalLink, FileCode, Trash2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { sendAjnAnalytics } from '@/components/analytics/site-analytics';
import { toolIdFromPathname } from '@/lib/tool-routes';

interface Props { jobs: OutputBuffer[]; onPreview: (j: OutputBuffer) => void; onClear: () => void; }

export function OutputSection({ jobs, onPreview, onClear }: Props) {
  const { t } = useLanguage();
  const handleDownload = (job: OutputBuffer) => {
    if (!job.objectUrl) return;
    const a = document.body.appendChild(document.createElement('a'));
    a.href = job.objectUrl; a.download = job.fileName; a.click(); document.body.removeChild(a);
    const toolId = toolIdFromPathname(window.location.pathname);
    sendAjnAnalytics({ event_name: 'download', path: window.location.pathname, tool_id: toolId });
  };
  return <section className="space-y-4" aria-live="polite">
    <div className="flex items-center justify-between gap-3 px-1"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-4 w-4"/></div><h3 className="text-sm font-extrabold text-slate-900">{t('result.ready')} ({jobs.length})</h3></div><button type="button" onClick={onClear} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4"/>{t('common.clearAll')}</button></div>
    <div className="space-y-3">{jobs.map(job=><article key={job.id} className="rounded-2xl border border-emerald-200/70 bg-white p-4 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><FileCode className="h-5 w-5"/></div><div className="min-w-0"><h4 className="truncate text-sm font-extrabold text-slate-900">{job.fileName}</h4><p className="mt-1 text-xs font-medium text-slate-500">{job.sizeFormatted}</p></div></div>
      <div className="flex gap-2"><button type="button" onClick={()=>onPreview(job)} className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:border-blue-200 hover:text-blue-600"><ExternalLink className="h-4 w-4"/>{t('common.preview')}</button><button type="button" onClick={()=>handleDownload(job)} className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/15 hover:bg-emerald-700"><Download className="h-4 w-4"/>{t('common.download')}</button></div>
    </div></article>)}</div>
  </section>;
}
