"use client";

import { RuntimeImage } from '@/components/ui/runtime-image';

import React, { useState, useRef } from "react";
import * as pdfjsLib from 'pdfjs-dist';

import { Trash2, CheckCircle2, Download, Loader2, Activity, FileText, RefreshCcw, Zap, Share2} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '../../hooks/use-toast';
import { engine } from '../../lib/engine';
import { cn } from '../../lib/utils';
import { ToolWorkspace, dl, fmtBytes, getFilesFromEvent, shareResult} from './_shared';
import { initPdfWorker } from "@/lib/pdfjs-worker";
import { validatePdfFile } from "@/lib/file-validation";

interface PageItem {
  id: string;
  index: number;
  preview: string;
  selected: boolean;
}

export default function DeletePages() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [phase, setPhase] = useState<'upload' | 'configure' | 'processing' | 'done'>('upload');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [outputName, setOutputName] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (f: File) => {
    const validation = await validatePdfFile(f, 50);
    if (validation) {
      toast({ title: "Invalid PDF", description: validation, variant: "destructive" });
      return;
    }
    setFile(f);
    setPhase('configure');
    setStatus("Analyzing pages...");
    setOutputName(f.name.replace('.pdf', '') + "_Cleaned");

    try {
      initPdfWorker();
      const buffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      
      const newPages: PageItem[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        newPages.push({
          id: Math.random().toString(36).substr(2, 9),
          index: i - 1,
          preview: canvas.toDataURL('image/jpeg', 0.7),
          selected: false
        });
      }
      setPages(newPages);
    } catch {
      toast({ title: "Analysis failed", variant: "destructive" });
      setPhase('upload');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>) => {
    const f = getFilesFromEvent(e)?.[0];
    if (f) void processFile(f);
  };

  const executeDelete = async () => {
    const toKeep = pages.filter(p => !p.selected).map(p => p.index);
    if (toKeep.length === 0) {
      toast({ title: "Min 1 Page Required", description: "You cannot delete all pages.", variant: "destructive" });
      return;
    }

    setPhase('processing');
    setProgress(0);
    setStatus("Removing selected pages...");
    try {
      const res = await engine.runTool('split-pdf', [file!], { indices: toKeep, outputName }, (p: any) => {
        setProgress(p.pct);
      });

      if (!res.success || !res.blob) {
        throw new Error(res.error || res.message || 'The selected pages could not be removed.');
      }
      setResultBlob(res.blob);
      setPhase('done');
    } catch (error) {
      setPhase('configure');
      toast({ title: "Process Error", description: error instanceof Error ? error.message : "The selected pages could not be removed.", variant: "destructive" });
    }
  };

  const reset = () => { setFile(null); setPages([]); setPhase('upload'); setResultBlob(null); };

  return (
    <ToolWorkspace title="Delete Pages" description="Select and remove pages you no longer need" accent="#EF4444">
      <div className="w-full">
        <AnimatePresence mode="wait">
          {phase === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full">
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileUpload(e); }}
                className={cn(
                  "group relative min-h-[210px] w-full rounded-2xl border border-dashed transition-all duration-700 shadow-md overflow-hidden flex flex-col items-center justify-center cursor-pointer",
                  isDragging ? "border-red-500 bg-red-500/10" : "border-black/5 bg-white/20 backdrop-blur-md hover:border-red-500/40"
                )}
              >
                <input type="file" accept=".pdf" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500 border border-black/5">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <div className="text-center space-y-1 px-8 relative z-10">
                  <h3 className="text-2xl font-black tracking-tighter uppercase text-slate-950">Choose a PDF</h3>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'configure' && file && (
            <motion.div key="configure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
              <div className="p-6 bg-white/40 rounded-2xl border border-black/5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[240px]">{file.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{fmtBytes(file.size)} • {pages.length} Pages</p>
                  </div>
                </div>
                <button onClick={reset} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900">Change File</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Choose pages to remove</Label>
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-none text-[9px] font-black">{pages.filter(p => p.selected).length} MARKED</Badge>
                  </div>
                  <Card className="bg-white border-black/5 rounded-2xl shadow-inner overflow-hidden min-h-[420px]">
                    <ScrollArea className="h-[600px] p-8">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        {pages.map((page) => (
                          <div 
                            key={page.id} 
                            onClick={() => setPages(prev => prev.map(p => p.id === page.id ? { ...p, selected: !p.selected } : p))}
                            className={cn(
                              "aspect-[1/1.414] bg-white rounded-2xl border-4 transition-all duration-500 relative overflow-hidden shadow-sm cursor-pointer",
                              page.selected ? "border-red-500 scale-[0.98] opacity-100" : "border-transparent opacity-100"
                            )}
                          >
                            <RuntimeImage src={page.preview} className={cn("w-full h-full object-cover transition-all", page.selected && "grayscale opacity-20")} alt="" />
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded">{page.index + 1}</div>
                            {page.selected && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-xl">
                                  <Trash2 className="w-5 h-5" strokeWidth={3} />
                                </div>
                                <span className="text-[8px] font-black uppercase text-red-600 bg-white px-2 py-0.5 rounded-md shadow-sm">Delete</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>

                <aside className="lg:col-span-5 space-y-6">
                  <div className="p-8 bg-slate-900 text-white rounded-2xl shadow-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                      <Zap className="w-32 h-32 text-red-500" />
                    </div>
                    <div className="relative z-10 space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-2xl font-black uppercase italic tracking-tighter">Ready</h4>
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest leading-relaxed">Processing occurs locally. Selected pages will be removed from the downloaded PDF.</p>
                      </div>
                      <Button 
                        onClick={executeDelete} 
                        disabled={pages.filter(p => p.selected).length === 0}
                        className="w-full h-16 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-all shadow-xl active:scale-95"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Remove selected pages
                      </Button>
                    </div>
                  </div>
                </aside>
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
                <div className="flex justify-between items-center px-2"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{status}</span><span className="text-xl font-black text-primary tracking-tighter">{progress}%</span></div>
                <Progress value={progress} className="h-1.5 bg-black/5" />
              </div>
            </motion.div>
          )}

          {phase === 'done' && resultBlob && (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="py-12 flex flex-col items-center space-y-10 text-center">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-slate-950">Success 🎉</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Unwanted segments removed</p>
              </div>

              <div className="p-8 bg-white border-2 border-black/5 rounded-2xl w-full max-w-sm flex items-center justify-center gap-4 shadow-xl mx-auto">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Output file</p>
                  <p className="text-sm font-black text-slate-950 truncate">{fmtBytes(resultBlob.size)}</p>
                </div>
              </div>

              <div className="w-full max-w-sm flex flex-col gap-4 mx-auto pt-4 pb-32">
                <Button onClick={() => dl(resultBlob, `${outputName}.pdf`)} className="h-16 bg-emerald-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:bg-emerald-600 transition-all gap-3 border-2 border-white/20 active:scale-95">
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
                <Button variant="outline" onClick={() => void shareResult(resultBlob, `${outputName}.pdf`)} className="h-12 border-slate-200 bg-white text-slate-700 font-black text-xs rounded-xl shadow-sm hover:border-blue-200 hover:bg-blue-50/60 gap-2">
                  <Share2 className="w-4 h-4" /> Share result
                </Button>
                <button onClick={reset} className="h-12 rounded-xl font-black text-[10px] uppercase text-slate-400 gap-2 flex items-center justify-center hover:bg-black/5 transition-all">
                  <RefreshCcw className="w-3.5 h-3.5" /> Process another file
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolWorkspace>
  );
}
