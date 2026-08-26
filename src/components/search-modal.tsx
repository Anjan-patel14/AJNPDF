"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, History, Search, Sparkles, X } from 'lucide-react';
import type { ServiceTool } from '../lib/tools-data';
import { BUILD_PUBLIC_TOOLS } from '../lib/build-public-tools';
import Link from 'next/link';
import { ScrollArea } from './ui/scroll-area';
import { useLanguage } from '@/lib/i18n/language-context';
import { ToolArtwork } from '@/components/ajn/tool-artwork';
import { toolPath } from '@/lib/tool-routes';
import { scoreToolSearch } from '@/lib/tool-search';

export function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<ServiceTool[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { language, t, tool: localizeTool } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem('ajn_recent_search');
      const ids: string[] = saved ? JSON.parse(saved) : [];
      setRecent(BUILD_PUBLIC_TOOLS.filter(t => ids.includes(t.id)).slice(0, 4));
    } catch { setRecent([]); }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.toLocaleLowerCase(language).trim();
    if (!q) return [];
    return BUILD_PUBLIC_TOOLS.map((item) => {
      const localized = localizeTool(item.id, item.name, item.desc, item.keywords);
      return { item, score: scoreToolSearch(q, item, localized) };
    }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).slice(0, 12).map((entry) => entry.item);
  }, [query, language, localizeTool]);

  const handleSelect = (selected: ServiceTool) => {
    try {
      const saved = localStorage.getItem('ajn_recent_search');
      const ids: string[] = saved ? JSON.parse(saved) : [];
      localStorage.setItem('ajn_recent_search', JSON.stringify([selected.id, ...ids.filter(id => id !== selected.id)].slice(0, 4)));
    } catch {}
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('hidden'));
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', down);
    return () => { document.removeEventListener('keydown', down); previous?.focus?.(); };
  }, [isOpen, onClose]);

  const ToolRow = ({ item }: { item: ServiceTool }) => {
    const localized = localizeTool(item.id, item.name, item.desc, item.keywords);
    return <Link href={toolPath(item.id)} onClick={() => handleSelect(item)} className="group flex min-h-[66px] items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 transition hover:border-violet-200 hover:shadow-lg">
      <ToolArtwork toolId={item.id} toolName={localized.name} className="h-11 w-11" />
      <div className="min-w-0 flex-1"><div className="truncate text-sm font-extrabold text-slate-900">{localized.name}</div><p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-500">{localized.desc}</p></div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />
    </Link>;
  };

  return <AnimatePresence>{isOpen && <div className="fixed inset-0 z-[1000] flex items-start justify-center px-3 pt-[10vh] sm:px-6 sm:pt-[14vh]">
    <motion.button type="button" aria-label={t('nav.closeSearch')} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-sm" />
    <motion.div ref={dialogRef} initial={{opacity:0,scale:.97,y:-12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.97,y:-12}} role="dialog" aria-modal="true" aria-label={t('nav.searchLabel')} className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_40px_100px_rgba(15,23,42,.24)]">
      <div className="relative border-b border-slate-200"><Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><input autoFocus aria-label={t('nav.searchLabel')} placeholder={`Search ${BUILD_PUBLIC_TOOLS.length} tools — merge, compress, sign, protect, image…`} value={query} onChange={e=>setQuery(e.target.value)} className="h-16 w-full bg-transparent pl-14 pr-16 text-base font-bold text-slate-900 outline-none placeholder:text-slate-400 sm:h-[72px]"/><button type="button" aria-label={t('nav.closeSearch')} onClick={onClose} className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"><X className="h-5 w-5"/></button></div>
      <ScrollArea className="max-h-[66vh]"><div className="p-4 sm:p-5">
        {!query.trim() ? <div className="space-y-6">
          {recent.length > 0 && <section><div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-slate-500"><History className="h-4 w-4"/>{t('search.recent')}</div><div className="grid gap-2 sm:grid-cols-2">{recent.map(item=><ToolRow key={item.id} item={item}/>)}</div></section>}
          <section><div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-slate-500"><Sparkles className="h-4 w-4 text-violet-500"/>{t('search.popular')}</div><div className="grid gap-2 sm:grid-cols-2">{BUILD_PUBLIC_TOOLS.slice(0,6).map(item=><ToolRow key={item.id} item={item}/>)}</div></section>
        </div> : <section><div className="mb-3 text-xs font-extrabold text-slate-500">{t('search.matches',{count:results.length})}</div>{results.length ? <div className="space-y-2">{results.map(item=><ToolRow key={item.id} item={item}/>)}</div> : <div className="py-12 text-center"><Search className="mx-auto h-9 w-9 text-slate-300"/><p className="mt-4 text-sm font-extrabold text-slate-900">{t('search.noMatches')}</p><p className="mt-1 text-xs font-medium text-slate-500">Try merge, compress, sign, protect, crop or image.</p></div>}</section>}
      </div></ScrollArea>
    </motion.div>
  </div>}</AnimatePresence>;
}
