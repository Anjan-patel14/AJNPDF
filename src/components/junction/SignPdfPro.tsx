'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { CheckCircle2, Download, Eraser, FileCheck2, PenTool, RefreshCcw, ShieldCheck, Upload } from 'lucide-react';
import { RuntimeImage } from '@/components/ui/runtime-image';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { VisualPositionOverlay } from './visual-position-overlay';
import { ToolWorkspace, dl, failToolProcessing, beginToolProcessing, completeToolProcessing, safeOutputName } from './_shared';
import { initPdfWorker } from '@/lib/pdfjs-worker';
import { SignatureDrawingEngine, type SignMode } from '@/lib/pdf-sign';
import { createElectronicSignature, type ElectronicSignatureEvidence, type SignatureSource } from '@/lib/e-signature';
import { cn } from '@/lib/utils';

const CONSENT_TEXT = 'I intend to sign this document electronically and agree that my electronic signature is associated with this document.';

type Result = {
  pdfBlob: Blob;
  evidence: ElectronicSignatureEvidence;
  evidenceBlob: Blob;
};

function typedSignatureDataUrl(value: string): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 1100;
  canvas.height = 280;
  const context = canvas.getContext('2d');
  if (!context) return '';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#111827';
  context.font = 'italic 104px cursive';
  context.textBaseline = 'middle';
  context.fillText(value.trim(), 45, canvas.height / 2);
  return canvas.toDataURL('image/png');
}

