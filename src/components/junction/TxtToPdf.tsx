"use client";

import React, { useState, useRef } from "react";
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { CheckCircle2, Download, Loader2, FileText, RefreshCcw, Zap, Upload, Settings2, Edit3, Share2} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { cn } from '../../lib/utils';
import { ToolWorkspace, dl, fmtBytes, Pills, getFilesFromEvent, shareResult, beginToolProcessing, completeToolProcessing, failToolProcessing} from './_shared';

/**
 * AJN Professional TXT to PDF - Production v8.0
 * Specialized in Clean Text-to-PDF Creation.
 * Features: Dual-mode ingestion (Upload vs Paste), In-memory sync.
 */
export default function TxtToPdf() {
  const { toast } = useToast();
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [phase, setPhase] = useState<'upload' | 'configure' | 'processing' | 'done'>('upload');
  const [progress, setProgress] = useState(0);
  const [, setStatus] = useState("");
  const [outputName, setOutputName] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>) => {
    const f = getFilesFromEvent(e)?.[0];
    if (!f) return;
    
    setFile(f);
    const text = await f.text();
    setRawText(text);
    setPhase('configure');
    setOutputName(f.name.replace(/\.[^/.]+$/, "") + "_Export");
  };

  const startWithPaste = () => {
    if (!rawText.trim()) {
      toast({ title: "Content required", description: "Please enter text to convert.", variant: "destructive" });
      return;
    }
    setPhase('configure');
    setOutputName("Text_Export_" + new Date().toISOString().slice(0, 10));
  };

  const executeConversion = async () => {
    if (!rawText) return;
    beginToolProcessing("TxtToPdf");
    setPhase('processing');
    setProgress(0);
    setStatus("Creating PDF pages…");

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const lines = rawText.split('\n');
      const pageSize: [number, number] = [595.28, 841.89]; // A4
      let page = pdfDoc.addPage(pageSize);
      const { height } = page.getSize();
      let cursorY = height - 50;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].replace(/[^\x20-\x7E]/g, ""); // Basic cleanup
        if (cursorY < 50) {
          page = pdfDoc.addPage(pageSize);
          cursorY = height - 50;
        }
        page.drawText(line.slice(0, 95), { x: 50, y: cursorY, size: 10, font });
        cursorY -= 14;
        
        if (i % 100 === 0) setProgress(Math.round((i / lines.length) * 100));
      }

      const bytes = await pdfDoc.save();
      // Explicit ArrayBuffer cast for SharedArrayBuffer stability
      setResultBlob(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }));
      setPhase('done');
      completeToolProcessing();
    } catch {
      failToolProcessing();
      setPhase('configure');
      toast({ title: "Processing Error", variant: "destructive" });
    }
  };

  const reset = () => { setFile(null); setRawText(""); setPhase('upload'); setResultBlob(null); };

  return (
    <ToolWorkspace title="TXT to PDF" description="Turn plain text into a PDF document" accent="#2563EB">
      <div className="w-full">
        <AnimatePresence mode="wait">
          {phase === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-4xl mx-auto space-y-10">
              <div className="flex justify-center mb-8">
                <Pills 
                  opts={[
                    { label: "📁 Upload File", value: "upload" },
                    { label: "Paste text", value: "paste" }
                  ]}
                  val={inputMode}
                  onChange={(v: any) => setInputMode(v)}
                />
              </div>

              {inputMode === 'upload' ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileUpload(e); }}
                  className={cn(
                    "group relative min-h-[210px] w-full rounded-2xl border border-dashed transition-all duration-700 shadow-md overflow-hidden flex flex-col items-center justify-center cursor-pointer",
                    isDragging ? "border-primary bg-primary/10 shadow-primary/20 scale-[0.98]" : "border-black/5 bg-white/20 backdrop-blur-md hover:border-primary/40"
                  )}
                >
                  <input type="file" accept=".txt" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500 relative z-10 border border-black/5">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center space-y-1 px-8 relative z-10">
                    <h3 className="text-2xl font-black tracking-tighter uppercase text-slate-950">Drop TXT File</h3>
                  </div>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                  <div className="bg-white border-2 border-black/5 rounded-2xl shadow-md overflow-hidden p-8">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-3 block">Document Content</Label>
                    <Textarea 
                      placeholder="Paste your text or prompt here..." 
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      className="min-min-h-[200px] bg-slate-50 border-none rounded-2xl p-6 font-medium text-slate-700 focus:ring-primary/20 shadow-inner resize-none"
                    />
                  </div>
                  <Button 
                    onClick={startWithPaste}
                    disabled={!rawText.trim()}
                    className="w-full h-16 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all gap-3 border-2 border-white/20"
                  >
                    <Zap className="w-4 h-4" /> Create PDF
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {phase === 'configure' && (
            <motion.div key="configure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
              <div className="p-6 bg-white/40 rounded-2xl border border-black/5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[240px]">{file?.name || 'Manual Content'}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{file ? fmtBytes(file.size) : `${rawText.length} Characters`} • File ready</p>
                  </div>
                </div>
                <button onClick={reset} className="text-[10px] font-black uppercase text-red-500 hover:underline">Clear all</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Preview</Label>
                  <Card className="bg-white border-black/5 rounded-2xl shadow-inner overflow-hidden min-h-[420px] p-12">
                    <ScrollArea className="h-[500px]">
                      <div className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {rawText.slice(0, 2000)}{rawText.length > 2000 ? "..." : ""}
                      </div>
                    </ScrollArea>
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
                          <Input placeholder="output" value={outputName} onChange={(e) => setOutputName(e.target.value)} className="h-12 pl-12 bg-white/5 border-black/5 rounded-xl font-bold shadow-sm" />
                        </div>
                      </div>
                      <div className="p-4 bg-primary/5 rounded-2xl">
                        <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed text-center">
                          Your text is placed on A4 PDF pages.
                        </p>
                      </div>
                    </Card>
                  </section>

                  <Button onClick={executeConversion} className="w-full h-16 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all gap-3 border-2 border-white/20 active:scale-95">
                    <Zap className="w-4 h-4" /> Create PDF
                  </Button>
                </aside>
              </div>
            </motion.div>
          )}

          {phase === 'processing' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-24 flex flex-col items-center space-y-10 text-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <div className="w-full max-w-sm space-y-4 mx-auto">
                <div className="flex justify-between items-center px-2"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Creating PDF…</span><span className="text-xl font-black text-primary tracking-tighter">{progress}%</span></div>
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
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Your file is ready</p>
              </div>

              <div className="p-8 bg-white border-2 border-black/5 rounded-2xl w-full max-w-sm flex items-center justify-center gap-4 shadow-xl mx-auto">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Output file</p>
                  <p className="text-sm font-black text-slate-950 truncate">{outputName}.pdf</p>
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
