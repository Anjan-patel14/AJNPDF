'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { CheckCircle2, Download, Eraser, FileCheck2, PenTool, Plus, Redo2, RefreshCcw, Trash2, Undo2, Upload } from 'lucide-react';
import { RuntimeImage } from '@/components/ui/runtime-image';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { VisualPositionOverlay } from './visual-position-overlay';
import { ToolWorkspace, beginToolProcessing, completeToolProcessing, dl, failToolProcessing, safeOutputName } from './_shared';
import { initPdfWorker } from '@/lib/pdfjs-worker';
import { validatePdfFile } from "@/lib/file-validation";
import { SignatureDrawingEngine, type SignMode } from '@/lib/pdf-sign';
import { createElectronicSignature, type ElectronicSignatureEvidence, type SignaturePlacementInput, type SignatureSource } from '@/lib/e-signature';
import { cn } from '@/lib/utils';

const CONSENT = 'I intend to sign this document electronically and agree that my electronic signature is associated with this document.';
const FONTS = [
  ['Script', 'cursive'], ['Serif', 'Georgia,serif'], ['Classic', 'Times New Roman,serif'],
  ['Modern', 'Trebuchet MS,sans-serif'], ['Rounded', 'Comic Sans MS,cursive'], ['Elegant', 'Brush Script MT,cursive']] as const;

type Mark = SignaturePlacementInput & { id: string; dataUrl: string };
type Result = { pdfBlob: Blob; evidence: ElectronicSignatureEvidence; evidenceBlob: Blob };

function textMark(value: string, font: string, color: string, opacity: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 300;
  const context = canvas.getContext('2d');
  if (!context) return '';
  context.clearRect(0,0,canvas.width,canvas.height);
  context.globalAlpha = opacity;
  context.fillStyle = color;
  context.font = `italic 108px ${font}`;
  context.textBaseline = 'middle';
  context.fillText(value.trim(),45,canvas.height/2);
  return canvas.toDataURL('image/png');
}

