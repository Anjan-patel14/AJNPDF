
"use client";

import React, { useState, useRef } from "react";
import * as pdfjsLib from 'pdfjs-dist';

import { RotateCw, RotateCcw, CheckCircle2, Download, Loader2, Activity, FileText, RefreshCcw, Zap, Share2} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

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

interface PageItem {
  id: string;
  index: number;
  preview: string;
  rotation: number;
}

export default function RotatePdf() {
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
    setFile(f);
    setPhase('configure');
    setStatus("Generating previews...");
    setOutputName(f.name.replace('.pdf', '') + "_Rotated");

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
          rotation: 0
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
    if (f && f.type === 'application/pdf') processFile(f);
  };

  const rotateSingle = (id: string, deg: number) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, rotation: (p.rotation + deg + 360) % 360 } : p));
  };

  const rotateAll = (deg: number) => {
    setPages(prev => prev.map(p => ({ ...p, rotation: (p.rotation + deg + 360) % 360 })));
  };

  const executeRotation = async () => {
    setPhase('processing');
    setProgress(0);
    setStatus("Applying page rotations…");
    try {
      const rotationMap = pages.map(p => p.rotation);
      const res = await engine.runTool('rotate-pdf', [file!], { rotationMap, outputName }, (p: any) => {
        setProgress(p.pct);
      });

      if (res.success && res.blob) {
        setResultBlob(res.blob);
        setPhase('done');
      }
    } catch {
      setPhase('configure');
      toast({ title: "Process Error", variant: "destructive" });
    }
  };

  const reset = () => { setFile(null); setPages([]); setPhase('upload'); setResultBlob(null); };

  return (
    <ToolWorkspace title="Rotate PDF" description="Rotate all or selected PDF pages" accent="#F59E0B">
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
                  isDragging ? "border-amber-500 bg-amber-500/10" : "border-black/5 bg-white/20 backdrop-blur-md hover:border-amber-500/40"
                )}
              >
                <input type="file" accept=".pdf" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500 border border-black/5">
                  <RotateCw className="w-8 h-8 text-amber-500" />
                </div>
                <div className="text-center space-y-1 px-8 relative z-10">
                  <h3 className="text-2xl font-black tracking-tighter uppercase text-slate-950">Drop PDF to Rotate</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Page rotation</p>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'configure' && file && (
            <motion.div key="configure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
              <div className="p-6 bg-white/40 rounded-2xl border border-black/5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[240px]">{file.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{fmtBytes(file.size)} • {pages.length} Pages</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => rotateAll(90)} className="h-9 border-black/10 bg-white font-black text-[9px] uppercase tracking-widest rounded-xl px-4 gap-2">
                    <RotateCw className="w-3.5 h-3.5" /> Rotate All
                  </Button>
                  <button onClick={reset} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900">Change File</button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rotate pages</Label>
                  <Card className="bg-white border-black/5 rounded-2xl shadow-inner overflow-hidden min-h-[420px]">
                    <ScrollArea className="h-[600px] p-8">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                        {pages.map((page) => (
                          <div key={page.id} className="space-y-3 flex flex-col items-center">
                            <div className="aspect-[1/1.414] w-full bg-white rounded-2xl border-2 border-black/5 relative overflow-hidden shadow-sm transition-all duration-500">
                              <motion.img 
                                src={page.preview} 
                                animate={{ rotate: page.rotation }}
                                className="w-full h-full object-cover" 
                                alt="" 
                              />
                              <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded">{page.index + 1}</div>
                            </div>
                            <div className="flex gap-2 w-full">
                              <Button variant="outline" size="icon" onClick={() => rotateSingle(page.id, -90)} className="h-8 flex-1 border-black/5 bg-slate-50 hover:bg-amber-50">
                                <RotateCcw className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => rotateSingle(page.id, 90)} className="h-8 flex-1 border-black/5 bg-slate-50 hover:bg-amber-50">
                                <RotateCw className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>

                <aside className="lg:col-span-5 space-y-8">
                  <div className="p-8 bg-slate-900 text-white rounded-2xl shadow-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                      <Zap className="w-32 h-32 text-amber-500" />
                    </div>
                    <div className="relative z-10 space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-2xl font-black uppercase italic tracking-tighter">Ready</h4>
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest leading-relaxed">Processing occurs locally. Every page orientation will be rewritten in the downloaded PDF.</p>
                      </div>
                      <Button 
                        onClick={executeRotation} 
                        className="w-full h-16 bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-amber-600 transition-all shadow-xl active:scale-95"
                      >
                        <RotateCw className="w-4 h-4 mr-2" /> Apply rotations
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
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Your PDF is ready</p>
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