async function uploadedSignatureDataUrl(file: File): Promise<string> {
  if (!/^image\/(png|jpeg)$/i.test(file.type) || file.size > 8 * 1024 * 1024) {
    throw new Error('Choose a PNG or JPG signature image up to 8 MB.');
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const instance = new Image();
      instance.onload = () => resolve(instance);
      instance.onerror = () => reject(new Error('The signature image could not be opened.'));
      instance.src = url;
    });
    if (image.naturalWidth * image.naturalHeight > 20_000_000) throw new Error('The signature image dimensions are too large.');
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image rendering is unavailable in this browser.');
    context.drawImage(image, 0, 0);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function SignPdfPro() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 595, height: 842 });
  const [preview, setPreview] = useState('');
  const [source, setSource] = useState<SignatureSource>('draw');
  const [mode, setMode] = useState<SignMode>('pen');
  const [typedName, setTypedName] = useState('');
  const [signaturePreview, setSignaturePreview] = useState('');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [reason, setReason] = useState('I approve and sign this document.');
  const [consented, setConsented] = useState(false);
  const [outputName, setOutputName] = useState('signed.pdf');
  const [settings, setSettings] = useState({ page: 1, x: 100, y: 100, width: 165, height: 78 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SignatureDrawingEngine | null>(null);
  const engineCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (source !== 'draw') {
      engineRef.current = null;
      engineCanvasRef.current = null;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!engineRef.current || engineCanvasRef.current !== canvas) {
      engineRef.current = new SignatureDrawingEngine(canvas);
      engineCanvasRef.current = canvas;
    }
    engineRef.current.setMode(mode);
  }, [source, mode, file]);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        initPdfWorker();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        if (cancelled) return;
        setPageCount(pdf.numPages);
        const pageNumber = Math.max(1, Math.min(pdf.numPages, settings.page));
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        setPageSize({ width: baseViewport.width, height: baseViewport.height });
        const viewport = page.getViewport({ scale: 0.85 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('PDF rendering is unavailable.');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport }).promise;
        if (!cancelled) setPreview(canvas.toDataURL('image/jpeg', 0.88));
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'The PDF could not be previewed.');
      }
    })();
    return () => { cancelled = true; };
  }, [file, settings.page]);

  const activeSignature = useMemo(() => {
    if (source === 'type') return typedName.trim() ? typedSignatureDataUrl(typedName) : '';
    return signaturePreview;
  }, [source, typedName, signaturePreview]);

  const choosePdf = async (selected: File | undefined) => {
    if (!selected) return;
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Choose a PDF document.');
      return;
    }
    if (selected.size > 75 * 1024 * 1024) {
      setError('This PDF is larger than the current AJN PDF signing limit.');
      return;
    }
    setError('');
    setResult(null);
    setFile(selected);
    setOutputName(`${selected.name.replace(/\.pdf$/i, '')}-signed.pdf`);
    setSettings(current => ({ ...current, page: 1 }));
  };

  const chooseSignature = async (selected: File | undefined) => {
    if (!selected) return;
    try {
      setError('');
      setSignaturePreview(await uploadedSignatureDataUrl(selected));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The signature image could not be loaded.');
    }
  };

  const sign = async () => {
    if (!file) return;
    const signature = source === 'draw'
      ? (hasDrawn ? engineRef.current?.exportPNG() || '' : '')
      : source === 'type'
        ? typedSignatureDataUrl(typedName)
        : signaturePreview;
    if (!signature) {
      setError('Create, type, or upload a signature first.');
      return;
    }
    setError('');
    setLoading(true);
    beginToolProcessing('Electronic signature');
    try {
      const signed = await createElectronicSignature(file, signature, {
        signerName,
        signerEmail,
        reason,
        consented,
        consentText: CONSENT_TEXT,
        signatureSource: source,
        ...settings,
        includeAuditCaption: true,
      });
      setResult(signed);
      completeToolProcessing();
    } catch (cause) {
      failToolProcessing();
      setError(cause instanceof Error ? cause.message : 'The PDF could not be signed.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPageCount(0);
    setPreview('');
    setSignaturePreview('');
    setTypedName('');
    setSignerName('');
    setSignerEmail('');
    setReason('I approve and sign this document.');
    setConsented(false);
    setResult(null);
    setError('');
    setHasDrawn(false);
    engineRef.current = null;
    engineCanvasRef.current = null;
  };

  if (result) {
    const pdfName = safeOutputName(outputName, 'signed', '.pdf');
    const evidenceName = `${pdfName.replace(/\.pdf$/i, '')}-evidence.json`;
    return (
      <ToolWorkspace title="Sign PDF" description="Electronic signature with signer consent, document hashes and embedded evidence." accent="#7C3AED">
        <div className="mx-auto max-w-2xl space-y-5 py-8">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-8 w-8" /></div>
            <h2 className="mt-4 text-3xl font-black text-slate-950">Signed PDF ready</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">The PDF contains an embedded AJN signature evidence manifest. A companion JSON manifest includes the final PDF hash.</p>
          </div>
          <Card className="space-y-3 rounded-2xl border-slate-200 p-5 text-sm">
            <div><span className="font-black text-slate-700">Evidence ID:</span> <span className="font-mono text-xs">{result.evidence.evidence_id}</span></div>
            <div><span className="font-black text-slate-700">Signer:</span> {result.evidence.signer.name} · {result.evidence.signer.email}</div>
            <div><span className="font-black text-slate-700">Signed at:</span> {result.evidence.created_at_utc}</div>
            <div className="break-all"><span className="font-black text-slate-700">Original SHA-256:</span> <span className="font-mono text-[11px]">{result.evidence.document.original_sha256}</span></div>
            <div className="break-all"><span className="font-black text-slate-700">Final PDF SHA-256:</span> <span className="font-mono text-[11px]">{result.evidence.document.final_pdf_sha256}</span></div>
          </Card>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-6 text-amber-950">
            This is an evidence-backed electronic signature workflow. It is not a certificate-backed PAdES digital signature and AJN PDF does not claim CA trust or government eSign status.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button className="h-12 rounded-xl font-black" onClick={() => dl(result.pdfBlob, pdfName)}><Download className="mr-2 h-4 w-4" />Download signed PDF</Button>
            <Button variant="outline" className="h-12 rounded-xl font-black" onClick={() => dl(result.evidenceBlob, evidenceName)}><FileCheck2 className="mr-2 h-4 w-4" />Download evidence JSON</Button>
          </div>
          <Button variant="ghost" className="w-full" onClick={reset}><RefreshCcw className="mr-2 h-4 w-4" />Sign another PDF</Button>
        </div>
      </ToolWorkspace>
    );
  }

  return (
    <ToolWorkspace title="Sign PDF" description="Add an electronic signature with signer identity, consent, hashes and embedded evidence." accent="#7C3AED">
      <div className="space-y-6">
        {!file ? (
          <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-violet-200 bg-violet-50/50 p-8 text-center transition hover:border-violet-400">
            <input type="file" accept=".pdf,application/pdf" className="sr-only" onChange={event => void choosePdf(event.target.files?.[0])} />
            <PenTool className="h-9 w-9 text-violet-600" />
            <span className="mt-4 text-xl font-black text-slate-950">Choose PDF to sign</span>
            <span className="mt-1 text-xs font-semibold text-slate-500">The signing workflow runs in your browser and creates an audit evidence manifest.</span>
          </label>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
                {([['draw','Draw'],['type','Type'],['upload','Upload']] as const).map(([value,label]) => (
                  <button key={value} type="button" onClick={() => setSource(value)} className={cn('rounded-xl px-3 py-3 text-xs font-black', source === value ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500')}>{label}</button>
                ))}
              </div>

              {source === 'draw' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(['pen','pencil','marker'] as SignMode[]).map(value => <Button key={value} variant={mode === value ? 'default' : 'outline'} size="sm" onClick={() => setMode(value)}>{value}</Button>)}
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white">
                    <canvas
                      ref={canvasRef}
                      width={900}
                      height={260}
                      className="h-52 w-full touch-none cursor-crosshair"
                      onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); engineRef.current?.startDraw(event.nativeEvent); }}
                      onPointerMove={event => engineRef.current?.continueDraw(event.nativeEvent)}
                      onPointerUp={event => { engineRef.current?.endDraw(); event.currentTarget.releasePointerCapture(event.pointerId); setHasDrawn(true); setSignaturePreview(engineRef.current?.exportPNG() || ''); }}
                      onPointerCancel={() => engineRef.current?.endDraw()}
                    />
                    <Button variant="ghost" size="sm" className="absolute bottom-3 right-3" onClick={() => { engineRef.current?.clear(); setHasDrawn(false); setSignaturePreview(''); }}><Eraser className="mr-2 h-4 w-4" />Clear</Button>
                  </div>
                </div>
              )}

              {source === 'type' && (
                <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                  <Label htmlFor="typed-signature">Type your signature</Label>
                  <Input id="typed-signature" value={typedName} onChange={event => setTypedName(event.target.value)} placeholder="Your signature" />
                  {typedName.trim() && <div className="rounded-xl bg-slate-50 p-3"><RuntimeImage src={typedSignatureDataUrl(typedName)} alt="Typed signature" className="mx-auto max-h-20" /></div>}
                </div>
              )}

              {source === 'upload' && (
                <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center">
                  <input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" className="sr-only" onChange={event => void chooseSignature(event.target.files?.[0])} />
                  {signaturePreview ? <RuntimeImage src={signaturePreview} alt="Uploaded signature" className="max-h-24" /> : <><Upload className="h-6 w-6 text-violet-600" /><span className="mt-2 text-sm font-black">Choose PNG or JPG signature</span></>}
                </label>
              )}

              <Card className="flex min-h-[420px] items-center justify-center overflow-auto rounded-2xl border-slate-200 bg-slate-100 p-5">
                {preview && (
                  <div className="relative inline-block shadow-lg">
                    <RuntimeImage src={preview} alt="PDF page preview" className="block max-h-[560px] w-auto" />
                    <VisualPositionOverlay
                      x={settings.x}
                      y={settings.y}
                      width={settings.width}
                      height={settings.height}
                      pageWidth={pageSize.width}
                      pageHeight={pageSize.height}
                      resizable
                      ariaLabel="Move and resize signature"
                      onChange={next => setSettings(current => ({ ...current, x: next.x, y: next.y, width: next.width ?? current.width, height: next.height ?? current.height }))}
                    >
                      {activeSignature ? <RuntimeImage src={activeSignature} alt="Signature placement" className="pointer-events-none h-full w-full object-contain" /> : <div className="grid h-full w-full place-items-center rounded border border-violet-300 bg-violet-50/70"><PenTool className="h-5 w-5 text-violet-600" /></div>}
                    </VisualPositionOverlay>
                  </div>
                )}
              </Card>
            </div>

            <aside className="space-y-4">
              <Card className="space-y-4 rounded-2xl border-slate-200 p-5">
                <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-violet-600" /><h2 className="font-black text-slate-950">Signer evidence</h2></div>
                <div><Label htmlFor="signer-name">Signer name</Label><Input id="signer-name" value={signerName} onChange={event => setSignerName(event.target.value)} maxLength={120} /></div>
                <div><Label htmlFor="signer-email">Signer email</Label><Input id="signer-email" type="email" value={signerEmail} onChange={event => setSignerEmail(event.target.value)} maxLength={180} /></div>
                <div><Label htmlFor="sign-reason">Reason / intent</Label><textarea id="sign-reason" value={reason} onChange={event => setReason(event.target.value)} maxLength={300} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none" /></div>
                <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="sign-page">Page</Label><Input id="sign-page" type="number" min={1} max={Math.max(1,pageCount)} value={settings.page} onChange={event => setSettings(current => ({ ...current, page: Math.max(1, Math.min(pageCount || 1, Number(event.target.value) || 1)) }))} /></div><div><Label htmlFor="signed-output">Output name</Label><Input id="signed-output" value={outputName} onChange={event => setOutputName(event.target.value)} /></div></div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-violet-100 bg-violet-50 p-3 text-xs font-semibold leading-5 text-violet-950"><input type="checkbox" checked={consented} onChange={event => setConsented(event.target.checked)} className="mt-1" /><span>{CONSENT_TEXT}</span></label>
              </Card>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold leading-6 text-slate-600">AJN PDF records hashes and evidence for this electronic-signature action. It does not create a certificate-backed PAdES signature.</div>
              {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}
              <Button className="h-14 w-full rounded-2xl font-black" disabled={loading || !consented || !signerName.trim() || !signerEmail.trim()} onClick={() => void sign()}>{loading ? 'Signing…' : <><CheckCircle2 className="mr-2 h-4 w-4" />Sign PDF with evidence</>}</Button>
              <Button variant="ghost" className="w-full" onClick={reset}>Choose another PDF</Button>
            </aside>
          </div>
        )}
      </div>
    </ToolWorkspace>
  );
}
