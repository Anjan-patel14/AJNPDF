"use client";

import { RuntimeImage } from '@/components/ui/runtime-image';
import React, { useState, useRef, useEffect } from "react";
import * as pdfjsLib from 'pdfjs-dist';
import { PenTool, CheckCircle2, Download, Loader2, RefreshCcw, Zap, Upload, Eraser, Pen, Brush, Highlighter, Share2} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { SignatureDrawingEngine, embedSignature, SignMode } from "@/lib/pdf-sign";

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/use-toast';
import { cn } from '../../lib/utils';
import { ToolWorkspace, dl, getFilesFromEvent, safeOutputName, shareResult, beginToolProcessing, completeToolProcessing, failToolProcessing} from './_shared';
import { initPdfWorker } from "@/lib/pdfjs-worker";
import { VisualPositionOverlay } from "./visual-position-overlay";

/**
 * AJN Professional Sign PDF Unit - Production v12.1
 * Tracks page count after the PDF is loaded.
 */
export default function SignPdf() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [phase, setPhase] = useState<'upload' | 'configure' | 'processing' | 'done'>('upload');
  const [status, setStatus] = useState("");
  const [outputName, setOutputName] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<SignMode>('pen');
  const [pageCount, setPageCount] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 595, height: 842 });
  const [signatureSource, setSignatureSource] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [signaturePreview, setSignaturePreview] = useState('');

  const [settings, setSettings] = useState({
    x: 100, y: 100, width: 160, height: 80, page: 1
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SignatureDrawingEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase === 'configure' && canvasRef.current && !engineRef.current) {
      engineRef.current = new SignatureDrawingEngine(canvasRef.current);
    }
    if (engineRef.current) {
      engineRef.current.setMode(mode);
    }
  }, [phase, mode]);

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
        canvas.height = viewport.height; canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) { setPageSize({ width: baseViewport.width, height: baseViewport.height }); setPreview(canvas.toDataURL('image/jpeg', 0.8)); }
      } catch {
      failToolProcessing();}
    };
    void renderSelectedPage();
    return () => { cancelled = true; };
  }, [file, phase, settings.page]);

  const makeTypedSignature = (value: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 900; canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111827';
    ctx.font = 'italic 92px cursive';
    ctx.textBaseline = 'middle';
    ctx.fillText(value.trim(), 40, canvas.height / 2);
    return canvas.toDataURL('image/png');
  };

  const chooseSignatureImage = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.png,.jpg,.jpeg,image/png,image/jpeg';
    input.onchange = () => {
      const source = input.files?.[0]; if (!source) return;
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        ctx.drawImage(image, 0, 0);
        setSignaturePreview(canvas.toDataURL('image/png'));
        URL.revokeObjectURL(image.src);
      };
      image.src = URL.createObjectURL(source);
    };
    input.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>) => {
    const f = getFilesFromEvent(e)?.[0];
    if (!f || f.type !== 'application/pdf') return;
    setFile(f);
    setPhase('configure');
    setStatus("Reading file…");
    setOutputName(f.name.replace(/\.pdf$/i, "") + "_signed");

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
      failToolProcessing();
      toast({ title: "Analysis failed", variant: "destructive" });
      setPhase('upload');
    }
  };

  const executeSign = async () => {
    const drawingEngine = engineRef.current;
    if (!file || (signatureSource === 'draw' && !drawingEngine)) return;
    beginToolProcessing("SignPdf");
    setPhase('processing');
    setStatus("Adding signature…");

    try {
      const dataUrl = signatureSource === 'draw'
        ? drawingEngine!.exportPNG()
        : signatureSource === 'type'
          ? makeTypedSignature(typedSignature)
          : signaturePreview;
      if (!dataUrl) throw new Error('Create a signature first.');
      const blob = await embedSignature(file, dataUrl, settings);
      setResultBlob(blob);
      setPhase('done');
      completeToolProcessing();
    } catch {
      failToolProcessing();
      setPhase('configure');
      toast({ title: "Processing Error", variant: "destructive" });
    }
  };

  const reset = () => { 
    setFile(null); 
    setPreview(""); 
    setPhase('upload'); 
    setResultBlob(null); 
    engineRef.current = null; 
    setSignaturePreview("");
    setTypedSignature("");
    setSignatureSource('draw');
    setPageCount(0);
  };

  return (
    <ToolWorkspace title="Sign PDF" description="Add and position a visual signature on your PDF" accent="#7C3AED">
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
                  isDragging ? "border-primary bg-primary/10" : "border-black/5 bg-white/20 backdrop-blur-md hover:border-primary/40"
                )}
              >
                <input type="file" accept=".pdf" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500 border border-black/5">
                  <PenTool className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center space-y-1 px-8 relative z-10">
                  <h3 className="text-2xl font-black tracking-tighter uppercase text-slate-950">Choose a PDF</h3>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'configure' && file && (
            <motion.div key="configure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-black/[0.03] p-1">
                    {[['draw','Draw'],['type','Type'],['upload','Upload']].map(([id,label]) => (
                      <button key={id} type="button" aria-pressed={signatureSource === id} onClick={() => setSignatureSource(id as 'draw'|'type'|'upload')} className={cn("min-h-11 rounded-xl px-3 text-sm font-semibold transition", signatureSource === id ? "bg-white text-primary shadow-sm" : "text-slate-500")}>{label}</button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between px-2">
                    <Label className="text-sm font-semibold text-slate-700">{signatureSource === 'draw' ? 'Draw your signature' : signatureSource === 'type' ? 'Type your signature' : 'Upload signature image'}</Label>
                    <div className={cn("flex gap-2", signatureSource !== 'draw' && "hidden")}>
                      {[
                        { id: 'pen', icon: Pen, label: 'Fine' },
                        { id: 'pencil', icon: Brush, label: 'Pencil' },
                        { id: 'marker', icon: Highlighter, label: 'Marker' }
                      ].map(t => (
                        <Button key={t.id} variant="outline" size="sm" onClick={() => setMode(t.id as any)} className={cn("h-8 rounded-xl font-black text-[8px] uppercase gap-1.5", mode === t.id && "bg-primary text-white border-primary")}>
                          <t.icon className="w-3 h-3" /> {t.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {signatureSource === 'draw' && (
                    <div className="relative overflow-hidden rounded-3xl border border-dashed border-black/10 bg-slate-50 shadow-inner">
                      <canvas
                        ref={canvasRef}
                        width={800}
                        height={250}
                        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); engineRef.current?.startDraw(e.nativeEvent); }}
                        onPointerMove={(e) => engineRef.current?.continueDraw(e.nativeEvent)}
                        onPointerUp={(e) => { engineRef.current?.endDraw(); e.currentTarget.releasePointerCapture(e.pointerId); setSignaturePreview(engineRef.current?.exportPNG() || ''); }}
                        onPointerCancel={() => engineRef.current?.endDraw()}
                        className="h-[220px] w-full cursor-crosshair touch-none"
                        aria-label="Draw signature"
                      />
                      <Button variant="ghost" onClick={() => { engineRef.current?.clear(); setSignaturePreview(''); }} className="absolute bottom-4 right-4 h-10 rounded-xl bg-white/90 px-4 text-sm font-semibold shadow-sm">
                        <Eraser className="mr-2 h-4 w-4" /> Clear
                      </Button>
                    </div>
                  )}
                  {signatureSource === 'type' && (
                    <div className="space-y-3 rounded-3xl border border-black/5 bg-white/70 p-5">
                      <Label htmlFor="typed-signature">Your name or signature</Label>
                      <Input id="typed-signature" value={typedSignature} onChange={(e) => { setTypedSignature(e.target.value); setSignaturePreview(makeTypedSignature(e.target.value)); }} placeholder="Type your signature" className="h-12 text-lg italic" />
                      {typedSignature && <div className="min-h-24 rounded-2xl bg-slate-50 p-4"><RuntimeImage src={makeTypedSignature(typedSignature)} alt="Typed signature preview" className="mx-auto max-h-20" /></div>}
                    </div>
                  )}
                  {signatureSource === 'upload' && (
                    <button type="button" onClick={chooseSignatureImage} className="min-h-36 w-full rounded-3xl border border-dashed border-black/10 bg-white/70 p-6 text-center transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      {signaturePreview ? <RuntimeImage src={signaturePreview} alt="Uploaded signature preview" className="mx-auto max-h-24" /> : <><Upload className="mx-auto mb-3 h-7 w-7 text-primary" /><span className="font-semibold">Choose PNG or JPG signature</span></>}
                    </button>
                  )}

                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Preview</Label>
                  <Card className="bg-white border-black/5 rounded-2xl shadow-inner overflow-hidden min-h-[400px] flex items-center justify-center p-12">
                    <div className="relative inline-block leading-none shadow-md">
                      <RuntimeImage src={preview} className="block max-h-[400px] w-auto rounded-sm border border-black/5" alt="PDF page preview" />
                      <VisualPositionOverlay
                        x={settings.x} y={settings.y} width={settings.width} height={settings.height}
                        pageWidth={pageSize.width} pageHeight={pageSize.height} resizable ariaLabel="Move and resize signature on page"
                        onChange={(next) => setSettings((current) => ({ ...current, x: next.x, y: next.y, width: next.width ?? current.width, height: next.height ?? current.height }))}
                      >
                        {signaturePreview ? <RuntimeImage src={signaturePreview} alt="Signature placement preview" className="pointer-events-none h-full w-full object-contain" /> : <div className="grid h-full w-full place-items-center"><PenTool className="h-5 w-5 text-primary" /></div>}
                      </VisualPositionOverlay>
                    </div>
                  </Card>
                </div>

                <aside className="lg:col-span-4 space-y-6">
                   <Card className="bg-white border-black/5 rounded-2xl p-8 space-y-8 shadow-xl border-2">
                      <Label className="text-sm font-semibold text-slate-700">Placement</Label>
                      <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4 text-sm text-slate-600">Drag the signature on the PDF preview. Use the corner handle to resize it.</div>
                      <div className="space-y-2"><Label htmlFor="sign-page">Page</Label><Input id="sign-page" type="number" min={1} max={pageCount} value={settings.page} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({...settings, page: +e.target.value})} /></div>
                      <details className="rounded-2xl border border-black/5 bg-black/[0.02] p-4">
                        <summary className="cursor-pointer text-sm font-semibold">Advanced position</summary>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div><Label htmlFor="sign-x">X</Label><Input id="sign-x" type="number" value={settings.x} onChange={(e) => setSettings({...settings, x: +e.target.value})} /></div>
                          <div><Label htmlFor="sign-y">Y</Label><Input id="sign-y" type="number" value={settings.y} onChange={(e) => setSettings({...settings, y: +e.target.value})} /></div>
                          <div><Label htmlFor="sign-w">Width</Label><Input id="sign-w" type="number" value={settings.width} onChange={(e) => setSettings({...settings, width: +e.target.value})} /></div>
                          <div><Label htmlFor="sign-h">Height</Label><Input id="sign-h" type="number" value={settings.height} onChange={(e) => setSettings({...settings, height: +e.target.value})} /></div>
                        </div>
                      </details>
                   </Card>

                   <Button onClick={executeSign} className="w-full h-16 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all gap-3 border-2 border-white/20 active:scale-95">
                     <Zap className="w-4 h-4" /> Add signature
                   </Button>
                </aside>
              </div>
            </motion.div>
          )}

          {phase === 'processing' && (
            <div className="py-24 flex flex-col items-center space-y-10 text-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <div className="w-full max-w-sm space-y-3 mx-auto" role="status" aria-live="polite">
                <p className="text-sm font-semibold text-primary">{status || "Adding signature…"}</p>
                <div className="h-2 overflow-hidden rounded-md bg-primary/10"><div className="h-full w-1/2 animate-pulse rounded-md bg-primary" /></div>
              </div>
            </div>
          )}

          {phase === 'done' && resultBlob && (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="py-12 flex flex-col items-center space-y-10 text-center">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-slate-950">Success 🎉</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Your signed PDF is ready</p>
              </div>
              <div className="w-full max-w-sm flex flex-col gap-4 mx-auto pt-4 pb-32">
                <Button onClick={() => dl(resultBlob, safeOutputName(outputName, "signed_pdf", ".pdf"))} className="h-16 bg-emerald-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:bg-emerald-600 transition-all gap-3 border-2 border-white/20 active:scale-95">
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
                <Button variant="outline" onClick={() => void shareResult(resultBlob, safeOutputName(outputName, "signed_pdf", ".pdf"))} className="h-12 border-slate-200 bg-white text-slate-700 font-black text-xs rounded-xl shadow-sm hover:border-blue-200 hover:bg-blue-50/60 gap-2">
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
