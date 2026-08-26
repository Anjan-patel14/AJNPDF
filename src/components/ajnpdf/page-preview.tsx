"use client";

import { RuntimeImage } from '@/components/ui/runtime-image';
import React, { useEffect, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, LayoutGrid, Layers, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { initPdfWorker } from "@/lib/pdfjs-worker";

interface PagePreviewProps {
  file: File;
  onPageCount?: (count: number) => void;
  selectedPages?: number[];
  onTogglePage?: (num: number) => void;
  className?: string;
  selectable?: boolean;
}

export function PagePreview({ 
  file, 
  onPageCount, 
  selectedPages = [], 
  onTogglePage, 
  className,
  selectable = false 
}: PagePreviewProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPreviews() {
      setLoading(true);
      setError(null);
      const previews: string[] = [];

      try {
        initPdfWorker();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        
        if (onPageCount) onPageCount(pdf.numPages);

        for (let i = 1; i <= pdf.numPages; i++) {
          if (!active) break;
          
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise;

            previews.push(canvas.toDataURL("image/jpeg", 0.8));
            if (active) setPages([...previews]);
          }
        }
      } catch (err) {
        console.error("PDF Preview Error:", err);
        if (active) setError("Failed to generate previews.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPreviews();
    return () => { active = false; };
  }, [file, onPageCount]);

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Page Previews
          </h3>
        </div>
        {loading && <Loader2 className="w-3 h-3 text-primary animate-spin" />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-6 bg-white/40 border border-black/5 rounded-2xl shadow-inner">
        <AnimatePresence mode="popLayout">
          {pages.map((src, i) => {
            const pageNum = i + 1;
            const isSelected = selectedPages.includes(pageNum);
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => selectable && onTogglePage?.(pageNum)}
                className={cn(
                  "aspect-[1/1.414] bg-white border-2 transition-all duration-300 rounded-lg overflow-hidden relative group shadow-lg",
                  selectable ? "cursor-pointer" : "cursor-default",
                  isSelected ? "border-primary ring-4 ring-primary/20 scale-105 z-10" : "border-black/5 hover:border-primary/40"
                )}
              >
                <RuntimeImage 
                  src={src} 
                  alt={`Page ${pageNum}`} 
                  className={cn(
                    "w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0",
                    isSelected && "grayscale-0"
                  )} 
                />
                
                {selectable && isSelected && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                )}

                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-sm">
                  <span className="text-[8px] font-black text-white">P{pageNum}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && pages.length === 0 && (
          <div className="col-span-full h-40 flex flex-col items-center justify-center text-slate-300">
            <LayoutGrid className="w-10 h-10 mb-2 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest">Loading Pages...</p>
          </div>
        )}

        {error && (
          <div className="col-span-full p-8 text-center text-xs font-bold text-red-400 uppercase tracking-widest">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
