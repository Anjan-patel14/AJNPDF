"use client";

import { RuntimeImage } from '@/components/ui/runtime-image';
import React, { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { Smartphone, CheckCircle2, Download, Loader2, RefreshCcw, Zap, ShieldCheck, Settings2, Edit3, FileWarning, Share2} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/use-toast';
import { cn } from '../../lib/utils';
import { ToolWorkspace, dl, getFilesFromEvent, shareResult, beginToolProcessing, completeToolProcessing, failToolProcessing} from './_shared';

/**
 * AJN Professional HEIC to PDF - Production v15.3
 * Hardened: Handles multi-frame results with explicit Uint8Array casting for SharedArrayBuffer stability.
 * SSR Safety: Moving heic2any to dynamic execution to prevent "window is not defined" crashes.
 */
export default function HeicToPdf() {
  const { toast } = useToast();
  const [files, setF] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [phase, setPhase] = useState<'upload' | 'configure' | 'processing' | 'done'>('upload');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [outputName, setOutputName] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>) => {
    const raw = Array.from(getFilesFromEvent(e) || []);
    const valid = raw.filter(f => f.name.toLowerCase().endsWith('.heic'));
    
    if (raw.length > 0 && valid.length === 0) {
      toast({ title: "Invalid Format", description: "Please select .heic files.", variant: "destructive" });
      return;
    }

    if (valid.length > 0) {
      setF(valid);
      setPhase('configure');
      setOutputName(valid[0].name.replace(/\.[^/.]+$/, "") + "_heic_export");
      
      try {
        const heic2any = (await import("heic2any")).default;
        const res = await heic2any({ blob: valid[0], toType: "image/jpeg", quality: 0.2 });
        const blob = Array.isArray(res) ? res[0] : res;
        setPreviews([URL.createObjectURL(blob as Blob)]);
      } catch {
      failToolProcessing();
        console.warn("[AJN] HEIC preview could not be created.");
      }
    }
  };

  const executeConversion = async () => {
    if (files.length === 0) return;
    beginToolProcessing("HeicToPdf");
    setPhase('processing');
    setProgress(0);
    setStatus("Initializing iOS transcode core...");

    try {
      const heic2any = (await import("heic2any")).default;
      const pdfDoc = await PDFDocument.create();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatus(`Developing segment ${i + 1} of ${files.length}...`);

        const res = await heic2any({ 
          blob: file, 
          toType: "image/jpeg", 
          quality: 0.92 
        });
        
        // Robust handling for multi-frame results
        const converted = Array.isArray(res) ? res[0] : res;
        const imgBytes = await (converted as Blob).arrayBuffer();
        
        // Explicitly cast to Uint8Array using .slice(0) to bypass SharedArrayBuffer issues
        const uint8Image = new Uint8Array(imgBytes.slice(0) as ArrayBuffer);
        const img = await pdfDoc.embedJpg(uint8Image);
        
        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      const bytes = await pdfDoc.save();
      setResultBlob(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }));
      setPhase('done');
      completeToolProcessing();
    } catch (err) {
      failToolProcessing();
      console.error("[AJN] Transcode Failure:", err);
      setPhase('configure');
      toast({ title: "Conversion Error", description: "The HEIC image could not be converted.", variant: "destructive" });
    }
  };

  const reset = () => { 
    setF([]); 
    setPreviews(prev => { prev.forEach(u => URL.revokeObjectURL(u)); return []; });
    setPhase('upload'); 
    setResultBlob(null); 
  };

  return (
    <ToolWorkspace title="HEIC to PDF" description="Turn HEIC photos into a PDF" accent="#06B6D4">
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
                  isDragging ? "border-cyan-500 bg-cyan-500/10" : "border-black/5 bg-white/20 backdrop-blur-md hover:border-cyan-500/40"
                )}
              >
                <input type="file" multiple accept=".heic" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500 border border-black/5">
                  <Smartphone className="w-8 h-8 text-cyan-500" />
                </div>
                <div className="text-center space-y-1 px-8 relative z-10">
                  <h3 className="text-2xl font-black tracking-tighter uppercase text-slate-950">Drop .heic Files</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">HEIC files</p>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'configure' && files.length > 0 && (
            <motion.div key="configure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
              <div className="p-6 bg-white/40 rounded-2xl border border-black/5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase">{files.length} HEIC files selected</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ready</p>
                  </div>
                </div>
                <button onClick={reset} className="text-[10px] font-black uppercase text-red-500 hover:underline">Clear all</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Preview</Label>
                  <Card className="bg-white border-black/5 rounded-2xl shadow-inner overflow-hidden min-h-[420px] flex items-center justify-center p-12">
                    {previews[0] ? (
                      <div className="relative group shadow-md">
                        <RuntimeImage src={previews[0]} className="max-h-[500px] w-auto rounded-sm border border-black/5" alt="" />
                      </div>
                    ) : (
                      <div className="text-center space-y-4 opacity-40">
                        <FileWarning className="w-16 h-16 mx-auto text-slate-300" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Preview unavailable • Ready to convert</p>
                      </div>
                    )}
                  </Card>
                </div>

                <aside className="lg:col-span-5 space-y-6">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Settings2 className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Setup</Label>
                    </div>
                    <Card className="bg-white/60 backdrop-blur-xl border-black/5 rounded-3xl p-8 space-y-6 shadow-xl border-2">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Output Name</Label>
                        <div className="relative">
                          <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input placeholder="heic_export" value={outputName} onChange={(e) => setOutputName(e.target.value)} className="h-12 pl-12 bg-white/5 border-black/5 rounded-xl font-bold" />
                        </div>
                      </div>
                      <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                        <p className="text-[9px] font-bold text-cyan-700 uppercase leading-relaxed text-center">
                          The selected HEIC file stays in this workspace while the PDF is created. Reset the tool when finished to clear the working data.
                        </p>
                      </div>
                    </Card>
                  </section>

                  <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] flex items-center justify-center gap-2 text-emerald-600 shadow-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Ready</span>
                  </div>

                  <Button onClick={executeConversion} className="w-full h-16 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all gap-3 border-2 border-white/20 active:scale-95">
                    <Zap className="w-4 h-4" /> Convert
                  </Button>
                </aside>
              </div>
            </motion.div>
          )}

          {phase === 'processing' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-24 flex flex-col items-center space-y-10 text-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <div className="w-full max-w-sm space-y-4 mx-auto">
                <div className="flex justify-between items-center px-2"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{status}</span><span className="text-xl font-black text-primary tracking-tighter">{progress}%</span></div>
                <Progress value={progress} className="h-1.5 bg-black/5" />
              </div>
            </motion.div>
          )}

          {phase === 'done' && resultBlob && (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="py-12 flex flex-col items-center space-y-10 text-center pb-32">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-slate-950">Success 🎉</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Your PDF is ready</p>
              </div>
              <div className="w-full max-w-sm flex flex-col gap-4 mx-auto pt-4">
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