async function cleanUpload(file: File, removeWhite: boolean, brightness: number, contrast: number) {
  if (!/^image\/(png|jpeg)$/i.test(file.type) || file.size > 8 * 1024 * 1024) throw new Error('Choose PNG or JPG up to 8 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve,reject) => {
      const instance = new Image();
      instance.onload = () => resolve(instance);
      instance.onerror = () => reject(new Error('Signature image could not be opened.'));
      instance.src = url;
    });
    if (image.naturalWidth * image.naturalHeight > 20_000_000) throw new Error('Signature image dimensions are too large.');
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image rendering is unavailable.');
    context.filter = `brightness(${Math.max(50,Math.min(150,brightness))}%) contrast(${Math.max(50,Math.min(180,contrast))}%)`;
    context.drawImage(image,0,0);
    context.filter = 'none';
    const data = context.getImageData(0,0,canvas.width,canvas.height);
    let minX=canvas.width, minY=canvas.height, maxX=-1, maxY=-1;
    for (let y=0;y<canvas.height;y+=1) {
      for (let x=0;x<canvas.width;x+=1) {
        const i=(y*canvas.width+x)*4;
        const r=data.data[i], g=data.data[i+1], b=data.data[i+2];
        if (removeWhite && r>235 && g>235 && b>235) data.data[i+3]=0;
        if (data.data[i+3]>12) { minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y); }
      }
    }
    context.putImageData(data,0,0);
    if (maxX>=minX && maxY>=minY) {
      const padding=8;
      const sx=Math.max(0,minX-padding), sy=Math.max(0,minY-padding);
      const sw=Math.min(canvas.width-sx,maxX-minX+1+padding*2), sh=Math.min(canvas.height-sy,maxY-minY+1+padding*2);
      const trimmed=document.createElement('canvas'); trimmed.width=Math.max(1,sw); trimmed.height=Math.max(1,sh);
      trimmed.getContext('2d')?.drawImage(canvas,sx,sy,sw,sh,0,0,sw,sh);
      return trimmed.toDataURL('image/png');
    }
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function SignPdfStudio() {
  const [file,setFile] = useState<File|null>(null);
  const [pageCount,setPageCount] = useState(0);
  const [pageSize,setPageSize] = useState({width:595,height:842});
  const [preview,setPreview] = useState('');
  const [thumbs,setThumbs] = useState<string[]>([]);
  const [page,setPage] = useState(1);
  const [zoom,setZoom] = useState(0.85);
  const [source,setSource] = useState<SignatureSource>('draw');
  const [mode,setMode] = useState<SignMode>('pen');
  const [typed,setTyped] = useState('');
  const [font,setFont] = useState<string>(FONTS[0][1]);
  const [ink,setInk] = useState('#111827');
  const [strokeWidth,setStrokeWidth] = useState(2.5);
  const [opacity,setOpacity] = useState(1);
  const [removeWhite,setRemoveWhite] = useState(true);
  const [uploadBrightness,setUploadBrightness] = useState(100);
  const [uploadContrast,setUploadContrast] = useState(100);
  const [signature,setSignature] = useState('');
  const [marks,setMarks] = useState<Mark[]>([]);
  const [signerName,setSignerName] = useState('');
  const [signerEmail,setSignerEmail] = useState('');
  const [reason,setReason] = useState('I approve and sign this document.');
  const [consented,setConsented] = useState(false);
  const [caption,setCaption] = useState(true);
  const [outputName,setOutputName] = useState('signed.pdf');
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [result,setResult] = useState<Result|null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SignatureDrawingEngine|null>(null);

  useEffect(() => {
    if (source !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!engineRef.current) engineRef.current = new SignatureDrawingEngine(canvas);
    engineRef.current.setMode(mode);
    engineRef.current.setStyle({ color: ink, width: strokeWidth, opacity });
  }, [source,mode,ink,strokeWidth,opacity,file]);

  useEffect(() => {
    if (!file) { setPreview(''); setThumbs([]); return; }
    let cancelled = false;
    void (async () => {
      try {
        initPdfWorker();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        if (cancelled) return;
        setPageCount(pdf.numPages);
        const nextThumbs: string[] = [];
        for (let n=1;n<=Math.min(pdf.numPages,20);n+=1) {
          const p = await pdf.getPage(n);
          const viewport = p.getViewport({scale:0.16});
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext('2d');
          if (!context) continue;
          await p.render({canvasContext:context,viewport}).promise;
          nextThumbs.push(canvas.toDataURL('image/jpeg',0.7));
        }
        if (!cancelled) setThumbs(nextThumbs);
        const p = await pdf.getPage(Math.max(1,Math.min(pdf.numPages,page)));
        const base = p.getViewport({scale:1});
        setPageSize({width:base.width,height:base.height});
        const viewport = p.getViewport({scale:zoom});
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('PDF rendering is unavailable.');
        await p.render({canvasContext:context,viewport}).promise;
        if (!cancelled) setPreview(canvas.toDataURL('image/jpeg',0.88));
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'PDF preview failed.');
      }
    })();
    return () => { cancelled = true; };
  }, [file,page,zoom]);

  const active = useMemo(() => {
    if (source === 'type') return typed.trim() ? textMark(typed,font,ink,opacity) : '';
    return signature;
  }, [source,typed,font,ink,opacity,signature]);

  const choosePdf = async (selected?: File) => {
    if (!selected) return;
    const validation = await validatePdfFile(selected, 50);
    if (validation) { setError(validation); return; }
    setFile(selected);
    setPage(1);
    setMarks([]);
    setResult(null);
    setOutputName(`${selected.name.replace(/\.pdf$/i,'')}-signed.pdf`);
    setError('');
  };

  const addMark = (kind: 'signature'|'initials'|'date') => {
    let data = active;
    if (kind === 'initials') {
      const initials = signerName.trim().split(/\s+/).map(value => value[0]).join('').slice(0,5) || typed.slice(0,3);
      data = textMark(initials,font,ink,opacity);
    }
    if (kind === 'date') data = textMark(new Date().toISOString().slice(0,10),'Arial,sans-serif',ink,opacity);
    if (!data) { setError('Create, type, or upload a signature first.'); return; }
    setMarks(current => [
      ...current,
      {
        id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${current.length}`,
        kind,
        page,
        x:100,
        y:100,
        width: kind === 'date' ? 130 : 165,
        height: kind === 'date' ? 34 : 78,
        rotation:0,
        dataUrl:data,
      }]);
    setError('');
  };

  const update = (id: string, next: Partial<Mark>) => setMarks(current => current.map(mark => mark.id === id ? {...mark,...next} : mark));

  const sign = async () => {
    if (!file || !marks.length) { setError('Add at least one signature, initials, or date placement.'); return; }
    setLoading(true);
    setError('');
    beginToolProcessing('Signature Studio');
    try {
      const signed = await createElectronicSignature(file,marks[0].dataUrl,{
        signerName, signerEmail, reason, consented, consentText:CONSENT,
        signatureSource:source, placements:marks, includeAuditCaption:caption,
      });
      setResult(signed);
      completeToolProcessing();
    } catch (cause) {
      failToolProcessing();
      setError(cause instanceof Error ? cause.message : 'Signing failed.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const pdfName = safeOutputName(outputName,'signed','.pdf');
    const evidenceName = `${pdfName.replace(/\.pdf$/i,'')}-evidence.json`;
    return (
      <ToolWorkspace title="Signature Studio" description="Customize and place evidence-backed electronic signatures, initials and dates." accent="#7C3AED">
        <div className="mx-auto max-w-2xl space-y-4 py-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h2 className="text-3xl font-black">Signed PDF ready</h2>
          <p className="text-sm text-slate-500">{result.evidence.signature.placements.length} placement(s) recorded in the evidence manifest.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button onClick={() => dl(result.pdfBlob,pdfName)}><Download className="mr-2 h-4 w-4" />Download signed PDF</Button>
            <Button variant="outline" onClick={() => dl(result.evidenceBlob,evidenceName)}><FileCheck2 className="mr-2 h-4 w-4" />Evidence JSON</Button>
          </div>
          <Button variant="ghost" onClick={() => setResult(null)}><RefreshCcw className="mr-2 h-4 w-4" />Edit again</Button>
        </div>
      </ToolWorkspace>
    );
  }

  return (
    <ToolWorkspace title="Signature Studio" description="Draw, type or upload a signature; customize it; place multiple signatures, initials and dates across pages." accent="#7C3AED">
      <div className="space-y-5">
        {!file ? (
          <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-violet-200 bg-violet-50/50 p-8">
            <input type="file" accept=".pdf,application/pdf" className="sr-only" onChange={event => { void choosePdf(event.target.files?.[0]); }} />
            <PenTool className="h-9 w-9 text-violet-600" />
            <span className="mt-3 font-black">Choose PDF to sign</span>
          </label>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[180px_1fr_360px]">
            <aside className="space-y-2">
              <div className="text-xs font-black uppercase text-slate-500">Pages</div>
              {thumbs.map((src,index) => (
                <button key={index} onClick={() => setPage(index+1)} className={cn('w-full rounded-xl border p-2',page===index+1?'border-violet-500 bg-violet-50':'border-slate-200')}>
                  <RuntimeImage src={src} alt={`Page ${index+1}`} className="mx-auto max-h-32" />
                  <span className="text-xs font-bold">Page {index+1}</span>
                </button>
              ))}
            </aside>

            <main className="space-y-4">
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
                {([['draw','Draw'],['type','Type'],['upload','Upload']] as const).map(([value,label]) => (
                  <button key={value} onClick={() => setSource(value)} className={cn('rounded-lg px-3 py-2 text-xs font-black',source===value?'bg-white text-violet-700 shadow':'text-slate-500')}>{label}</button>
                ))}
              </div>

              {source === 'draw' && (
                <Card className="space-y-3 p-4">
                  <div className="flex flex-wrap gap-2">
                    {(['pen','pencil','marker'] as SignMode[]).map(value => <Button key={value} size="sm" variant={mode===value?'default':'outline'} onClick={() => setMode(value)}>{value}</Button>)}
                    <Button size="sm" variant="outline" onClick={() => {engineRef.current?.undo();setSignature(engineRef.current?.exportPNG()||'')}}><Undo2 className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => {engineRef.current?.redo();setSignature(engineRef.current?.exportPNG()||'')}}><Redo2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-xs font-bold">Color <input type="color" value={ink} onChange={event => setInk(event.target.value)} className="ml-2" /></label>
                    <label className="text-xs font-bold">Width {strokeWidth.toFixed(1)}<input type="range" min="0.5" max="18" step="0.5" value={strokeWidth} onChange={event => setStrokeWidth(Number(event.target.value))} className="w-full" /></label>
                    <label className="text-xs font-bold">Opacity {Math.round(opacity*100)}%<input type="range" min="0.2" max="1" step="0.05" value={opacity} onChange={event => setOpacity(Number(event.target.value))} className="w-full" /></label>
                  </div>
                  <div className="relative rounded-xl border bg-white">
                    <canvas
                      ref={canvasRef}
                      width={900}
                      height={260}
                      className="h-48 w-full touch-none"
                      onPointerDown={event => {event.currentTarget.setPointerCapture(event.pointerId);engineRef.current?.startDraw(event.nativeEvent)}}
                      onPointerMove={event => engineRef.current?.continueDraw(event.nativeEvent)}
                      onPointerUp={() => {engineRef.current?.endDraw();setSignature(engineRef.current?.exportPNG()||'')}}
                    />
                    <Button variant="ghost" size="sm" className="absolute bottom-2 right-2" onClick={() => {engineRef.current?.clear();setSignature('')}}><Eraser className="mr-1 h-4 w-4" />Clear</Button>
                  </div>
                </Card>
              )}

              {source === 'type' && (
                <Card className="space-y-3 p-4">
                  <Label>Typed signature</Label>
                  <Input value={typed} onChange={event => setTyped(event.target.value)} />
                  <select value={font} onChange={event => setFont(event.target.value)} className="w-full rounded-xl border p-2">
                    {FONTS.map(([name,value]) => <option key={name} value={value}>{name}</option>)}
                  </select>
                  {active && <RuntimeImage src={active} alt="Typed signature" className="mx-auto max-h-20" />}
                </Card>
              )}

              {source === 'upload' && (
                <Card className="space-y-3 p-4">
                  <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed">
                    <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={event => void (async () => {const selected=event.target.files?.[0];if(selected)setSignature(await cleanUpload(selected,removeWhite,uploadBrightness,uploadContrast))})()} />
                    {signature ? <RuntimeImage src={signature} alt="Uploaded signature" className="max-h-20" /> : <><Upload className="h-5 w-5" />Choose PNG/JPG</>}
                  </label>
                  <label className="text-xs font-bold"><input type="checkbox" checked={removeWhite} onChange={event => setRemoveWhite(event.target.checked)} className="mr-2" />Remove near-white background + trim whitespace</label>
                  <label className="text-xs font-bold">Brightness {uploadBrightness}%<input type="range" min="60" max="140" step="5" value={uploadBrightness} onChange={event => setUploadBrightness(Number(event.target.value))} className="w-full" /></label>
                  <label className="text-xs font-bold">Contrast {uploadContrast}%<input type="range" min="60" max="160" step="5" value={uploadContrast} onChange={event => setUploadContrast(Number(event.target.value))} className="w-full" /></label>
                </Card>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => addMark('signature')} disabled={!active}><Plus className="mr-1 h-4 w-4" />Add signature</Button>
                <Button variant="outline" onClick={() => addMark('initials')}><Plus className="mr-1 h-4 w-4" />Add initials</Button>
                <Button variant="outline" onClick={() => addMark('date')}><Plus className="mr-1 h-4 w-4" />Add date</Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">Page {page} of {Math.max(1,pageCount)}</span>
                <Label>Zoom</Label>
                <input type="range" min="0.45" max="1.4" step="0.05" value={zoom} onChange={event => setZoom(Number(event.target.value))} />
                <span className="text-xs font-bold">{Math.round(zoom*100)}%</span>
              </div>

              <Card className="flex min-h-[500px] items-center justify-center overflow-auto bg-slate-100 p-4">
                {preview && (
                  <div className="relative inline-block shadow-lg">
                    <RuntimeImage src={preview} alt="PDF preview" className="block w-auto" />
                    {marks.filter(mark => mark.page === page).map(mark => (
                      <VisualPositionOverlay
                        key={mark.id}
                        x={mark.x}
                        y={mark.y}
                        width={mark.width}
                        height={mark.height}
                        pageWidth={pageSize.width}
                        pageHeight={pageSize.height}
                        resizable
                        ariaLabel={`Move ${mark.kind}`}
                        onChange={next => update(mark.id,{x:next.x,y:next.y,width:next.width??mark.width,height:next.height??mark.height})}
                      >
                        <RuntimeImage src={mark.dataUrl} alt={mark.kind||'signature'} className="pointer-events-none h-full w-full object-contain" style={{transform:`rotate(${mark.rotation||0}deg)`}} />
                      </VisualPositionOverlay>
                    ))}
                  </div>
                )}
              </Card>
            </main>

            <aside className="space-y-4">
              <Card className="space-y-3 p-4">
                <h2 className="font-black">Signer evidence</h2>
                <Label>Name</Label><Input value={signerName} onChange={event => setSignerName(event.target.value)} />
                <Label>Email</Label><Input type="email" value={signerEmail} onChange={event => setSignerEmail(event.target.value)} />
                <Label>Reason</Label><textarea value={reason} onChange={event => setReason(event.target.value)} rows={3} className="w-full rounded-xl border p-2 text-sm" />
                <Label>Output name</Label><Input value={outputName} onChange={event => setOutputName(event.target.value)} />
                <label className="text-xs font-bold"><input type="checkbox" checked={caption} onChange={event => setCaption(event.target.checked)} className="mr-2" />Include audit caption</label>
                <label className="flex gap-2 rounded-xl bg-violet-50 p-3 text-xs"><input type="checkbox" checked={consented} onChange={event => setConsented(event.target.checked)} /><span>{CONSENT}</span></label>
              </Card>

              <Card className="space-y-2 p-4">
                <div className="font-black">Placements ({marks.length})</div>
                {marks.map(mark => (
                  <div key={mark.id} className="rounded-xl border p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <button className="font-black" onClick={() => setPage(mark.page)}>{mark.kind} · page {mark.page}</button>
                      <button onClick={() => setMarks(current => current.filter(item => item.id !== mark.id))}><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <label>Rotation {mark.rotation||0}°<input type="range" min="-30" max="30" value={mark.rotation||0} onChange={event => update(mark.id,{rotation:Number(event.target.value)})} className="w-full" /></label>
                    <div className="grid grid-cols-2 gap-1">
                      <label>X<Input type="number" value={Math.round(mark.x)} onChange={event=>update(mark.id,{x:Number(event.target.value)||0})}/></label>
                      <label>Y<Input type="number" value={Math.round(mark.y)} onChange={event=>update(mark.id,{y:Number(event.target.value)||0})}/></label>
                      <label>W<Input type="number" min={24} value={Math.round(mark.width)} onChange={event=>update(mark.id,{width:Math.max(24,Number(event.target.value)||24)})}/></label>
                      <label>H<Input type="number" min={16} value={Math.round(mark.height)} onChange={event=>update(mark.id,{height:Math.max(16,Number(event.target.value)||16)})}/></label>
                    </div>
                  </div>
                ))}
              </Card>

              <div className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-950">
                Evidence-backed electronic signing only. This is not certificate-backed PAdES, CA-trusted signing, Aadhaar eSign, or government identity verification.
              </div>
              {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}
              <Button className="h-14 w-full" disabled={loading||!consented||!signerName.trim()||!signerEmail.trim()||!marks.length} onClick={() => void sign()}>
                {loading ? 'Signing…' : <><CheckCircle2 className="mr-2 h-4 w-4" />Sign PDF with evidence</>}
              </Button>
            </aside>
          </div>
        )}
      </div>
    </ToolWorkspace>
  );
}
