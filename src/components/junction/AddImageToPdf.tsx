"use client";

import { RuntimeImage } from '@/components/ui/runtime-image';
import React, { useState, useRef, useEffect } from "react";
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import { CheckCircle2, Download, Loader2, FileText, RefreshCcw, Zap, Settings2, ImageIcon, Share2} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/use-toast';
import { cn } from '../../lib/utils';
import { ToolWorkspace, dl, safeOutputName, getFilesFromEvent, shareResult, beginToolProcessing, completeToolProcessing, failToolProcessing} from './_shared';
import { initPdfWorker } from "@/lib/pdfjs-worker";
import { validatePdfFile } from "@/lib/file-validation";
import { VisualPositionOverlay } from "./visual-position-overlay";

/**
 * AJN Professional Image Embedder - Real-time Unit
 */
export default function AddImageToPdf() {
  const { toast } = useToast();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [phase, setPhase] = useState<'upload' | 'configure' | 'processing' | 'done'>('upload');
  const [status, setStatus] = useState("");
  const [outputName, setOutputName] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [, setIsDragging] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 595, height: 842 });
  const [imagePreview, setImagePreview] = useState("");
  
  const [settings, setSettings] = useState({
    x: 50,
    y: 100,
    width: 200,
    height: 150,
    page: 1,
    opacity: 1,
    rotation: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processPdf = async (f: File) => {
    const validation = await validatePdfFile(f, 50);
    if (validation) {
      toast({ title: "Invalid PDF", description: validation, variant: "destructive" });
      return;
    }
    setPdfFile(f);
    setOutputName(f.name.replace(/\.pdf$/i, "") + "_with_image");
    setStatus("Reading file…");
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
      if (imageFile) setPhase('configure');
    } catch {
      toast({ title: "Analysis failed", variant: "destructive" });
    }
  };

  const selectImage = (f: File) => {
    if (!/image\/(png|jpeg)/i.test(f.type) && !/\.(png|jpe?g)$/i.test(f.name)) {
      toast({ title: "Choose a PNG or JPG image", variant: "destructive" });
      return;
    }
    setImageFile(f);
    const url = URL.createObjectURL(f);
    setImagePreview((old) => { if (old) URL.revokeObjectURL(old); return url; });
    if (pdfFile) setPhase('configure');
  };

  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  useEffect(() => {
    if (!pdfFile || phase !== 'configure') return;
    let cancelled = false;
    const renderSelectedPage = async () => {
      try {
        initPdfWorker();
        const buffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
        const pageNumber = Math.max(1, Math.min(pdf.numPages, settings.page));
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: 0.8 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.height = viewport.height; canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) { setPageSize({ width: baseViewport.width, height: baseViewport.height }); setPreview(canvas.toDataURL('image/jpeg', 0.8)); }
      } catch {
        // Keep the current preview; processing will report a real failure if execution fails.
      }
    };
    void renderSelectedPage();
    return () => { cancelled = true; };
  }, [pdfFile, phase, settings.page]);

  const executeAddImage = async () => {
    if (!pdfFile || !imageFile) return;
    beginToolProcessing("AddImageToPdf");
    setPhase('processing');
    setStatus("Applying changes…");

    try {
      const pdfBytes = await pdfFile.arrayBuffer();
      const imgBytes = await imageFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      
      let img;
      if (imageFile.type === 'image/png') {
        img = await pdfDoc.embedPng(imgBytes);
      } else {
        img = await pdfDoc.embedJpg(imgBytes);
      }

      const idx = Math.max(0, Math.min(pdfDoc.getPageCount() - 1, settings.page - 1));
      const page = pdfDoc.getPage(idx);
      
      page.drawImage(img, {
        x: settings.x,
        y: settings.y,
        width: settings.width,
        height: settings.height,
        opacity: settings.opacity,
        rotate: degrees(settings.rotation),
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

  const reset = () => { 
    setPdfFile(null); 
    setImageFile(null); 
    setImagePreview((old) => { if (old) URL.revokeObjectURL(old); return ""; });
    setPreview(""); 
    setPhase('upload'); 
    setResultBlob(null); 
  };

  return (
    <ToolWorkspace title="Add Image to PDF" description="Place an image or logo on a PDF page" accent="#7C3AED">
      <div className="w-full">
        <AnimatePresence mode="wait">
          {phase === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div 
                  role="button" tabIndex={0} aria-label="Choose PDF"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = getFilesFromEvent(e)?.[0]; if (f && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name))) void processPdf(f); }}
                  className={cn(
                    "group relative min-h-[200px] rounded-2xl border border-dashed transition-all duration-500 shadow-xl flex flex-col items-center justify-center cursor-pointer",
                    pdfFile ? "border-emerald-500 bg-emerald-500/5" : "border-black/5 bg-white/20 backdrop-blur-md hover:border-primary/40"
                  )}
                >
                  <input type="file" accept=".pdf,application/pdf" ref={fileInputRef} className="hidden" onChange={e => { if(e.target.files?.[0]) void processPdf(e.target.files[0]); }} />
                  {pdfFile ? (
                    <div className="text-center space-y-3">
                      <FileText className="w-10 h-10 text-emerald-500 mx-auto" />
                      <p className="text-xs font-black uppercase text-slate-900 truncate max-w-[200px]">{pdfFile.name}</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-md border border-black/5 group-hover:scale-110 transition-transform"><FileText className="w-8 h-8 text-primary" /></div>
                      <p className="text-sm font-black uppercase tracking-widest text-slate-400">Step 1: Load PDF</p>
                    </div>
                  )}
                </div>

                <div 
                  role="button" tabIndex={pdfFile ? 0 : -1} aria-disabled={!pdfFile} aria-label="Choose image"
                  onKeyDown={(e) => { if (pdfFile && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.currentTarget.click(); } }}
                  onDragOver={(e) => { if (pdfFile) e.preventDefault(); }}
                  onDrop={(e) => { e.preventDefault(); if (!pdfFile) return; const f = getFilesFromEvent(e)?.[0]; if (f) selectImage(f); }}
                  onClick={() => { if(!pdfFile) { toast({title: "Choose the PDF first"}); return; } const i = document.createElement('input'); i.type='file'; i.accept='.png,.jpg,.jpeg,image/png,image/jpeg'; i.onchange=(e:any)=> { const f=e.target.files?.[0]; if(f) selectImage(f); }; i.click(); }}
                  className={cn(
                    "group relative min-h-[200px] rounded-2xl border border-dashed transition-all duration-500 shadow-xl flex flex-col items-center justify-center cursor-pointer",
                    !pdfFile ? "opacity-20 cursor-not-allowed" : imageFile ? "border-emerald-500 bg-emerald-500/5" : "border-black/5 bg-white/20 backdrop-blur-md hover:border-primary/40"
                  )}
                >
                  {imageFile ? (
                    <div className="text-center space-y-3">
                      <ImageIcon className="w-10 h-10 text-emerald-500 mx-auto" />
                      <p className="text-xs font-black uppercase text-slate-900 truncate max-w-[240px]">{imageFile.name}</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-md border border-black/5 group-hover:scale-110 transition-transform"><ImageIcon className="w-8 h-8 text-primary" /></div>
                      <p className="text-sm font-black uppercase tracking-widest text-slate-400">Step 2: Load Image</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'configure' && pdfFile && imageFile && (
            <motion.div key="configure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
              <div className="p-6 bg-white/40 rounded-2xl border border-black/5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[8px] uppercase h-5">PDF ready</Badge>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[8px] uppercase h-5">Image ready</Badge>
                  </div>
                </div>
                <button onClick={reset} className="text-[10px] font-black uppercase text-red-500 hover:underline">Clear files</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Preview</Label>
                  <Card className="bg-white border-black/5 rounded-2xl shadow-inner overflow-hidden min-h-[420px] flex items-center justify-center p-12">
                    <div className="relative inline-block leading-none shadow-md">
                      <RuntimeImage src={preview} className="block max-h-[450px] w-auto rounded-sm border border-black/5" alt="PDF page preview" />
                      <VisualPositionOverlay
                        x={settings.x} y={settings.y} width={settings.width} height={settings.height}
                        pageWidth={pageSize.width} pageHeight={pageSize.height} resizable ariaLabel="Move and resize image on page"
                        onChange={(next) => setSettings((current) => ({ ...current, x: next.x, y: next.y, width: next.width ?? current.width, height: next.height ?? current.height }))}
                      >
                        {imagePreview ? <RuntimeImage src={imagePreview} alt="Image being added" className="pointer-events-none h-full w-full object-contain" style={{ opacity: settings.opacity, transform: `rotate(${settings.rotation}deg)` }} /> : <ImageIcon className="m-auto h-5 w-5 text-primary" />}
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
                    
                    <Card className="bg-white/60 backdrop-blur-xl border-black/5 rounded-3xl p-8 space-y-6 shadow-xl border-2">
                      <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4 text-sm text-slate-600">Drag the image on the preview. Use the corner handle to resize it.</div>
                      <div className="space-y-2"><Label htmlFor="add-image-page">Page</Label><Input id="add-image-page" type="number" min={1} max={pageCount} value={settings.page} onChange={e => setSettings({...settings, page: +e.target.value})} /></div>
                      <div className="space-y-2"><Label htmlFor="add-image-opacity">Opacity</Label><input id="add-image-opacity" type="range" min="0.1" max="1" step="0.05" value={settings.opacity} onChange={e => setSettings({...settings, opacity: +e.target.value})} className="w-full accent-blue-600" /></div>
                      <div className="space-y-2"><Label htmlFor="add-image-rotation">Rotation</Label><Input id="add-image-rotation" type="number" min={-180} max={180} value={settings.rotation} onChange={e => setSettings({...settings, rotation: +e.target.value})} /></div>
                      <details className="rounded-2xl border border-black/5 bg-black/[0.02] p-4">
                        <summary className="cursor-pointer text-sm font-semibold">Advanced position</summary>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div><Label htmlFor="add-image-x">X</Label><Input id="add-image-x" type="number" value={settings.x} onChange={e => setSettings({...settings, x: +e.target.value})} /></div>
                          <div><Label htmlFor="add-image-y">Y</Label><Input id="add-image-y" type="number" value={settings.y} onChange={e => setSettings({...settings, y: +e.target.value})} /></div>
                          <div><Label htmlFor="add-image-width">Width</Label><Input id="add-image-width" type="number" value={settings.width} onChange={e => setSettings({...settings, width: +e.target.value})} /></div>
                          <div><Label htmlFor="add-image-height">Height</Label><Input id="add-image-height" type="number" value={settings.height} onChange={e => setSettings({...settings, height: +e.target.value})} /></div>
                        </div>
                      </details>
                    </Card>
                  </section>

                  <Button onClick={executeAddImage} className="w-full h-16 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all gap-3 border-2 border-white/20 active:scale-95">
                    <Zap className="w-4 h-4" /> Add image
                  </Button>
                </aside>
              </div>
            </motion.div>
          )}

          {phase === 'processing' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-24 flex flex-col items-center space-y-10 text-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <div className="w-full max-w-sm space-y-3 mx-auto" role="status" aria-live="polite">
                <p className="text-sm font-semibold text-primary">{status || "Applying changes…"}</p>
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
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Pixel layer correctly embedded into PDF</p>
              </div>
              <div className="w-full max-w-sm flex flex-col gap-4 mx-auto pt-4 pb-32">
                <Button onClick={() => dl(resultBlob, safeOutputName(outputName, "pdf_with_image", ".pdf"))} className="h-16 bg-emerald-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:bg-emerald-600 transition-all gap-3 border-2 border-white/20 active:scale-95">
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
                <Button variant="outline" onClick={() => void shareResult(resultBlob, safeOutputName(outputName, "pdf_with_image", ".pdf"))} className="h-12 border-slate-200 bg-white text-slate-700 font-black text-xs rounded-xl shadow-sm hover:border-blue-200 hover:bg-blue-50/60 gap-2">
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
