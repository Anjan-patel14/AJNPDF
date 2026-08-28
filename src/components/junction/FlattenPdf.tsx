"use client";

import { RuntimeImage } from '@/components/ui/runtime-image';

import React, { useState, useRef } from "react";
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { Layers, CheckCircle2, Download, Loader2, Activity, FileText, RefreshCcw, Zap, Settings2, Edit3, Share2} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

import { Input } from '../ui/input';
import { useToast } from '../../hooks/use-toast';
import { cn } from '../../lib/utils';
import { ToolWorkspace, dl, fmtBytes, getFilesFromEvent, shareResult, beginToolProcessing, completeToolProcessing, failToolProcessing} from './_shared';
import { initPdfWorker } from "@/lib/pdfjs-worker";
import { validatePdfFile } from "@/lib/file-validation";

export default function FlattenPdf() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [phase, setPhase] = useState<'upload' | 'configure' | 'processing' | 'done'>('upload');
  const [status, setStatus] = useState("");
  const [outputName, setOutputName] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (f: File) => {
    const validation = await validatePdfFile(f, 50);
    if (validation) {
      toast({ title: "Invalid PDF", description: validation, variant: "destructive" });
      return;
    }
    setFile(f);
    setPhase('configure');
    setStatus("Analyzing layers...");
    setOutputName(f.name.replace('.pdf', '') + "_Static");

    try {
      initPdfWorker();
      const buffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      setPageCount(pdf.numPages);
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.8 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      setPreview(canvas.toDataURL('image/jpeg', 0.8));
    } catch {
      toast({ title: "Analysis failed", variant: "destructive" });
      setPhase('upload');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>) => {
    const f = getFilesFromEvent(e)?.[0];
    if (f) void processFile(f);
  };

  const executeFlatten = async () => {
    if (!file) return;
    beginToolProcessing("FlattenPdf");
    setPhase('processing');
    setStatus("Flattening supported form fields...");

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const form = pdfDoc.getForm();
      
      try {
        form.flatten();
      } catch {
        // A PDF without supported AcroForm fields is still a valid input.
      }

      setStatus("Finalizing the flattened PDF...");

      const finalBytes = await pdfDoc.save({ useObjectStreams: false });
      setResultBlob(new Blob([finalBytes.buffer as ArrayBuffer], { type: 'application/pdf' }));
      setPhase('done');
      completeToolProcessing();
    } catch {
      failToolProcessing();
      setPhase('configure');
      toast({ title: "Flatten Error", variant: "destructive" });
    }
  };

  const reset = () => { setFile(null); setPreview(""); setPhase('upload'); setResultBlob(null); };

  return (
    <ToolWorkspace title="Flatten PDF" description="Flatten form fields into a fixed PDF" accent="#6B7280">
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
                  isDragging ? "border-slate-500 bg-slate-500/10" : "border-black/5 bg-white/20 backdrop-blur-md hover:border-slate-500/40"
                )}
              >
                <input type="file" accept=".pdf" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500 border border-black/5">
                  <Layers className="w-8 h-8 text-slate-500" />
                </div>
                <div className="text-center space-y-1 px-8 relative z-10">
                  <h3 className="text-2xl font-black tracking-tighter uppercase text-slate-950">Drop PDF to Flatten</h3>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'configure' && file && (
            <motion.div key="configure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
              <div className="p-6 bg-white/40 rounded-2xl border border-black/5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-500/10 rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[240px]">{file.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{fmtBytes(file.size)} • {pageCount} Pages • File ready</p>
                  </div>
                </div>
                <button onClick={reset} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors">Change File</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Preview</Label>
                  <Card className="bg-white border-black/5 rounded-2xl shadow-inner overflow-hidden min-h-[420px] flex items-center justify-center p-12">
                    <div className="relative group shadow-md">
                      <RuntimeImage src={preview} className="max-h-[500px] w-auto rounded-sm border border-black/5" alt="" />
                    </div>
                  </Card>
                </div>

                <aside className="lg:col-span-5 space-y-6">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Settings2 className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Settings</Label>
                    </div>
                    
                    <Card className="bg-white/60 backdrop-blur-xl border-black/5 rounded-3xl p-8 space-y-6 shadow-xl">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Output Name</Label>
                        <div className="relative">
                          <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input placeholder="flattened" value={outputName} onChange={(e) => setOutputName(e.target.value)} className="h-12 pl-12 bg-white/5 border-black/5 rounded-xl font-bold shadow-sm" />
                        </div>
                      </div>
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed text-center">
                          Flattening converts supported interactive form fields into fixed page content. Other annotations and arbitrary PDF layers are left unchanged.
                        </p>
                      </div>
                    </Card>
                  </section>

                  <Button onClick={executeFlatten} className="w-full h-16 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all gap-3 border-2 border-white/20 active:scale-95">
                    <Zap className="w-4 h-4" /> Flatten PDF
                  </Button>
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
              <div className="w-full max-w-sm space-y-3 mx-auto" role="status" aria-live="polite">
                <p className="text-sm font-semibold text-primary">{status || "Flattening supported form fields..."}</p>
                <div className="h-2 overflow-hidden rounded-md bg-primary/10"><div className="h-full w-1/2 animate-pulse rounded-md bg-primary" /></div>
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
