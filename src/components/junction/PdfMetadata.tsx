"use client";

import React, { useState, useRef } from "react";

import { FileText, CheckCircle2, Download, Loader2, Activity, RefreshCcw, Zap, Settings2, Search, User, Type, Tag, Share2} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/use-toast';
import { cn } from '../../lib/utils';
import { ToolWorkspace, dl, fmtBytes, getFilesFromEvent, shareResult, beginToolProcessing, completeToolProcessing, failToolProcessing} from './_shared';
import { loadPdf, editMetadata } from "./_pdfUtils";
import { validatePdfFile } from "@/lib/file-validation";

/**
 * AJN PDF metadata editor
 */
export default function PdfMetadata() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<'upload' | 'configure' | 'processing' | 'done'>('upload');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [meta, setMeta] = useState({
    title: "",
    author: "",
    subject: "",
    keywords: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (f: File) => {
    const validation = await validatePdfFile(f, 50);
    if (validation) {
      toast({ title: "Invalid PDF", description: validation, variant: "destructive" });
      return;
    }
    setFile(f);
    setStatus("Reading current document properties...");
    try {
      const doc = await loadPdf(f);
      const kw = doc.getKeywords();
      setMeta({
        title: doc.getTitle() || "",
        author: doc.getAuthor() || "",
        subject: doc.getSubject() || "",
        keywords: typeof kw === 'string' ? kw : ""
      });
      setPhase('configure');
    } catch {
      toast({ title: "Read failed", variant: "destructive" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>) => {
    const f = getFilesFromEvent(e)?.[0];
    if (f) void processFile(f);
  };

  const executeSave = async () => {
    if (!file) return;
    beginToolProcessing("PdfMetadata");
    setPhase('processing');
    setProgress(0);
    setStatus("Updating document properties…");

    try {
      const blob = await editMetadata(file, meta.title, meta.author, meta.subject, meta.keywords);
      setProgress(100);
      setResultBlob(blob);
      setPhase('done');
      completeToolProcessing();
    } catch {
      failToolProcessing();
      setPhase('configure');
      toast({ title: "Process Error", variant: "destructive" });
    }
  };

  const reset = () => { setFile(null); setPhase('upload'); setResultBlob(null); setProgress(0); };

  return (
    <ToolWorkspace title="Edit Metadata" description="Edit PDF title, author, subject and keywords" accent="#475569">
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
                  isDragging ? "border-slate-400 bg-slate-500/10" : "border-black/5 bg-white/20 backdrop-blur-md hover:border-slate-400"
                )}
              >
                <input type="file" accept=".pdf" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500 border border-black/5">
                  <Tag className="w-8 h-8 text-slate-500" />
                </div>
                <div className="text-center space-y-1 px-8 relative z-10">
                  <h3 className="text-2xl font-black tracking-tighter uppercase text-slate-950">Drop PDF to Inspect</h3>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'configure' && file && (
            <motion.div key="configure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
              <div className="p-6 bg-white/40 rounded-2xl border border-black/5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-black/5">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[240px]">{file.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{fmtBytes(file.size)} • File ready</p>
                  </div>
                </div>
                <button onClick={reset} className="text-[10px] font-black uppercase text-red-500 hover:underline">Change File</button>
              </div>

              <div className="max-w-3xl mx-auto w-full space-y-8">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Settings2 className="w-3.5 h-3.5 text-primary" />
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Document Properties</Label>
                  </div>
                  
                  <Card className="bg-white/60 backdrop-blur-xl border-black/5 rounded-2xl p-10 space-y-8 shadow-xl border-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5"><Type className="w-3 h-3"/> Title</Label>
                        <Input value={meta.title} onChange={e => setMeta({...meta, title: e.target.value})} className="h-12 bg-white/5 border-black/5 rounded-xl font-bold shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5"><User className="w-3 h-3"/> Author</Label>
                        <Input value={meta.author} onChange={e => setMeta({...meta, author: e.target.value})} className="h-12 bg-white/5 border-black/5 rounded-xl font-bold shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5"><Search className="w-3 h-3"/> Subject</Label>
                        <Input value={meta.subject} onChange={e => setMeta({...meta, subject: e.target.value})} className="h-12 bg-white/5 border-black/5 rounded-xl font-bold shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1.5"><Tag className="w-3 h-3"/> Keywords</Label>
                        <Input value={meta.keywords} onChange={e => setMeta({...meta, keywords: e.target.value})} className="h-12 bg-white/5 border-black/5 rounded-xl font-bold shadow-inner" />
                      </div>
                    </div>
                  </Card>
                </section>

                <Button onClick={executeSave} className="w-full h-16 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all gap-3 border-2 border-white/20 active:scale-95">
                  <Zap className="w-4 h-4" /> Save Metadata
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
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Metadata updated</p>
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
                <Button onClick={() => dl(resultBlob, "metadata-updated.pdf")} className="h-16 bg-emerald-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:bg-emerald-600 transition-all gap-3 border-2 border-white/20 active:scale-95">
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
                <Button variant="outline" onClick={() => void shareResult(resultBlob, "metadata-updated.pdf")} className="h-12 border-slate-200 bg-white text-slate-700 font-black text-xs rounded-xl shadow-sm hover:border-blue-200 hover:bg-blue-50/60 gap-2">
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
