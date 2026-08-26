'use client';

import { PDFDocument } from 'pdf-lib';

export type SignMode = 'pen' | 'pencil' | 'marker';
export interface SignatureInkStyle { color: string; width: number; opacity: number; }

export class SignatureDrawingEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  private mode: SignMode = 'pen';
  private style: SignatureInkStyle = { color: '#111827', width: 2.5, opacity: 1 };
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Signature canvas is unavailable.');
    this.ctx = context;
    this.applyStyle();
  }

  private applyStyle() {
    const defaults: Record<SignMode, { width: number; opacity: number }> = {
      pen: { width: 2.5, opacity: 1 },
      pencil: { width: 1.2, opacity: 0.68 },
      marker: { width: 9, opacity: 0.5 },
    };
    const base = defaults[this.mode];
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.style.color;
    this.ctx.lineWidth = Math.max(0.5, Math.min(24, this.style.width || base.width));
    this.ctx.globalAlpha = Math.max(0.1, Math.min(1, this.style.opacity || base.opacity));
  }

  setMode(mode: SignMode) {
    this.mode = mode;
    const defaults = { pen:[2.5,1], pencil:[1.2,.68], marker:[9,.5] } as const;
    this.style = { ...this.style, width: defaults[mode][0], opacity: defaults[mode][1] };
    this.applyStyle();
  }

  setStyle(style: Partial<SignatureInkStyle>) {
    this.style = { ...this.style, ...style };
    this.applyStyle();
  }

  private snapshot() {
    this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
    if (this.undoStack.length > 40) this.undoStack.shift();
    this.redoStack = [];
  }

  private getPos(e: MouseEvent | Touch) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }

  startDraw(e: MouseEvent | Touch) {
    this.snapshot();
    this.isDrawing = true;
    const pos = this.getPos(e);
    this.lastX = pos.x;
    this.lastY = pos.y;
  }

  continueDraw(e: MouseEvent | Touch) {
    if (!this.isDrawing) return;
    const pos = this.getPos(e);
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.lastX = pos.x;
    this.lastY = pos.y;
  }

  endDraw() { this.isDrawing = false; }
  clear() { this.snapshot(); this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
  undo() { const previous = this.undoStack.pop(); if (!previous) return; this.redoStack.push(this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height)); this.ctx.putImageData(previous,0,0); }
  redo() { const next = this.redoStack.pop(); if (!next) return; this.undoStack.push(this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height)); this.ctx.putImageData(next,0,0); }
  exportPNG() { return this.canvas.toDataURL('image/png'); }
}

export async function embedSignature(pdfFile: File, sigDataUrl: string, options: any) {
  const bytes = await pdfFile.arrayBuffer();
  const pdf = await PDFDocument.load(bytes.slice(0) as ArrayBuffer, { ignoreEncryption: true });
  const idx = Math.max(0, Math.min(pdf.getPageCount() - 1, (options.page || 1) - 1));
  const page = pdf.getPage(idx);
  const imgBytes = await fetch(sigDataUrl).then(r => r.arrayBuffer());
  const img = await pdf.embedPng(imgBytes);
  page.drawImage(img, { x: options.x || 100, y: options.y || 100, width: options.width || 150, height: options.height || 75 });
  const final = await pdf.save();
  return new Blob([final.buffer as ArrayBuffer], { type: 'application/pdf' });
}
