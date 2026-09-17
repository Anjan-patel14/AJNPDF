'use client';

import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Camera, ImagePlus, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Btn, Done, Err, ToolWorkspace, dl, safeOutputName, withProcessingActivity } from './_shared';

type ScanItem = { id: string; file: File; url: string };

function id() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

async function toJpeg(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`${file.name} could not be decoded.`));
      img.src = url;
    });
    const maxSide = 2600;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Camera image processing is unavailable in this browser.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('The scan could not be encoded.')), 'image/jpeg', 0.92));
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function ScanToPdf() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Blob | null>(null);

  const add = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).filter((file) => file.size > 0 && file.size <= 15 * 1024 * 1024).slice(0, Math.max(0, 30 - items.length));
    if (!next.length) {
      setError('Choose camera photos or images up to 15 MB each.');
      return;
    }
    setError('');
    setResult(null);
    setItems((current) => [...current, ...next.map((file) => ({ id: id(), file, url: URL.createObjectURL(file) }))]);
  };

  const remove = (target: string) => {
    setItems((current) => {
      const found = current.find((item) => item.id === target);
      if (found) URL.revokeObjectURL(found.url);
      return current.filter((item) => item.id !== target);
    });
  };

  const move = (index: number, direction: -1 | 1) => {
    setItems((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const createPdf = async () => {
    if (!items.length) return;
    setLoading(true);
    setError('');
    try {
      const blob = await withProcessingActivity('Scan to PDF', async () => {
        const pdf = await PDFDocument.create();
        pdf.setCreator('AJN PDF');
        pdf.setTitle('Scanned document');
        for (const item of items) {
          const image = await toJpeg(item.file);
          const embedded = await pdf.embedJpg(image.bytes);
          const landscape = image.width > image.height;
          const pageSize: [number, number] = landscape ? [841.89, 595.28] : [595.28, 841.89];
          const page = pdf.addPage(pageSize);
          const margin = 28;
          const scale = Math.min((pageSize[0] - margin * 2) / image.width, (pageSize[1] - margin * 2) / image.height);
          const width = image.width * scale;
          const height = image.height * scale;
          page.drawImage(embedded, { x: (pageSize[0] - width) / 2, y: (pageSize[1] - height) / 2, width, height });
        }
        const bytes = await pdf.save();
        return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      });
      setResult(blob);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The scans could not be converted.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    items.forEach((item) => URL.revokeObjectURL(item.url));
    setItems([]);
    setResult(null);
    setError('');
  };

  return (
    <ToolWorkspace title="Scan to PDF" description="Use your camera or gallery to create a PDF directly on this device." accent="#2563EB">
      {result ? (
        <Done msg="Scanned PDF created" onDownload={() => dl(result, safeOutputName('scanned-document', 'scan', '.pdf'))} shareFile={{ blob: result, name: 'scanned-document.pdf' }} onReset={reset} />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => cameraRef.current?.click()} className="flex min-h-24 items-center justify-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 text-sm font-black text-blue-700 transition hover:bg-blue-100">
              <Camera className="h-5 w-5" /> Scan with camera
            </button>
            <button type="button" onClick={() => uploadRef.current?.click()} className="flex min-h-24 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100">
              <ImagePlus className="h-5 w-5" /> Add from gallery
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { add(event.target.files); event.target.value = ''; }} />
            <input ref={uploadRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => { add(event.target.files); event.target.value = ''; }} />
          </div>

          {items.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((item, index) => (
                <article key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  {/* Blob URLs are local camera previews; next/image cannot optimize these ephemeral sources. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="Scanned page preview" className="h-16 w-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-slate-800">Page {index + 1}</p>
                    <p className="truncate text-[11px] font-semibold text-slate-500">{item.file.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" aria-label="Move page up" disabled={index === 0} onClick={() => move(index, -1)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label="Move page down" disabled={index === items.length - 1} onClick={() => move(index, 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label="Remove page" onClick={() => remove(item.id)} className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold leading-5 text-emerald-900">Camera and image processing stay in the active browser session. No server is required for this scanner workflow.</p>
          <Err msg={error} />
          <Btn onClick={createPdf} loading={loading} disabled={!items.length} full>Create PDF from {items.length || 0} page{items.length === 1 ? '' : 's'}</Btn>
        </div>
      )}
    </ToolWorkspace>
  );
}