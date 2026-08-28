"use client";

import { RuntimeImage } from '@/components/ui/runtime-image';
import React, { useState, useRef, useEffect } from "react";
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Type, CheckCircle2, Download, Loader2, Activity, FileText, RefreshCcw, Zap, Settings2, Share2} from 'lucide-react';
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
import { VisualPositionOverlay } from "./visual-position-overlay";

export default function AddText() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [phase, setPhase] = useState<'upload' | 'configure' | 'processing' | 'done'>('upload');
  const [status, setStatus] = useState("");
  const [outputName, setOutputName] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 595, height: 842 });
  
  const [settings, setSettings] = useState({
    text: "Type something...",
    x: 100,
    y: 100,
    page: 1,
    size: 14,
    color: "#000000",
    bold: false
  });

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
    setOutputName(f.name.replace('.pdf', '') + "_Edited");

    try {
      initPdfWorker();
      const buffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      setPageCount(pdf.numPages);
      const page = await pdf.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });
      setPageSize({ width: baseViewport.width, height: baseViewport.height });
      const viewport = page.getViewport({ scale: 0.8 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: ctx, viewport }).promise;
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

  useEffect(() => {
    if (!file || phase !== 'configure') return;
    let cancelled = false;
    const renderSelectedPage = async () => {
      try {
        initPdfWorker();
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
        const pageNumber = Math.max(1, Math.min(pdf.numPages, settings.page));
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: 0.8 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) {
          setPageSize({ width: baseViewport.width, height: baseViewport.height });
          setPreview(canvas.toDataURL('image/jpeg', 0.8));
        }
      } catch {
        // Keep the current preview; processing will surface a clear error if needed.
      }
    };
    void renderSelectedPage();
    return () => { cancelled = true; };
  }, [file, phase, settings.page]);

  const executeAddText = async () => {
    if (!file || !settings.text.trim()) return;
    beginToolProcessing("AddText");
    setPhase('processing');
    setStatus("Applying text…");

    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(settings.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
      
      const idx = Math.max(0, Math.min(pdfDoc.getPageCount() - 1, settings.page - 1));
      const page = pdfDoc.getPage(idx);
      
      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return rgb(r || 0, g || 0, b || 0);
      };

      page.drawText(settings.text, {
        x: settings.x,
        y: settings.y,
        size: settings.size,
        font,
        color: hexToRgb(settings.color),
      });

      const finalBytes = await pdfDoc.save();
      setResultBlob(new Blob([finalBytes.buffer as ArrayBuffer], { type: 'application/pdf' }));
      setPhase('done');
      completeToolProcessing();
    } catch {
      failToolProcessing();
      setPhase('configure');
      toast({ title: "Processing Error", variant: "destructive" });
    }
  };

  const reset = () => { setFile(null); setPreview(""); setPhase('upload'); setResultBlob(null); };

  return (
    <ToolWorkspace title="Add Text" description="Add text to a PDF page and position it visually" accent="#0369A1">
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
                  isDragging ? "border-blue-500 bg-blue-500/10" : "border-black/5 bg-white/20 backdrop-blur-md hover:border-blue-500/40"
                )}
              >
                <input type="file" accept=".pdf" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500 border border-black/5">
                  <Type className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-center space-y-1 px-8 relative z-10">
                  <h3 className="text-2xl font-black tracking-tighter uppercase text-slate-950">Choose a PDF</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Add text directly to PDF</p>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'configure' && file && (
            <motion.div key="configure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
              <div className="p-6 bg-white/40 rounded-2xl border border-black/5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[240px]">{file.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{fmtBytes(file.size)} • {pageCount} Pages • File ready</p>
                  </div>
                </div>
                <button onClick={reset} className="text-[10px] font-black uppercase text-red-500 hover:underline">Change File</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Preview</Label>
                  <Card className="bg-white border-black/5 rounded-2xl shadow-inner overflow-hidden min-h-[420px] flex items-center justify-center p-12">
                    <div className="relative inline-block leading-none shadow-md">
                      <RuntimeImage src={preview} className="block max-h-[500px] w-auto rounded-sm border border-black/5" alt="PDF page preview" />
                      <VisualPositionOverlay
                        x={settings.x}
                        y={settings.y}
                        pageWidth={pageSize.width}
                        pageHeight={pageSize.height}
                        ariaLabel="Move text on page"
                        className="border-dashed bg-transparent px-2 py-1"
                        onChange={(next) => setSettings((current) => ({ ...current, x: next.x, y: next.y }))}
                      >
                        <span style={{ fontSize: `${Math.max(10, settings.size / 1.6)}px`, color: settings.color, fontWeight: settings.bold ? 700 : 400, lineHeight: 1.2 }}>
                          {settings.text || "Text"}
                        </span>
                      </VisualPositionOverlay>
                    </div>
                  </Card>
                </div>

                <aside className="lg:col-span-5 space-y-6">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Settings2 className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Settings</Label>
                    </div>
                    
                    <Card className="bg-white/60 backdrop-blur-xl border-black/5 rounded-3xl p-8 space-y-8 shadow-xl">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Content</Label>
                        <Input value={settings.text} onChange={(e) => setSettings({...settings, text: e.target.value})} className="h-12 bg-white/5 border-black/5 rounded-xl font-bold" />
                      </div>

                      <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4 text-sm text-slate-600">
                        Drag the text directly on the page preview to choose its position.
                      </div>

                      <details className="rounded-2xl border border-black/5 bg-black/[0.02] p-4">
                        <summary className="cursor-pointer text-sm font-semibold">Advanced position</summary>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label htmlFor="add-text-x">X</Label><Input id="add-text-x" type="number" value={settings.x} onChange={(e) => setSettings({...settings, x: parseInt(e.target.value) || 0})} /></div>
                          <div className="space-y-2"><Label htmlFor="add-text-y">Y</Label><Input id="add-text-y" type="number" value={settings.y} onChange={(e) => setSettings({...settings, y: parseInt(e.target.value) || 0})} /></div>
                        </div>
                      </details>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Page</Label>
                          <Input type="number" min={1} max={pageCount} value={settings.page} onChange={(e) => setSettings({...settings, page: parseInt(e.target.value) || 1})} className="h-11 bg-white/5 border-black/5 rounded-xl font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Font Size</Label>
                          <Input type="number" min={6} max={120} value={settings.size} onChange={(e) => setSettings({...settings, size: parseInt(e.target.value) || 14})} className="h-11 bg-white/5 border-black/5 rounded-xl font-bold" />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Color</Label>
                          <Input type="color" value={settings.color} onChange={(e) => setSettings({...settings, color: e.target.value})} className="h-11 bg-white/5 border-black/5 rounded-xl p-1" />
                        </div>
                        <div className="flex-1 flex flex-col justify-end pt-6">
                          <Button variant="outline" className={cn("h-11 rounded-xl border-black/5 font-black text-[10px] uppercase", settings.bold && "bg-primary text-white border-primary shadow-lg")} onClick={() => setSettings({...settings, bold: !settings.bold})}>Bold</Button>
                        </div>
                      </div>
                    </Card>
                  </section>

                  <Button onClick={executeAddText} disabled={!settings.text.trim()} className="w-full h-16 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all gap-3 border-2 border-white/20 active:scale-95">
                    <Zap className="w-4 h-4" /> Apply text
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
                <p className="text-sm font-semibold text-primary">{status || "Applying text…"}</p>
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
