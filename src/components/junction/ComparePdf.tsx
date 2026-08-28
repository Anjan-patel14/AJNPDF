"use client";

import { RuntimeImage } from '@/components/ui/runtime-image';
import React, { useState, useRef } from "react";
import * as pdfjsLib from 'pdfjs-dist';
import { Diff, CheckCircle2, Loader2, Activity, FileText, RefreshCcw, Search, AlertCircle, FileWarning } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useToast } from '../../hooks/use-toast';
import { cn } from '../../lib/utils';
import { ToolWorkspace, getFilesFromEvent, beginToolProcessing, completeToolProcessing, failToolProcessing} from './_shared';
import { initPdfWorker } from "@/lib/pdfjs-worker";
import { hasPdfHeader, validateFiles } from "@/lib/file-validation";

interface DiffMark {
  type: 'added' | 'removed' | 'changed';
  text: string;
  y: number;
  height: number;
}

interface PageDiff {
  pageIndex: number;
  marks: DiffMark[];
  previewA: string;
  previewB: string;
}

/**
 * AJN Professional PDF Comparison Unit - Production v8.0
 * Specialized in Visual & Textual Revision Auditing.
 * Features: side-by-side rendering and deterministic PDF.js text-item comparison.
 */
export default function ComparePdf() {
  const { toast } = useToast();
  
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [diffs, setDiffs] = useState<PageDiff[]>([]);
  const [phase, setPhase] = useState<'upload' | 'processing' | 'done'>('upload');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [isDragging, setIsDragging] = useState<{ a: boolean, b: boolean }>({ a: false, b: false });
  const [summary, setStats] = useState({ additions: 0, deletions: 0, totalPages: 0 });

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFileA(null);
    setFileB(null);
    setDiffs([]);
    setPhase('upload');
    setStats({ additions: 0, deletions: 0, totalPages: 0 });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>, side: 'a' | 'b') => {
    const f = getFilesFromEvent(e)?.[0];
    if (!f) return;
    const validation = validateFiles([f], { extensions: ['.pdf'], minFiles: 1, maxFiles: 1, maxSizeMb: 50 });
    if (validation || !(await hasPdfHeader(f))) {
      toast({
        title: 'Invalid PDF',
        description: validation || 'The selected file does not contain a readable PDF header.',
        variant: 'destructive',
      });
      return;
    }
    if (side === 'a') setFileA(f); else setFileB(f);
  };

  const executeComparison = async () => {
    if (!fileA || !fileB) return;
    beginToolProcessing("ComparePdf");
    setPhase('processing');
    setProgress(0);
    setStatus("Loading both PDF versions…");

    try {
      initPdfWorker();
      const [bufA, bufB] = await Promise.all([fileA.arrayBuffer(), fileB.arrayBuffer()]);
      const [pdfA, pdfB] = await Promise.all([
        pdfjsLib.getDocument({ data: new Uint8Array(bufA) }).promise,
        pdfjsLib.getDocument({ data: new Uint8Array(bufB) }).promise
      ]);

      const maxPages = Math.max(pdfA.numPages, pdfB.numPages);
      const results: PageDiff[] = [];
      let totalAdd = 0;
      let totalRem = 0;

      for (let i = 1; i <= maxPages; i++) {
        const stepPct = Math.round((i / maxPages) * 100);
        setProgress(stepPct);
        setStatus(`Auditing Page ${i} of ${maxPages}...`);

        const renderPage = async (pdf: any, idx: number) => {
          if (idx > pdf.numPages) return null;
          const page = await pdf.getPage(idx);
          const viewport = page.getViewport({ scale: 0.6 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: ctx, viewport: viewport }).promise;
          return { dataUrl: canvas.toDataURL('image/jpeg', 0.7), textContent: await page.getTextContent() };
        };

        const [pageA, pageB] = await Promise.all([
          renderPage(pdfA, i),
          renderPage(pdfB, i)
        ]);

        const marks: DiffMark[] = [];
        const linesA = (pageA ? (pageA as any).textContent.items.map((it: any) => it.str) : []);
        const linesB = (pageB ? (pageB as any).textContent.items.map((it: any) => it.str) : []);

        const maxLength = Math.max(linesA.length, linesB.length);
        for (let j = 0; j < maxLength; j++) {
          const textA = linesA[j] || "";
          const textB = linesB[j] || "";
          if (textA !== textB) {
            if (!textA) {
              marks.push({ type: 'added', text: textB, y: j * 12, height: 12 });
              totalAdd++;
            } else if (!textB) {
              marks.push({ type: 'removed', text: textA, y: j * 12, height: 12 });
              totalRem++;
            } else {
              marks.push({ type: 'changed', text: textB, y: j * 12, height: 12 });
              totalAdd++; totalRem++;
            }
          }
        }

        results.push({
          pageIndex: i,
          marks,
          previewA: pageA ? (pageA as any).dataUrl : "",
          previewB: pageB ? (pageB as any).dataUrl : ""
        });
      }

      setDiffs(results);
      setStats({ additions: totalAdd, deletions: totalRem, totalPages: maxPages });
      setPhase('done');
      completeToolProcessing();
    } catch (err) {
      failToolProcessing();
      console.error(err);
      toast({ title: "Audit failed", description: "PDF comparison stopped unexpectedly.", variant: "destructive" });
      setPhase('upload');
    }
  };

  return (
    <ToolWorkspace title="Compare PDF" description="Compare two PDF versions side by side and review text-item differences." accent="#4F46E5">
      <div className="w-full">
        <AnimatePresence mode="wait">
          {phase === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div 
                  onClick={() => fileInputARef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragging({ ...isDragging, a: true }); }}
                  onDragLeave={() => setIsDragging({ ...isDragging, a: false })}
                  onDrop={e => { e.preventDefault(); setIsDragging({ ...isDragging, a: false }); void handleFileUpload(e, 'a'); }}
                  className={cn(
                    "group relative h-[280px] rounded-2xl border border-dashed transition-all duration-500 shadow-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer",
                    isDragging.a ? "border-primary bg-primary/5" : fileA ? "border-emerald-500 bg-emerald-500/5" : "border-black/5 bg-white/20 backdrop-blur-md hover:border-primary/40"
                  )}
                >
                  <input type="file" accept=".pdf" ref={fileInputARef} className="hidden" onChange={e => { void handleFileUpload(e, 'a'); }} />
                  {fileA ? (
                    <div className="text-center space-y-4 animate-in zoom-in-95">
                      <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg"><CheckCircle2 className="w-8 h-8 text-white" /></div>
                      <div>
                        <p className="text-sm font-black uppercase text-slate-900 truncate max-w-[200px]">{fileA.name}</p>
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Original Version</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-md"><FileText className="w-8 h-8 text-slate-300" /></div>
                      <p className="text-sm font-black uppercase tracking-widest text-slate-400">Load Original</p>
                    </div>
                  )}
                </div>

                <div 
                  onClick={() => fileInputBRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragging({ ...isDragging, b: true }); }}
                  onDragLeave={() => setIsDragging({ ...isDragging, b: false })}
                  onDrop={e => { e.preventDefault(); setIsDragging({ ...isDragging, b: false }); void handleFileUpload(e, 'b'); }}
                  className={cn(
                    "group relative h-[280px] rounded-2xl border border-dashed transition-all duration-500 shadow-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer",
                    isDragging.b ? "border-primary bg-primary/5" : fileB ? "border-emerald-500 bg-emerald-500/5" : "border-black/5 bg-white/20 backdrop-blur-md hover:border-primary/40"
                  )}
                >
                  <input type="file" accept=".pdf" ref={fileInputBRef} className="hidden" onChange={e => { void handleFileUpload(e, 'b'); }} />
                  {fileB ? (
                    <div className="text-center space-y-4 animate-in zoom-in-95">
                      <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg"><CheckCircle2 className="w-8 h-8 text-white" /></div>
                      <div>
                        <p className="text-sm font-black uppercase text-slate-900 truncate max-w-[200px]">{fileB.name}</p>
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Modified Version</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-md"><FileText className="w-8 h-8 text-slate-300" /></div>
                      <p className="text-sm font-black uppercase tracking-widest text-slate-400">Load Modified</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center gap-6">
                <Button 
                  onClick={executeComparison} 
                  disabled={!fileA || !fileB}
                  className="h-16 px-16 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all gap-3 border-2 border-white/20 active:scale-95"
                >
                  <Diff className="w-4 h-4" /> Compare PDFs
                </Button>
              </div>
            </motion.div>
          )}

          {phase === 'processing' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-24 flex flex-col items-center space-y-10 text-center">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <Activity className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
              </div>
              <div className="w-full max-w-sm space-y-4 mx-auto">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{status}</span>
                  <span className="text-xl font-black text-primary tracking-tighter">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-black/5" />
              </div>
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-32">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 bg-white border-2 border-black/5 rounded-2xl shadow-xl">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Search className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Summary</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compared {summary.totalPages} pages</p>
                  </div>
                </div>
                
                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Additions</p>
                    <p className="text-2xl font-black text-emerald-600">+{summary.additions}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Deletions</p>
                    <p className="text-2xl font-black text-red-500">-{summary.deletions}</p>
                  </div>
                  <div className="flex items-center gap-3 pl-8 border-l border-black/5">
                    <Button onClick={reset} variant="outline" className="h-11 rounded-xl text-[10px] font-black uppercase tracking-widest px-6 gap-2">
                      <RefreshCcw className="w-3.5 h-3.5" /> Compare another
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-16">
                {diffs.map((page) => (
                  <div key={page.pageIndex} className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                      <Badge className="bg-slate-950 text-white border-none font-black text-[10px] h-6 px-3">PAGE {page.pageIndex}</Badge>
                      {page.marks.length === 0 ? (
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5" /> No changes found
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5" /> {page.marks.length} Possible differences
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Card className="bg-white border-black/5 shadow-md rounded-2xl overflow-hidden relative">
                        <div className="p-4 bg-slate-50 border-b border-black/5 flex justify-between">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">A: Original</span>
                        </div>
                        <div className="p-10 flex justify-center bg-slate-100/30">
                          <div className="relative shadow-md border border-black/5 bg-white">
                            {page.previewA ? <RuntimeImage src={page.previewA} className="w-full h-auto" alt="" /> : <div className="aspect-[1/1.4] w-[400px] bg-slate-50 flex items-center justify-center"><FileWarning className="w-8 h-8 text-slate-200" /></div>}
                            {page.marks.filter(m => m.type === 'removed').map((mark, mi) => (
                              <div key={mi} className="absolute left-0 right-0 bg-red-500/20 border-y border-red-500/40" style={{ top: (mark.y / 10) + "%", height: '3%' }} />
                            ))}
                          </div>
                        </div>
                      </Card>

                      <Card className="bg-white border-black/5 shadow-md rounded-2xl overflow-hidden relative">
                        <div className="p-4 bg-slate-50 border-b border-black/5 flex justify-between">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">B: Modified</span>
                        </div>
                        <div className="p-10 flex justify-center bg-slate-100/30">
                          <div className="relative shadow-md border border-black/5 bg-white">
                            {page.previewB ? <RuntimeImage src={page.previewB} className="w-full h-auto" alt="" /> : <div className="aspect-[1/1.4] w-[400px] bg-slate-50 flex items-center justify-center"><FileWarning className="w-8 h-8 text-slate-200" /></div>}
                            {page.marks.filter(m => m.type !== 'removed').map((mark, mi) => (
                              <div key={mi} className="absolute left-0 right-0 bg-emerald-500/20 border-y border-emerald-500/40" style={{ top: (mark.y / 10) + "%", height: '3%' }} />
                            ))}
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolWorkspace>
  );
}
