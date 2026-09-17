"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Grip, Search, Sparkles, X } from 'lucide-react';
import { BUILD_PUBLIC_TOOLS } from '@/lib/build-public-tools';
import type { ServiceTool } from '@/lib/tools-data';
import { toolPath } from '@/lib/tool-routes';
import { ToolArtwork } from '@/components/ajn/tool-artwork';
import { useLanguage } from '@/lib/i18n/language-context';
import { cn } from '@/lib/utils';
import { scoreToolSearch } from '@/lib/tool-search';

const POPULAR_IDS = ['merge-pdf','split-pdf','compress-pdf','organize-pdf','protect-pdf','sign-pdf'];
const GROUP_ORDER = ['Popular','Organize PDF','Edit & Sign','Security & Recovery','More PDF Tools'] as const;
type GroupName = (typeof GROUP_ORDER)[number];

function groupFor(tool: ServiceTool): GroupName {
  const id = tool.id;
  if (POPULAR_IDS.includes(id)) return 'Popular';
  if (['protect-pdf','unlock-pdf','repair-pdf'].includes(id)) return 'Security & Recovery';
  if (['merge-pdf','split-pdf','compress-pdf','rotate-pdf','delete-pdf-pages','organize-pdf','crop-pdf','page-number','flatten-pdf'].includes(id)) return 'Organize PDF';
  if (['watermark-pdf','add-text','add-image-to-pdf','compare-pdf','pdf-metadata','extract-images','sign-pdf'].includes(id)) return 'Edit & Sign';
  return 'More PDF Tools';
}

export function AllToolsMenu({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { t, tool: localizeTool } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return; }
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previousOverflow; previous?.focus?.(); };
  }, [open]);

  const localizedTools = useMemo(() => BUILD_PUBLIC_TOOLS.map((item) => ({ item, localized: localizeTool(item.id, item.name, item.desc, item.keywords) })), [localizeTool]);
  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return localizedTools;
    return localizedTools.map((entry) => ({ ...entry, score: scoreToolSearch(q, entry.item, entry.localized) })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);
  }, [localizedTools, query]);
  const groups = useMemo(() => {
    const map = new Map<GroupName, typeof filtered>();
    for (const name of GROUP_ORDER) map.set(name, []);
    for (const entry of filtered) map.get(groupFor(entry.item))?.push(entry);
    return GROUP_ORDER.map((name) => ({ name, items: map.get(name) || [] })).filter((group) => group.items.length > 0);
  }, [filtered]);
  const openTool = () => { setOpen(false); setQuery(''); };

  return <>
    <button type="button" aria-haspopup="dialog" aria-expanded={open} aria-label={t('common.openAllTools')} data-analytics-id="nav-all-tools" onClick={() => setOpen(true)} className={cn('inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700', iconOnly && 'h-10 w-10 px-0', className)}>
      <Grip className="h-[18px] w-[18px]" />{!iconOnly && <span>{t('common.allTools')}</span>}
    </button>

    <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[250] bg-slate-950/25 px-0 pt-0 backdrop-blur-[3px] sm:px-4 sm:pt-[76px]" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <motion.div ref={panelRef} role="dialog" aria-modal="true" aria-label={t('common.openAllTools')} initial={reduceMotion?{opacity:0}:{opacity:0,y:-10,scale:.99}} animate={reduceMotion?{opacity:1}:{opacity:1,y:0,scale:1}} exit={reduceMotion?{opacity:0}:{opacity:0,y:-8,scale:.99}} className="mx-auto flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-white shadow-[0_30px_100px_rgba(15,23,42,.24)] sm:h-[min(78vh,720px)] sm:rounded-[1.4rem] sm:border sm:border-slate-200">
        <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 sm:flex"><Grip className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="text-lg font-black tracking-[-.025em] text-slate-950 sm:text-xl">All AJN PDF Tools</h2><span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-black text-violet-700">{BUILD_PUBLIC_TOOLS.length}</span></div><p className="mt-0.5 hidden text-xs font-semibold text-slate-500 sm:block">Public PDF workflows currently available in AJN PDF.</p></div>
            <button type="button" aria-label={t('nav.closeMenu')} onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"><X className="h-5 w-5" /></button>
          </div>
          <div className="relative mt-4"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-600" /><input autoFocus aria-label="Search all AJN PDF tools" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search: merge, compress, sign, protect, crop…" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" /></div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {filtered.length===0?<div className="mx-auto max-w-md py-16 text-center"><Search className="mx-auto h-8 w-8 text-slate-300"/><p className="mt-4 text-base font-black text-slate-800">No matching PDF tool</p><p className="mt-2 text-sm font-medium text-slate-500">Try merge, compress, sign, protect or crop.</p></div>:<div className="space-y-8">{groups.map((group)=><section key={group.name}><div className="mb-3 flex items-center justify-between gap-4"><h3 className="text-[11px] font-black uppercase tracking-[.14em] text-slate-500">{group.name}</h3><span className="text-[10px] font-bold text-slate-400">{group.items.length}</span></div><div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">{group.items.map(({item,localized})=><Link key={item.id} href={toolPath(item.id)} prefetch={false} onPointerEnter={()=>router.prefetch(toolPath(item.id))} onFocus={()=>router.prefetch(toolPath(item.id))} onClick={openTool} className="group flex min-h-[72px] items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 transition hover:-translate-y-px hover:border-violet-200 hover:bg-violet-50/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"><ToolArtwork toolId={item.id} toolName={localized.name} className="h-11 w-11 shrink-0"/><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-black text-slate-900 group-hover:text-violet-800">{localized.name}</p><p className="mt-0.5 line-clamp-1 text-[10.5px] font-medium text-slate-500">{localized.desc}</p></div><ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-600"/></Link>)}</div></section>)}</div>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-6"><span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><Sparkles className="h-3.5 w-3.5 text-violet-600"/> {BUILD_PUBLIC_TOOLS.length} public PDF workflows</span><Link href="/pdf-tools" onClick={() => setOpen(false)} className="text-[11px] font-black text-violet-700 hover:text-violet-900">Browse directory →</Link></div>
      </motion.div>
    </motion.div>}</AnimatePresence>
  </>;
}
