"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Layout, Scissors, Trash2, LayoutGrid, ImageIcon, FileText, FileSpreadsheet, Code2, Presentation, FileDigit, Stamp, PenTool, Wrench, Layers, FileEdit } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../lib/utils';
import { BUILD_PUBLIC_TOOL_IDS, BUILD_PUBLIC_TOOLS } from '@/lib/build-public-tools';
import { ToolArtwork } from '@/components/ajn/tool-artwork';
import { ScrollArea } from '../ui/scroll-area';
import { toolPath } from '@/lib/tool-routes';

/**
 * AJN Tools Menu - Professional Navigation
 * Sanitized: Removed decommissioned units (Lock, Unlock).
 */
const pdfCategories = [
  {
    title: "ORGANIZE",
    tools: [
      { name: "Merge PDF", href: "/merge-pdf", icon: Layout, color: "text-blue-500" },
      { name: "Split PDF", href: "/split-pdf", icon: Scissors, color: "text-purple-500" },
      { name: "Remove Pages", href: "/delete-pdf-pages", icon: Trash2, color: "text-red-500" },
      { name: "Organize PDF", href: "/organize-pdf", icon: LayoutGrid, color: "text-orange-500" },
      { name: "Flatten PDF", href: "/flatten-pdf", icon: Layers, color: "text-indigo-500" }]
  },
  {
    title: "CONVERT TO",
    tools: [
      { name: "WORD to PDF", href: "/word-to-pdf", icon: FileText, color: "text-blue-600" },
      { name: "EXCEL to PDF", href: "/excel-to-pdf", icon: FileSpreadsheet, color: "text-emerald-700" },
      { name: "JPG to PDF", href: "/jpg-to-pdf", icon: ImageIcon, color: "text-amber-500" },
      { name: "HTML to PDF", href: "/html-to-pdf", icon: Code2, color: "text-indigo-600" }]
  },
  {
    title: "CONVERT FROM",
    tools: [
      { name: "PDF to WORD", href: "/pdf-to-word", icon: FileEdit, color: "text-blue-600" },
      { name: "PDF to EXCEL", href: "/pdf-to-excel", icon: FileSpreadsheet, color: "text-emerald-700" },
      { name: "PDF to PPT", href: "/pdf-to-pptx", icon: Presentation, color: "text-orange-500" },
      { name: "PDF to JPG", href: "/pdf-to-jpg", icon: ImageIcon, color: "text-amber-500" }]
  },
  {
    title: "EDIT & SIGN",
    tools: [
      { name: "Sign PDF", href: "/sign-pdf", icon: PenTool, color: "text-blue-600" },
      { name: "Watermark", href: "/watermark-pdf", icon: Stamp, color: "text-slate-600" },
      { name: "Page Numbers", href: "/page-number", icon: FileDigit, color: "text-indigo-500" },
      { name: "Edit Metadata", href: "/pdf-metadata", icon: FileEdit, color: "text-slate-500" }]
  },
  {
    title: "INTELLIGENCE",
    tools: [
      { name: "Repair PDF", href: "/repair-pdf", icon: Wrench, color: "text-red-500" }]
  }
];

export function PDFToolsDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative h-full flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button type="button" aria-haspopup="menu" aria-expanded={isOpen} onClick={() => setIsOpen((value) => !value)} className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-primary uppercase tracking-[0.2em] transition-colors h-full px-2">
        PDF Tools <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 pt-2 w-[90vw] max-w-6xl z-[200]"
          >
            <div className="bg-white/95 backdrop-blur-2xl border border-black/5 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] overflow-hidden p-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
                {pdfCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-black/5 pb-3 italic">
                      {cat.title}
                    </h4>
                    <div className="flex flex-col gap-1.5">
                      {cat.tools.filter((tool) => BUILD_PUBLIC_TOOL_IDS.has(tool.href.split('/').pop() || '')).map((tool, tIdx) => (
                        <Link 
                          key={tIdx} 
                          href={tool.href}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/5 transition-all group"
                        >
                          <ToolArtwork toolId={tool.href.split('/').pop() || ''} toolName={tool.name} className="h-9 w-9 transition-transform group-hover:scale-[1.03]" />
                          <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight group-hover:text-primary transition-colors">
                            {tool.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function IMGToolsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const imgTools = BUILD_PUBLIC_TOOLS.filter(t => t.cat === 'img' || t.cat === 'ai');

  return (
    <div 
      className="relative h-full flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button type="button" aria-haspopup="menu" aria-expanded={isOpen} onClick={() => setIsOpen((value) => !value)} className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-primary uppercase tracking-[0.2em] transition-colors h-full px-2">
        Creative & AI <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 pt-2 w-[340px] z-[200]"
          >
            <div className="bg-white/95 backdrop-blur-2xl border border-black/5 rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] overflow-hidden p-6">
              <div className="flex flex-col gap-1.5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-black/5 pb-3 mb-2 italic">
                  IMAGE MASTERY
                </h4>
                <ScrollArea className="h-[450px] pr-2">
                  <div className="flex flex-col gap-1.5 pb-4">
                    {imgTools.map((tool, tIdx) => (
                      <Link 
                        key={tIdx} 
                        href={toolPath(tool.id)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/5 transition-all group"
                      >
                        <ToolArtwork toolId={tool.id} toolName={tool.name} className="h-9 w-9 transition-transform group-hover:scale-[1.03]" />
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight group-hover:text-primary transition-colors">
                          {tool.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
