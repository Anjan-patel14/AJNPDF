/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import {
  AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, ChevronUp, Circle, Copy,
  Download, Eraser, FileText, Highlighter, ImagePlus, Italic, Loader2, MousePointer2,
  PenTool, Plus, Redo2, RotateCcw, RotateCw, Save, Search, ShieldCheck, Square,
  Trash2, Type, Underline, Undo2, X, ZoomIn, ZoomOut,
} from "lucide-react";
import { initPdfWorker } from "@/lib/pdfjs-worker";
import { validatePdfFile } from "@/lib/file-validation";

type Mode = "select" | "text" | "whiteout" | "highlight" | "rect" | "ellipse";
type TextAlign = "left" | "center" | "right";

type BaseObject = {
  id: string; pageInstanceId: string; x: number; y: number; width: number; height: number;
  rotation: number; opacity: number; locked?: boolean;
};
type FontMatch = "exact" | "family" | "fallback";
type TextRenderMode = "vector" | "visual-match";
type TextObject = BaseObject & {
  type: "text"; text: string; fontSize: number; color: string; background: string;
  bold: boolean; italic: boolean; underline: boolean; align: TextAlign;
  letterSpacing: number; source: "new" | "replacement";
  fontRef: string; fontFamily: string; loadedFontName: string;
  fontMatch: FontMatch; renderMode: TextRenderMode;
  ascent: number; descent: number; baselineOffset: number; horizontalScale: number;
};
type RectObject = BaseObject & {
  type: "whiteout" | "highlight" | "rect" | "ellipse";
  fill: string; stroke: string; strokeWidth: number;
};
type ImageObject = BaseObject & { type: "image" | "signature"; dataUrl: string };
type EditorObject = TextObject | RectObject | ImageObject;
type TextHit = {
  id: string; sourceIndex: number; text: string; x: number; y: number;
  width: number; height: number; fontSize: number;
  fontRef: string; fontFamily: string; loadedFontName: string;
  fontMatch: FontMatch; bold: boolean; italic: boolean;
  ascent: number; descent: number; horizontalScale: number;
};
type PageInstance = { instanceId: string; sourceIndex: number; rotation: number };
type Snapshot = { objects: EditorObject[]; pages: PageInstance[] };
type RestoreRecord = {
  fileBlob: Blob; fileName: string; fileLastModified: number; objects: EditorObject[];
  pages: PageInstance[]; savedAt: number;
};

const MAX_FILE_MB = 60;
const MAX_PAGES = 160;
const MIN_OBJECT_SIZE = 8;
const DB_NAME = "ajn-pdf-editor-lab-v2";
const STORE_NAME = "sessions";
const STORE_KEY = "active";
const DEFAULT_ZOOM = 1.1;

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const cloneObjects = (items: EditorObject[]) => items.map((item) => ({ ...item })) as EditorObject[];
const clonePages = (items: PageInstance[]) => items.map((item) => ({ ...item }));

const hexToRgb = (hex: string) => {
  const value = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(value, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const dataUrlToBytes = (dataUrl: string) => {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Invalid image data.");
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const openDb = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const saveRestoreRecord = async (record: RestoreRecord) => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record, STORE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
};
const loadRestoreRecord = async () => {
  const db = await openDb();
  const record = await new Promise<RestoreRecord | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(STORE_KEY);
    req.onsuccess = () => resolve(req.result as RestoreRecord | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return record;
};
const clearRestoreRecord = async () => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(STORE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
};

const normalizeImageToPng = async (file: File) => {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The selected image could not be decoded."));
      image.src = url;
    });
    const maxSide = 2600;
    const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image canvas is unavailable.");
    ctx.drawImage(image, 0, 0, width, height);
    return { dataUrl: canvas.toDataURL("image/png"), width, height };
  } finally { URL.revokeObjectURL(url); }
};

const fontNameFor = (item: TextObject) => {
  if (item.bold && item.italic) return StandardFonts.HelveticaBoldOblique;
  if (item.bold) return StandardFonts.HelveticaBold;
  if (item.italic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
};

const genericFontFamilies = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"]);
type FontDescriptor = { loadedFontName?: string; fontFamily?: string; fontRef?: string };
const safeFontToken = (value?: string) => (value ?? "").replace(/["'\\]/g, "").trim();
const cssFontFamily = (item: FontDescriptor) => {
  const candidates = [item.loadedFontName, item.fontRef, item.fontFamily]
    .map(safeFontToken)
    .filter(Boolean)
    .map((value) => genericFontFamilies.has(value.toLowerCase()) ? value : `"${value}"`);
  return [...new Set([...candidates, "Arial", "Helvetica", "sans-serif"])].join(", ");
};
const cssFont = (item: Pick<TextObject, "fontSize" | "bold" | "italic" | "loadedFontName" | "fontFamily">, size = item.fontSize) =>
  `${item.italic ? "italic" : "normal"} ${item.bold ? 700 : 400} ${Math.max(1, size)}px ${cssFontFamily(item)}`;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const colorDistance = (a: [number, number, number], b: [number, number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const rgbHex = (r: number, g: number, b: number) => `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")).join("")}`;

const rasterizeMatchedText = async (item: TextObject) => {
  const scale = clamp(Math.ceil(320 / Math.max(24, item.fontSize)), 3, 6);
  const widthPx = Math.max(8, Math.ceil(item.width * scale));
  const heightPx = Math.max(8, Math.ceil(item.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = widthPx; canvas.height = heightPx;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Matched-font canvas is unavailable.");
  ctx.clearRect(0, 0, widthPx, heightPx); ctx.textBaseline = "alphabetic"; ctx.fillStyle = item.color; ctx.font = cssFont(item, item.fontSize * scale);
  const lines = item.text.replace(/\r/g, "").split("\n");
  const lineHeight = item.fontSize * 1.22 * scale;
  const baseBaseline = item.source === "replacement" ? (item.height - item.baselineOffset) * scale : Math.min(heightPx - item.fontSize * 0.16 * scale, item.fontSize * 0.88 * scale);
  lines.forEach((line, lineIndex) => {
    const measured = Math.max(0.01, ctx.measureText(line).width);
    const requestedScale = clamp(item.horizontalScale, 0.35, 2.5);
    const withPdfScale = measured * requestedScale;
    const fitScale = withPdfScale > widthPx ? widthPx / withPdfScale : 1;
    const scaleX = requestedScale * fitScale;
    const finalWidth = measured * scaleX;
    let x = 0; if (item.align === "center") x = Math.max(0, (widthPx - finalWidth) / 2); if (item.align === "right") x = Math.max(0, widthPx - finalWidth);
    const y = baseBaseline + lineIndex * lineHeight;
    ctx.save(); ctx.translate(x, 0); ctx.scale(scaleX, 1); ctx.fillText(line, 0, y);
    if (item.underline) { ctx.strokeStyle = item.color; ctx.lineWidth = Math.max(1, item.fontSize * scale / 18); ctx.beginPath(); ctx.moveTo(0, y + Math.max(1, item.fontSize * scale * 0.08)); ctx.lineTo(measured, y + Math.max(1, item.fontSize * scale * 0.08)); ctx.stroke(); }
    ctx.restore();
  });
  return canvas.toDataURL("image/png");
};

function ToolbarButton({ active, disabled, title, onClick, children }: {
  active?: boolean; disabled?: boolean; title: string; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} aria-label={title} disabled={disabled} onClick={onClick}
      className={`inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl border px-2 text-xs font-extrabold transition ${active ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}>
      {children}
    </button>
  );
}

function SignaturePad({ onClose, onInsert }: { onClose: () => void; onInsert: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(620 * ratio); canvas.height = Math.round(220 * ratio);
    canvas.style.width = "100%"; canvas.style.height = "220px";
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.scale(ratio, ratio); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 620, 220);
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#111827"; ctx.lineWidth = 2.4;
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * 620, y: ((event.clientY - rect.top) / rect.height) * 220 };
  };
  const down = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId); drawingRef.current = true; lastRef.current = point(event);
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastRef.current) return;
    const next = point(event); const ctx = event.currentTarget.getContext("2d"); if (!ctx) return;
    ctx.beginPath(); ctx.moveTo(lastRef.current.x, lastRef.current.y); ctx.lineTo(next.x, next.y); ctx.stroke(); lastRef.current = next;
  };
  const up = () => { drawingRef.current = false; lastRef.current = null; };
  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore();
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 620 * ratio, 220 * ratio);
  };
  return (
    <div className="fixed inset-0 z-[300] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between"><div><h3 className="text-lg font-black">Draw signature</h3><p className="text-xs font-medium text-slate-500">Stays on this device.</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
        <canvas ref={canvasRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className="mt-5 touch-none rounded-2xl border border-dashed border-slate-300 bg-white" />
        <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={clear} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black">Clear</button><button type="button" onClick={() => { const canvas = canvasRef.current; if (canvas) onInsert(canvas.toDataURL("image/png")); }} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white">Insert signature</button></div>
      </div>
    </div>
  );
}

export default function PdfEditorLab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageSurfaceRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<any>(null);
  const fileBytesRef = useRef<ArrayBuffer | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("select");
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pages, setPages] = useState<PageInstance[]>([]);
  const [activePageId, setActivePageId] = useState("");
  const [pageSize, setPageSize] = useState({ width: 595, height: 842 });
  const [objects, setObjects] = useState<EditorObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textHits, setTextHits] = useState<Record<number, TextHit[]>>({});
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [clipboard, setClipboard] = useState<EditorObject | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [restoreRecord, setRestoreRecord] = useState<RestoreRecord | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dragDraft, setDragDraft] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);

  const activePage = useMemo(() => pages.find((page) => page.instanceId === activePageId) ?? pages[0], [pages, activePageId]);
  const pageObjects = useMemo(() => objects.filter((item) => item.pageInstanceId === activePage?.instanceId), [objects, activePage?.instanceId]);
  const selectedObject = useMemo(() => objects.find((item) => item.id === selectedId) ?? null, [objects, selectedId]);
  const currentTextHits = activePage ? textHits[activePage.sourceIndex] ?? [] : [];
  const searchResults = useMemo<Array<{ pageId: string; hit: TextHit }>>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const results: Array<{ pageId: string; hit: TextHit }> = [];
    pages.forEach((page) => {
      (textHits[page.sourceIndex] ?? []).forEach((hit) => {
        if (hit.text.toLowerCase().includes(query)) results.push({ pageId: page.instanceId, hit });
      });
    });
    return results;
  }, [pages, searchQuery, textHits]);
  const snapshot = useCallback((): Snapshot => ({ objects: cloneObjects(objects), pages: clonePages(pages) }), [objects, pages]);

  const commitMutation = useCallback((mutate: () => void) => {
    setHistory((current) => [...current.slice(-49), snapshot()]); setFuture([]); mutate();
  }, [snapshot]);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (!current.length) return current;
      const previous = current[current.length - 1];
      setFuture((next) => [snapshot(), ...next.slice(0, 49)]);
      setObjects(cloneObjects(previous.objects)); setPages(clonePages(previous.pages)); setSelectedId(null);
      if (!previous.pages.some((page) => page.instanceId === activePageId)) setActivePageId(previous.pages[0]?.instanceId ?? "");
      return current.slice(0, -1);
    });
  }, [activePageId, snapshot]);

  const redo = useCallback(() => {
    setFuture((current) => {
      if (!current.length) return current;
      const next = current[0];
      setHistory((past) => [...past.slice(-49), snapshot()]);
      setObjects(cloneObjects(next.objects)); setPages(clonePages(next.pages)); setSelectedId(null);
      if (!next.pages.some((page) => page.instanceId === activePageId)) setActivePageId(next.pages[0]?.instanceId ?? "");
      return current.slice(1);
    });
  }, [activePageId, snapshot]);

  const updateObject = useCallback((id: string, patch: Partial<EditorObject>, recordHistory = false) => {
    const run = () => setObjects((current) => current.map((item) => item.id === id ? ({ ...item, ...patch } as EditorObject) : item));
    if (recordHistory) commitMutation(run); else run();
  }, [commitMutation]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    commitMutation(() => { setObjects((current) => current.filter((item) => item.id !== selectedId)); setSelectedId(null); });
  }, [commitMutation, selectedId]);

  const copySelected = useCallback(() => { if (selectedObject) setClipboard({ ...selectedObject }); }, [selectedObject]);
  const pasteClipboard = useCallback(() => {
    if (!clipboard || !activePage) return;
    const next = { ...clipboard, id: uid(clipboard.type), pageInstanceId: activePage.instanceId, x: Math.min(pageSize.width - clipboard.width, clipboard.x + 12), y: Math.max(0, clipboard.y - 12) } as EditorObject;
    commitMutation(() => { setObjects((current) => [...current, next]); setSelectedId(next.id); });
  }, [activePage, clipboard, commitMutation, pageSize.width]);

  const duplicateSelected = useCallback(() => {
    if (!selectedObject || !activePage) return;
    const next = { ...selectedObject, id: uid(selectedObject.type), pageInstanceId: activePage.instanceId, x: Math.min(pageSize.width - selectedObject.width, selectedObject.x + 12), y: Math.max(0, selectedObject.y - 12) } as EditorObject;
    commitMutation(() => { setObjects((current) => [...current, next]); setSelectedId(next.id); });
  }, [activePage, commitMutation, pageSize.width, selectedObject]);

  useEffect(() => {
    void loadRestoreRecord().then((record) => {
      if (record && Date.now() - record.savedAt < 24 * 60 * 60 * 1000) setRestoreRecord(record);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!file || !pages.length) return;
    const timer = window.setTimeout(() => {
      void saveRestoreRecord({ fileBlob: file, fileName: file.name, fileLastModified: file.lastModified, objects: cloneObjects(objects), pages: clonePages(pages), savedAt: Date.now() })
        .then(() => setSavedAt(Date.now())).catch(() => undefined);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [file, objects, pages]);

  const extractPageModel = useCallback(async (pdf: any) => {
    const hitMap: Record<number, TextHit[]> = {}; const thumbMap: Record<number, string> = {};
    for (let sourceIndex = 0; sourceIndex < pdf.numPages; sourceIndex += 1) {
      const page = await pdf.getPage(sourceIndex + 1);
      const viewport = page.getViewport({ scale: 0.18 }); const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = Math.max(1, Math.floor(viewport.width)); thumbCanvas.height = Math.max(1, Math.floor(viewport.height));
      const thumbCtx = thumbCanvas.getContext("2d");
      if (thumbCtx) { await page.render({ canvasContext: thumbCtx, viewport }).promise; if (sourceIndex < 80) thumbMap[sourceIndex] = thumbCanvas.toDataURL("image/jpeg", 0.58); }
      else await page.getOperatorList();

      const content = await page.getTextContent(); const hits: TextHit[] = [];
      const styles = (content.styles || {}) as Record<string, { fontFamily?: string; ascent?: number; descent?: number; vertical?: boolean }>;
      const commonObjs = (page as any).commonObjs;
      (content.items as any[]).forEach((item, index) => {
        if (!("str" in item) || !String(item.str).trim()) return;
        const transform = item.transform as number[];
        const fontSize = Math.max(6, Math.hypot(transform[2] ?? 0, transform[3] ?? 0));
        const style = styles[String(item.fontName)] || {};
        let fontObj: any = null;
        try { fontObj = commonObjs?.get?.(item.fontName) || null; } catch { fontObj = null; }
        const loadedFontName = String(fontObj?.loadedName || "").trim();
        const fontFamily = String(fontObj?.name || fontObj?.fallbackName || style.fontFamily || "sans-serif").trim();
        const fontMeta = `${item.fontName || ""} ${loadedFontName} ${fontFamily}`.toLowerCase();
        const bold = /(bold|black|heavy|demi|semibold|semi-bold)/.test(fontMeta), italic = /(italic|oblique)/.test(fontMeta);
        const ascent = Number.isFinite(style.ascent) ? Number(style.ascent) : 0.82, descent = Number.isFinite(style.descent) ? Number(style.descent) : -0.20;
        const width = Math.max(3, Number(item.width) || String(item.str).length * fontSize * 0.45), height = Math.max(fontSize * Math.max(0.7, ascent - descent), Number(item.height) || fontSize);
        const familyLower = fontFamily.toLowerCase();
        const loadedAvailable = Boolean(loadedFontName) && typeof document !== "undefined" && Boolean(document.fonts?.check?.(`12px "${safeFontToken(loadedFontName)}"`));
        const refAvailable = Boolean(item.fontName) && typeof document !== "undefined" && Boolean(document.fonts?.check?.(`12px "${safeFontToken(String(item.fontName))}"`));
        const familySpecific = Boolean(fontFamily) && !genericFontFamilies.has(familyLower);
        const familyAvailable = familySpecific && typeof document !== "undefined" && Boolean(document.fonts?.check?.(`12px "${safeFontToken(fontFamily)}"`));
        const fontMatch: FontMatch = loadedAvailable || refAvailable ? "exact" : familyAvailable ? "family" : "fallback";
        const measureCanvas = document.createElement("canvas"), measureCtx = measureCanvas.getContext("2d"); let horizontalScale = 1;
        if (measureCtx) { measureCtx.font = `${italic ? "italic" : "normal"} ${bold ? 700 : 400} ${fontSize}px ${cssFontFamily({ loadedFontName, fontFamily })}`; const measured = measureCtx.measureText(String(item.str)).width; if (measured > 0.1) horizontalScale = clamp(width / measured, 0.35, 2.5); }
        hits.push({ id: `hit-${sourceIndex}-${index}`, sourceIndex, text: String(item.str), x: Number(transform[4]) || 0, y: Number(transform[5]) || 0, width, height, fontSize, fontRef: String(item.fontName || ""), fontFamily, loadedFontName, fontMatch, bold, italic, ascent, descent, horizontalScale });
      });
      hitMap[sourceIndex] = hits;
      if (sourceIndex % 4 === 0) { setStatus(`Analysing fonts on page ${sourceIndex + 1} of ${pdf.numPages}…`); await new Promise((resolve) => window.setTimeout(resolve, 0)); }
    }
    setTextHits(hitMap); setThumbnails(thumbMap);
  }, []);

  const openFile = useCallback(async (nextFile: File, restore?: RestoreRecord) => {
    setLoading(true); setError(""); setStatus("Validating PDF…");
    try {
      const validation = await validatePdfFile(nextFile, MAX_FILE_MB); if (validation) throw new Error(validation);
      initPdfWorker(); const bytes = await nextFile.arrayBuffer(); fileBytesRef.current = bytes.slice(0);
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise;
      if (pdf.numPages > MAX_PAGES) throw new Error(`AJN PDF Editor supports up to ${MAX_PAGES} pages per session.`);
      pdfRef.current = pdf; setFile(nextFile);
      const initialPages = restore?.pages?.length ? clonePages(restore.pages) : Array.from({ length: pdf.numPages }, (_, sourceIndex) => ({ instanceId: uid(`page-${sourceIndex + 1}`), sourceIndex, rotation: 0 }));
      setPages(initialPages); setActivePageId(initialPages[0]?.instanceId ?? ""); setObjects(restore ? cloneObjects(restore.objects) : []);
      setHistory([]); setFuture([]); setSelectedId(null); setStatus("Reading text and thumbnails…"); await extractPageModel(pdf); setStatus("Editor ready");
      if (restore) setRestoreRecord(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The PDF could not be opened."); setFile(null); pdfRef.current = null; fileBytesRef.current = null;
    } finally { setLoading(false); }
  }, [extractPageModel]);

  const restoreSession = async () => {
    if (!restoreRecord) return;
    const restoredFile = new File([restoreRecord.fileBlob], restoreRecord.fileName, { type: "application/pdf", lastModified: restoreRecord.fileLastModified });
    await openFile(restoredFile, restoreRecord);
  };

  useEffect(() => {
    if (!activePage || !pdfRef.current) return;
    let cancelled = false;
    const render = async () => {
      try {
        const page = await pdfRef.current.getPage(activePage.sourceIndex + 1); const baseViewport = page.getViewport({ scale: 1 });
        if (!cancelled) setPageSize({ width: baseViewport.width, height: baseViewport.height });
        const viewport = page.getViewport({ scale: zoom }); const canvas = canvasRef.current; if (!canvas) return;
        const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        canvas.width = Math.floor(viewport.width * ratio); canvas.height = Math.floor(viewport.height * ratio); canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`;
        const ctx = canvas.getContext("2d"); if (!ctx) return; ctx.setTransform(ratio, 0, 0, ratio, 0, 0); await page.render({ canvasContext: ctx, viewport }).promise;
      } catch { if (!cancelled) setError("This page could not be rendered."); }
    };
    void render(); return () => { cancelled = true; };
  }, [activePage, zoom]);

  const screenToPdf = useCallback((clientX: number, clientY: number) => {
    const surface = pageSurfaceRef.current; if (!surface) return { x: 0, y: 0 }; const rect = surface.getBoundingClientRect();
    const x = Math.max(0, Math.min(pageSize.width, (clientX - rect.left) / zoom));
    const fromTop = Math.max(0, Math.min(pageSize.height, (clientY - rect.top) / zoom));
    return { x, y: pageSize.height - fromTop };
  }, [pageSize.height, pageSize.width, zoom]);

  const sampleBackground = useCallback((hit: TextHit) => {
    const canvas = canvasRef.current; if (!canvas) return "#ffffff"; const ctx = canvas.getContext("2d"); if (!ctx) return "#ffffff";
    const cssWidth = Number.parseFloat(canvas.style.width || `${canvas.width}`); const cssHeight = Number.parseFloat(canvas.style.height || `${canvas.height}`);
    const sx = canvas.width / cssWidth, sy = canvas.height / cssHeight;
    const left = Math.max(0, Math.floor(hit.x * zoom * sx)), top = Math.max(0, Math.floor((pageSize.height - hit.y - hit.height) * zoom * sy));
    const right = Math.min(canvas.width - 1, Math.floor((hit.x + hit.width) * zoom * sx)), bottom = Math.min(canvas.height - 1, Math.floor((pageSize.height - hit.y) * zoom * sy));
    const points = [[left, top], [right, top], [left, bottom], [right, bottom]]; let r = 0, g = 0, b = 0, count = 0;
    points.forEach(([px, py]) => { try { const d = ctx.getImageData(px, py, 1, 1).data; r += d[0]; g += d[1]; b += d[2]; count += 1; } catch { /* ignore */ } });
    if (!count) return "#ffffff"; const h = (v: number) => Math.round(v / count).toString(16).padStart(2, "0"); return `#${h(r)}${h(g)}${h(b)}`;
  }, [pageSize.height, zoom]);

  const sampleTextColor = useCallback((hit: TextHit, backgroundHex: string) => {
    const canvas = canvasRef.current; if (!canvas) return "#111827"; const ctx = canvas.getContext("2d"); if (!ctx) return "#111827";
    const cssWidth = Number.parseFloat(canvas.style.width || `${canvas.width}`), cssHeight = Number.parseFloat(canvas.style.height || `${canvas.height}`), scaleX = canvas.width / cssWidth, scaleY = canvas.height / cssHeight;
    const left = clamp(Math.floor(hit.x * zoom * scaleX), 0, canvas.width - 1), top = clamp(Math.floor((pageSize.height - hit.y - hit.height) * zoom * scaleY), 0, canvas.height - 1);
    const width = clamp(Math.ceil(hit.width * zoom * scaleX), 1, Math.min(canvas.width - left, 600)), height = clamp(Math.ceil(hit.height * zoom * scaleY), 1, Math.min(canvas.height - top, 240));
    try {
      const pixels = ctx.getImageData(left, top, width, height).data;
      const bg = [Number.parseInt(backgroundHex.slice(1, 3), 16), Number.parseInt(backgroundHex.slice(3, 5), 16), Number.parseInt(backgroundHex.slice(5, 7), 16)] as [number, number, number];
      const candidates: Array<[number, number, number]> = [], stride = Math.max(1, Math.floor((width * height) / 4500));
      for (let pixel = 0; pixel < width * height; pixel += stride) { const offset = pixel * 4; if (pixels[offset + 3] < 100) continue; const color: [number, number, number] = [pixels[offset], pixels[offset + 1], pixels[offset + 2]]; if (colorDistance(color, bg) >= 42) candidates.push(color); }
      if (!candidates.length) return "#111827";
      candidates.sort((a, b) => colorDistance(b, bg) - colorDistance(a, bg)); const strongest = candidates.slice(0, Math.max(4, Math.ceil(candidates.length * 0.28)));
      const totals = strongest.reduce((sum, color) => [sum[0] + color[0], sum[1] + color[1], sum[2] + color[2]], [0, 0, 0]);
      return rgbHex(totals[0] / strongest.length, totals[1] / strongest.length, totals[2] / strongest.length);
    } catch { return "#111827"; }
  }, [pageSize.height, zoom]);

  const replaceTextHit = useCallback((hit: TextHit) => {
    if (!activePage) return;
    const background = sampleBackground(hit), color = sampleTextColor(hit, background), baselineOffset = Math.max(0, -hit.descent * hit.fontSize);
    const visualHeight = Math.max(hit.height, hit.fontSize * Math.max(0.8, hit.ascent - hit.descent)), objectY = Math.max(0, hit.y - baselineOffset);
    const whiteout: RectObject = { id: uid("whiteout"), type: "whiteout", pageInstanceId: activePage.instanceId, x: Math.max(0, hit.x - 1.5), y: Math.max(0, objectY - 1.5), width: Math.min(pageSize.width - Math.max(0, hit.x - 1.5), hit.width + 3), height: visualHeight + 3, rotation: 0, opacity: 1, fill: background, stroke: background, strokeWidth: 0 };
    const text: TextObject = { id: uid("replacement"), type: "text", pageInstanceId: activePage.instanceId, x: hit.x, y: objectY, width: Math.max(hit.width, 32), height: visualHeight, rotation: 0, opacity: 1, text: hit.text, fontSize: Math.max(6, Math.min(96, hit.fontSize)), color, background: "transparent", bold: hit.bold, italic: hit.italic, underline: false, align: "left", letterSpacing: 0, source: "replacement", fontRef: hit.fontRef, fontFamily: hit.fontFamily, loadedFontName: hit.loadedFontName, fontMatch: hit.fontMatch, renderMode: "visual-match", ascent: hit.ascent, descent: hit.descent, baselineOffset, horizontalScale: hit.horizontalScale };
    commitMutation(() => { setObjects((current) => [...current, whiteout, text]); setSelectedId(text.id); setMode("select"); });
  }, [activePage, commitMutation, pageSize.width, sampleBackground, sampleTextColor]);

  const beginSurfaceAction = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activePage || event.button !== 0) return;
    const point = screenToPdf(event.clientX, event.clientY);
    if (mode === "text") {
      const next: TextObject = { id: uid("text"), type: "text", pageInstanceId: activePage.instanceId, x: point.x, y: Math.max(0, point.y - 18), width: 180, height: 28, rotation: 0, opacity: 1, text: "Edit text", fontSize: 14, color: "#111827", background: "transparent", bold: false, italic: false, underline: false, align: "left", letterSpacing: 0, source: "new", fontRef: "manual", fontFamily: "Helvetica", loadedFontName: "", fontMatch: "family", renderMode: "vector", ascent: 0.82, descent: -0.20, baselineOffset: 3, horizontalScale: 1 };
      commitMutation(() => { setObjects((current) => [...current, next]); setSelectedId(next.id); setMode("select"); }); return;
    }
    if (["whiteout", "highlight", "rect", "ellipse"].includes(mode)) {
      event.currentTarget.setPointerCapture(event.pointerId); setDragDraft({ startX: point.x, startY: point.y, x: point.x, y: point.y }); return;
    }
    if (mode === "select") setSelectedId(null);
  };
  const moveSurfaceAction = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragDraft) return; const point = screenToPdf(event.clientX, event.clientY); setDragDraft((current) => current ? { ...current, x: point.x, y: point.y } : null);
  };
  const endSurfaceAction = () => {
    if (!dragDraft || !activePage) return;
    const x = Math.min(dragDraft.startX, dragDraft.x), y = Math.min(dragDraft.startY, dragDraft.y);
    const width = Math.max(MIN_OBJECT_SIZE, Math.abs(dragDraft.x - dragDraft.startX)), height = Math.max(MIN_OBJECT_SIZE, Math.abs(dragDraft.y - dragDraft.startY));
    const type = mode === "whiteout" ? "whiteout" : mode === "highlight" ? "highlight" : mode;
    if (type !== "whiteout" && type !== "highlight" && type !== "rect" && type !== "ellipse") { setDragDraft(null); return; }
    const item: RectObject = { id: uid(type), type, pageInstanceId: activePage.instanceId, x, y, width, height, rotation: 0, opacity: type === "highlight" ? 0.35 : 1, fill: type === "whiteout" ? "#ffffff" : type === "highlight" ? "#fde047" : "#ffffff", stroke: type === "whiteout" || type === "highlight" ? "transparent" : "#2563eb", strokeWidth: type === "rect" || type === "ellipse" ? 1.5 : 0 };
    setDragDraft(null); commitMutation(() => { setObjects((current) => [...current, item]); setSelectedId(item.id); setMode("select"); });
  };

  const addImage = async (picked: File) => {
    if (!activePage) return; setError("");
    try {
      if (picked.size > 15 * 1024 * 1024) throw new Error("Image must be 15 MB or smaller.");
      const normalized = await normalizeImageToPng(picked); const width = Math.min(220, pageSize.width * 0.45); const height = Math.max(40, width * normalized.height / normalized.width);
      const next: ImageObject = { id: uid("image"), type: "image", pageInstanceId: activePage.instanceId, x: Math.max(20, (pageSize.width - width) / 2), y: Math.max(20, (pageSize.height - height) / 2), width, height, rotation: 0, opacity: 1, dataUrl: normalized.dataUrl };
      commitMutation(() => { setObjects((current) => [...current, next]); setSelectedId(next.id); });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Image could not be added."); }
  };
  const addSignature = (dataUrl: string) => {
    if (!activePage) return; const width = Math.min(210, pageSize.width * 0.4), height = 75;
    const next: ImageObject = { id: uid("signature"), type: "signature", pageInstanceId: activePage.instanceId, x: Math.max(20, (pageSize.width - width) / 2), y: Math.max(20, pageSize.height * 0.2), width, height, rotation: 0, opacity: 1, dataUrl };
    commitMutation(() => { setObjects((current) => [...current, next]); setSelectedId(next.id); setSignatureOpen(false); });
  };

  const movePage = (direction: -1 | 1) => {
    if (!activePage) return; const index = pages.findIndex((page) => page.instanceId === activePage.instanceId), target = index + direction; if (target < 0 || target >= pages.length) return;
    commitMutation(() => setPages((current) => { const next = [...current]; const [picked] = next.splice(index, 1); next.splice(target, 0, picked); return next; }));
  };
  const deletePage = () => {
    if (!activePage || pages.length <= 1) { setError("A PDF must keep at least one page."); return; }
    const index = pages.findIndex((page) => page.instanceId === activePage.instanceId), remaining = pages.filter((page) => page.instanceId !== activePage.instanceId);
    commitMutation(() => { setPages(remaining); setObjects((current) => current.filter((item) => item.pageInstanceId !== activePage.instanceId)); setActivePageId(remaining[Math.min(index, remaining.length - 1)]?.instanceId ?? ""); setSelectedId(null); });
  };
  const duplicatePage = () => {
    if (!activePage) return; const index = pages.findIndex((page) => page.instanceId === activePage.instanceId); const duplicate: PageInstance = { ...activePage, instanceId: uid("page-copy") };
    const clones = objects.filter((item) => item.pageInstanceId === activePage.instanceId).map((item) => ({ ...item, id: uid(item.type), pageInstanceId: duplicate.instanceId })) as EditorObject[];
    commitMutation(() => { setPages((current) => { const next = [...current]; next.splice(index + 1, 0, duplicate); return next; }); setObjects((current) => [...current, ...clones]); setActivePageId(duplicate.instanceId); setSelectedId(null); });
  };
  const rotatePage = (delta: number) => {
    if (!activePage) return; commitMutation(() => setPages((current) => current.map((page) => page.instanceId === activePage.instanceId ? { ...page, rotation: (page.rotation + delta + 360) % 360 } : page)));
  };

  const drawSpacedText = useCallback(async (page: any, item: TextObject, font: any) => {
    const lines = item.text.replace(/\r/g, "").split("\n"), lineHeight = item.fontSize * 1.22, maxLines = Math.max(1, Math.floor(item.height / lineHeight) + 1);
    for (let lineIndex = 0; lineIndex < Math.min(lines.length, maxLines); lineIndex += 1) {
      const line = lines[lineIndex], glyphWidths = [...line].map((char) => font.widthOfTextAtSize(char, item.fontSize));
      const natural = glyphWidths.reduce((sum: number, width: number) => sum + width, 0), spaced = natural + Math.max(0, line.length - 1) * item.letterSpacing;
      let x = item.x; if (item.align === "center") x += Math.max(0, (item.width - spaced) / 2); if (item.align === "right") x += Math.max(0, item.width - spaced);
      const firstBaseline = item.source === "replacement" ? item.y + item.baselineOffset : item.y + item.height - item.fontSize * 0.18; const y = firstBaseline - lineIndex * lineHeight; let cursor = x;
      for (let charIndex = 0; charIndex < line.length; charIndex += 1) { const char = line[charIndex]; page.drawText(char, { x: cursor, y, size: item.fontSize, font, color: hexToRgb(item.color), opacity: item.opacity }); cursor += glyphWidths[charIndex] + item.letterSpacing; }
      if (item.underline) page.drawLine({ start: { x, y: y - 1.5 }, end: { x: x + spaced, y: y - 1.5 }, thickness: Math.max(0.6, item.fontSize / 18), color: hexToRgb(item.color), opacity: item.opacity });
    }
  }, []);

  const exportPdf = useCallback(async () => {
    if (!fileBytesRef.current || !pages.length) return; setExporting(true); setError(""); setStatus("Preparing edited PDF…");
    try {
      const source = await PDFDocument.load(fileBytesRef.current.slice(0), { ignoreEncryption: true, updateMetadata: false }); const output = await PDFDocument.create(); const fontCache = new Map<string, any>();
      for (let index = 0; index < pages.length; index += 1) {
        const plan = pages[index]; setStatus(`Building page ${index + 1} of ${pages.length}…`); const [copied] = await output.copyPages(source, [plan.sourceIndex]); output.addPage(copied);
        if (plan.rotation) copied.setRotation(degrees(((copied.getRotation().angle || 0) + plan.rotation) % 360));
        const ops = objects.filter((item) => item.pageInstanceId === plan.instanceId);
        const rectangles = ops.filter((item): item is RectObject => item.type === "whiteout" || item.type === "highlight" || item.type === "rect" || item.type === "ellipse");
        const images = ops.filter((item): item is ImageObject => item.type === "image" || item.type === "signature");
        const texts = ops.filter((item): item is TextObject => item.type === "text");
        for (const item of rectangles) {
          if (item.type === "ellipse") copied.drawEllipse({ x: item.x + item.width / 2, y: item.y + item.height / 2, xScale: item.width / 2, yScale: item.height / 2, color: item.fill === "transparent" ? undefined : hexToRgb(item.fill), borderColor: item.stroke === "transparent" ? undefined : hexToRgb(item.stroke), borderWidth: item.strokeWidth, opacity: item.opacity });
          else copied.drawRectangle({ x: item.x, y: item.y, width: item.width, height: item.height, color: item.fill === "transparent" ? undefined : hexToRgb(item.fill), borderColor: item.stroke === "transparent" ? undefined : hexToRgb(item.stroke), borderWidth: item.strokeWidth, opacity: item.opacity });
        }
        for (const item of images) { const embedded = await output.embedPng(dataUrlToBytes(item.dataUrl)); copied.drawImage(embedded, { x: item.x, y: item.y, width: item.width, height: item.height, rotate: degrees(item.rotation), opacity: item.opacity }); }
        for (const item of texts) {
          if (item.background !== "transparent") copied.drawRectangle({ x: item.x, y: item.y, width: item.width, height: item.height, color: hexToRgb(item.background), opacity: item.opacity });
          if (item.renderMode === "visual-match" && item.source === "replacement") { const matchedPng = await rasterizeMatchedText(item); const embedded = await output.embedPng(dataUrlToBytes(matchedPng)); copied.drawImage(embedded, { x: item.x, y: item.y, width: item.width, height: item.height, opacity: item.opacity }); }
          else { const name = fontNameFor(item); let font = fontCache.get(name); if (!font) { font = await output.embedFont(name); fontCache.set(name, font); } await drawSpacedText(copied, item, font); }
        }
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
      output.setProducer("AJN PDF Browser Editor"); output.setCreator("AJN PDF"); setStatus("Serializing PDF…");
      const bytes = await output.save({ useObjectStreams: true, addDefaultPage: false });
      if (bytes.length < 64 || String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-") throw new Error("Output validation failed before download.");
      setStatus("Validating result…"); initPdfWorker(); const check = await pdfjsLib.getDocument({ data: bytes.slice() }).promise; if (check.numPages !== pages.length) throw new Error("Output page-count validation failed."); await check.getPage(1);
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), url = URL.createObjectURL(blob), anchor = document.createElement("a"); anchor.href = url; anchor.download = `${file?.name.replace(/\.pdf$/i, "") || "document"}_edited_AJN.pdf`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      setStatus("Edited PDF downloaded"); await clearRestoreRecord().catch(() => undefined); setSavedAt(null);
    } catch (caught) { setError(`${caught instanceof Error ? caught.message : "The edited PDF could not be exported."} Your editor session has been kept.`); setStatus("Export stopped safely"); }
    finally { setExporting(false); }
  }, [drawSpacedText, file?.name, objects, pages]);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null, typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable, key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === "y") { event.preventDefault(); redo(); return; }
      if ((event.ctrlKey || event.metaKey) && key === "f") { event.preventDefault(); setSearchOpen(true); return; }
      if ((event.ctrlKey || event.metaKey) && key === "s") { event.preventDefault(); if (!exporting) void exportPdf(); return; }
      if (typing) return;
      if ((event.ctrlKey || event.metaKey) && key === "c") { event.preventDefault(); copySelected(); }
      else if ((event.ctrlKey || event.metaKey) && key === "v") { event.preventDefault(); pasteClipboard(); }
      else if ((event.ctrlKey || event.metaKey) && key === "d") { event.preventDefault(); duplicateSelected(); }
      else if (event.key === "Delete" || event.key === "Backspace") { if (selectedId) { event.preventDefault(); deleteSelected(); } }
      else if (event.key === "Escape") { setSelectedId(null); setMode("select"); }
      else if (selectedObject && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault(); const amount = event.shiftKey ? 10 : 1, dx = event.key === "ArrowLeft" ? -amount : event.key === "ArrowRight" ? amount : 0, dy = event.key === "ArrowDown" ? -amount : event.key === "ArrowUp" ? amount : 0;
        updateObject(selectedObject.id, { x: Math.max(0, Math.min(pageSize.width - selectedObject.width, selectedObject.x + dx)), y: Math.max(0, Math.min(pageSize.height - selectedObject.height, selectedObject.y + dy)) }, true);
      }
    };
    window.addEventListener("keydown", handle); return () => window.removeEventListener("keydown", handle);
  }, [copySelected, deleteSelected, duplicateSelected, exporting, exportPdf, pageSize.height, pageSize.width, pasteClipboard, redo, selectedId, selectedObject, undo, updateObject]);

  const renderObject = (item: EditorObject) => {
    const selected = selectedId === item.id;
    const left = item.x * zoom, top = (pageSize.height - item.y - item.height) * zoom, width = item.width * zoom, height = item.height * zoom;
    const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (mode !== "select" || item.locked) return;
      event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); setSelectedId(item.id);
      const startClientX = event.clientX, startClientY = event.clientY, startX = item.x, startY = item.y, before = snapshot(); let moved = false;
      const move = (moveEvent: PointerEvent) => {
        moved = true; const dx = (moveEvent.clientX - startClientX) / zoom, dy = -(moveEvent.clientY - startClientY) / zoom;
        setObjects((current) => current.map((object) => object.id === item.id ? ({ ...object, x: Math.max(0, Math.min(pageSize.width - object.width, startX + dx)), y: Math.max(0, Math.min(pageSize.height - object.height, startY + dy)) } as EditorObject) : object));
      };
      const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); if (moved) { setHistory((current) => [...current.slice(-49), before]); setFuture([]); } };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up, { once: true });
    };
    const resizeDown = (event: React.PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation(); const startClientX = event.clientX, startClientY = event.clientY, startWidth = item.width, startHeight = item.height, before = snapshot(); let moved = false;
      const move = (moveEvent: PointerEvent) => {
        moved = true; const dw = (moveEvent.clientX - startClientX) / zoom, dh = (moveEvent.clientY - startClientY) / zoom;
        setObjects((current) => current.map((object) => object.id === item.id ? ({ ...object, width: Math.max(MIN_OBJECT_SIZE, Math.min(pageSize.width - object.x, startWidth + dw)), height: Math.max(MIN_OBJECT_SIZE, Math.min(pageSize.height - object.y, startHeight + dh)) } as EditorObject) : object));
      };
      const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); if (moved) { setHistory((current) => [...current.slice(-49), before]); setFuture([]); } };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up, { once: true });
    };
    return (
      <div key={item.id} role="button" tabIndex={0} aria-label={`Select ${item.type}`} onPointerDown={pointerDown} onClick={(event) => { event.stopPropagation(); setSelectedId(item.id); }}
        style={{ position: "absolute", left, top, width, height, opacity: item.opacity, transform: `rotate(${item.rotation}deg)`, transformOrigin: "center", cursor: item.locked ? "default" : "move", border: selected ? "2px solid #2563eb" : "1px solid transparent", zIndex: item.type === "whiteout" ? 20 : item.type === "highlight" ? 24 : 30, boxSizing: "border-box" }}>
        {item.type === "text" && <div style={{ width: item.source === "replacement" ? `${100 / Math.max(0.35, item.horizontalScale)}%` : "100%", height: "100%", overflow: "hidden", whiteSpace: "pre-wrap", fontFamily: cssFontFamily(item), fontSize: item.fontSize * zoom, lineHeight: 1.22, fontWeight: item.bold ? 700 : 400, fontStyle: item.italic ? "italic" : "normal", textDecoration: item.underline ? "underline" : "none", color: item.color, background: item.background === "transparent" ? "transparent" : item.background, textAlign: item.align, letterSpacing: item.letterSpacing * zoom, transform: item.source === "replacement" ? `scaleX(${item.horizontalScale})` : undefined, transformOrigin: "left top", pointerEvents: "none" }}>{item.text}</div>}
        {(item.type === "whiteout" || item.type === "highlight" || item.type === "rect") && <div style={{ width: "100%", height: "100%", background: item.fill, border: item.stroke === "transparent" ? "none" : `${Math.max(1, item.strokeWidth * zoom)}px solid ${item.stroke}`, pointerEvents: "none" }} />}
        {item.type === "ellipse" && <div style={{ width: "100%", height: "100%", borderRadius: "9999px", background: item.fill, border: item.stroke === "transparent" ? "none" : `${Math.max(1, item.strokeWidth * zoom)}px solid ${item.stroke}`, pointerEvents: "none" }} />}
        {(item.type === "image" || item.type === "signature") && <img src={item.dataUrl} alt="" className="h-full w-full select-none object-contain" draggable={false} />}
        {selected && !item.locked && <button type="button" aria-label="Resize selected object" onPointerDown={resizeDown} className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-blue-600 shadow" />}
      </div>
    );
  };

  const draftRect = useMemo(() => {
    if (!dragDraft) return null; const x = Math.min(dragDraft.startX, dragDraft.x), y = Math.min(dragDraft.startY, dragDraft.y), width = Math.abs(dragDraft.x - dragDraft.startX), height = Math.abs(dragDraft.y - dragDraft.startY);
    return { left: x * zoom, top: (pageSize.height - y - height) * zoom, width: width * zoom, height: height * zoom };
  }, [dragDraft, pageSize.height, zoom]);

  const resetEditor = async () => {
    setFile(null); fileBytesRef.current = null; pdfRef.current = null; setPages([]); setObjects([]); setTextHits({}); setThumbnails({}); setSelectedId(null); setActivePageId(""); setHistory([]); setFuture([]); setError(""); setStatus(""); await clearRestoreRecord().catch(() => undefined); setSavedAt(null);
  };

  if (!file) {
    return (
      <main className="min-h-screen bg-[#f8fafc] px-4 py-10 text-slate-950">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-blue-600"><ShieldCheck className="h-4 w-4" /> Browser-only PDF editor</div><h1 className="mt-3 text-3xl font-black tracking-[-.04em] md:text-5xl">AJN PDF Editor</h1><p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600 md:text-base">Edit dates, names, numbers, text, images, signatures and pages without uploading the PDF to a processing server.</p></div>
            <a href="https://ajn.buzz" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-black text-emerald-800"><ImagePlus className="h-4 w-4" /> Image Tools ↗</a>
          </header>

          {restoreRecord && <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-amber-950">Local unfinished editing session found</p><p className="text-xs font-medium text-amber-800">{restoreRecord.fileName}</p></div><div className="flex gap-2"><button type="button" onClick={() => { setRestoreRecord(null); void clearRestoreRecord(); }} className="rounded-xl border border-amber-300 px-4 py-2 text-xs font-black text-amber-900">Discard</button><button type="button" onClick={() => void restoreSession()} className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white">Restore</button></div></section>}

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="group min-h-[390px] rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center shadow-sm transition hover:border-blue-400 hover:bg-blue-50/30">
              <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => { const picked = event.target.files?.[0]; if (picked) void openFile(picked); event.currentTarget.value = ""; }} />
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-100 transition group-hover:-translate-y-1">{loading ? <Loader2 className="h-9 w-9 animate-spin" /> : <FileText className="h-9 w-9" />}</div>
              <h2 className="mt-7 text-2xl font-black">Choose a PDF to edit</h2><p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-6 text-slate-500">Up to {MAX_FILE_MB} MB and {MAX_PAGES} pages. Text/font analysis, editing and final export run in the browser.</p><span className="mt-7 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-xs font-black text-white">Browse PDF</span>{status && <p className="mt-5 text-xs font-bold text-blue-600">{status}</p>}
            </button>
            <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-black">Professional editing features</h2><div className="mt-5 grid gap-3 text-sm font-semibold text-slate-600">{[
              "Click detected text and create an editable replacement", "Manual whiteout, highlight, rectangle and ellipse", "Add, move, resize and format text", "Insert images and drawn signatures", "Undo / redo, copy / paste / duplicate", "Search text across the document", "Reorder, duplicate, delete and rotate pages", "Local IndexedDB recovery", "Browser-only export with PDF.js validation",
            ].map((item) => <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" /><span>{item}</span></div>)}</div></aside>
          </section>
          {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#e5e7eb] text-slate-950">
      {signatureOpen && <SignaturePad onClose={() => setSignatureOpen(false)} onInsert={addSignature} />}
      <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const picked = event.target.files?.[0]; if (picked) void addImage(picked); event.currentTarget.value = ""; }} />

      <header className="sticky top-0 z-[100] border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="flex min-h-16 flex-wrap items-center gap-2 px-3 py-2 md:px-5">
          <div className="mr-2 flex items-center gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><FileText className="h-5 w-5" /></div><div className="hidden sm:block"><p className="text-sm font-black">AJN PDF Editor</p><p className="max-w-[180px] truncate text-[10px] font-bold text-slate-400">{file.name}</p></div></div>
          <div className="flex flex-wrap items-center gap-1">
            <ToolbarButton title="Select" active={mode === "select"} onClick={() => setMode("select")}><MousePointer2 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Add text" active={mode === "text"} onClick={() => setMode("text")}><Type className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Whiteout / erase area" active={mode === "whiteout"} onClick={() => setMode("whiteout")}><Eraser className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Highlight area" active={mode === "highlight"} onClick={() => setMode("highlight")}><Highlighter className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Rectangle" active={mode === "rect"} onClick={() => setMode("rect")}><Square className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Ellipse" active={mode === "ellipse"} onClick={() => setMode("ellipse")}><Circle className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Insert image" onClick={() => imageInputRef.current?.click()}><ImagePlus className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Draw signature" onClick={() => setSignatureOpen(true)}><PenTool className="h-4 w-4" /></ToolbarButton>
          </div>
          <div className="mx-1 hidden h-8 w-px bg-slate-200 md:block" />
          <div className="flex items-center gap-1">
            <ToolbarButton title="Undo (Ctrl+Z)" disabled={!history.length} onClick={undo}><Undo2 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Redo (Ctrl+Y)" disabled={!future.length} onClick={redo}><Redo2 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Copy selected" disabled={!selectedObject} onClick={copySelected}><Copy className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Delete selected" disabled={!selectedObject} onClick={deleteSelected}><Trash2 className="h-4 w-4" /></ToolbarButton>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ToolbarButton title="Find text (Ctrl+F)" onClick={() => setSearchOpen((current) => !current)}><Search className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Zoom out" onClick={() => setZoom((current) => Math.max(0.45, current - 0.1))}><ZoomOut className="h-4 w-4" /></ToolbarButton>
            <span className="min-w-14 text-center text-[11px] font-black text-slate-600">{Math.round(zoom * 100)}%</span>
            <ToolbarButton title="Zoom in" onClick={() => setZoom((current) => Math.min(2.2, current + 0.1))}><ZoomIn className="h-4 w-4" /></ToolbarButton>
            <button type="button" disabled={exporting} onClick={() => void exportPdf()} className="ml-1 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}<span className="hidden sm:inline">Download PDF</span></button>
          </div>
        </div>
        {searchOpen && <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2"><Search className="h-4 w-4 text-slate-400" /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Find text in PDF…" className="h-9 min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-400" /><span className="text-xs font-black text-slate-500">{searchResults.length} matches</span><div className="flex max-w-full gap-1 overflow-x-auto">{searchResults.slice(0, 12).map(({ pageId, hit }, index) => <button key={`${pageId}-${hit.id}`} type="button" onClick={() => { setActivePageId(pageId); window.setTimeout(() => replaceTextHit(hit), 0); }} className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-600 hover:border-blue-300 hover:text-blue-700">{index + 1}. {hit.text.slice(0, 22)}</button>)}</div></div>}
      </header>

      <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[190px_minmax(0,1fr)_300px]">
        <aside className="hidden border-r border-slate-200 bg-white p-3 lg:block">
          <div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Pages</p><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black">{pages.length}</span></div>
          <div className="mt-3 max-h-[calc(100vh-150px)] space-y-2 overflow-y-auto pr-1">{pages.map((page, index) => <button key={page.instanceId} type="button" onClick={() => { setActivePageId(page.instanceId); setSelectedId(null); }} className={`w-full rounded-2xl border p-2 text-left transition ${activePage?.instanceId === page.instanceId ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200"}`}><div className="aspect-[.72] overflow-hidden rounded-lg bg-slate-100">{thumbnails[page.sourceIndex] ? <img src={thumbnails[page.sourceIndex]} alt="" className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center text-[10px] font-black text-slate-400">Page</div>}</div><div className="mt-2 flex items-center justify-between"><span className="text-[10px] font-black">Page {index + 1}</span>{!!page.rotation && <span className="text-[9px] font-bold text-blue-600">+{page.rotation}°</span>}</div></button>)}</div>
        </aside>

        <section className="min-w-0 overflow-auto p-4 md:p-7">
          <div className="mx-auto w-max">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm"><div className="flex items-center gap-1"><ToolbarButton title="Move page earlier" onClick={() => movePage(-1)}><ChevronUp className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Move page later" onClick={() => movePage(1)}><ChevronDown className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Duplicate page" onClick={duplicatePage}><Plus className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Rotate page left (applies on export)" onClick={() => rotatePage(-90)}><RotateCcw className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Rotate page right (applies on export)" onClick={() => rotatePage(90)}><RotateCw className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Delete page" disabled={pages.length <= 1} onClick={deletePage}><Trash2 className="h-4 w-4" /></ToolbarButton></div><div className="text-[10px] font-black text-slate-500">{activePage ? `Page ${pages.findIndex((page) => page.instanceId === activePage.instanceId) + 1} / ${pages.length}` : ""}{savedAt ? " • Saved locally" : ""}</div></div>

            <div ref={pageSurfaceRef} onPointerDown={beginSurfaceAction} onPointerMove={moveSurfaceAction} onPointerUp={endSurfaceAction} onPointerCancel={() => setDragDraft(null)} className={`relative overflow-hidden bg-white shadow-[0_25px_70px_rgba(15,23,42,.22)] ${mode === "text" ? "cursor-text" : mode === "select" ? "cursor-default" : "cursor-crosshair"}`} style={{ width: pageSize.width * zoom, height: pageSize.height * zoom }}>
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
              {mode === "select" && currentTextHits.map((hit) => <button key={hit.id} type="button" title={`Edit \"${hit.text}\"`} aria-label={`Edit detected text ${hit.text}`} onClick={(event) => { event.stopPropagation(); replaceTextHit(hit); }} className="absolute z-10 border border-transparent bg-transparent hover:border-blue-400 hover:bg-blue-400/10" style={{ left: hit.x * zoom, top: (pageSize.height - hit.y - hit.height) * zoom, width: Math.max(3, hit.width * zoom), height: Math.max(6, hit.height * zoom) }} />)}
              {pageObjects.map(renderObject)}
              {draftRect && <div className="pointer-events-none absolute z-50 border-2 border-dashed border-blue-500 bg-blue-100/20" style={draftRect} />}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-slate-500"><span>Blue hover boxes = detected PDF text. Click one to analyse its font and replace it.</span><span>Page rotation is applied to original content + edits together during export.</span></div>
          </div>
        </section>

        <aside className="border-l border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Properties</p><p className="mt-1 text-[10px] font-bold text-slate-400">{selectedObject ? selectedObject.type : "Nothing selected"}</p></div>{selectedObject && <button type="button" onClick={() => setSelectedId(null)} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-4 w-4" /></button>}</div>
          {!selectedObject && <div className="mt-5 space-y-3"><div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="text-sm font-black text-blue-950">Smart edit</p><p className="mt-2 text-xs font-medium leading-5 text-blue-800">Click existing text such as a date or amount. AJN PDF samples the nearby rendered background, covers the old visible text and creates an editable replacement.</p></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-black">Manual fallback</p><p className="mt-2 text-xs font-medium leading-5 text-slate-600">For scans or unusual fonts, draw Whiteout and then Add Text.</p></div></div>}

          {selectedObject?.type === "text" && <div className="mt-5 space-y-5">
            {selectedObject.source === "replacement" && <div className={`rounded-2xl border p-3 ${selectedObject.fontMatch === "exact" ? "border-emerald-200 bg-emerald-50" : selectedObject.fontMatch === "family" ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}`}><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Detected PDF font</span><span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase ${selectedObject.fontMatch === "exact" ? "bg-emerald-600 text-white" : selectedObject.fontMatch === "family" ? "bg-blue-600 text-white" : "bg-amber-500 text-white"}`}>{selectedObject.fontMatch === "exact" ? "Visual match" : selectedObject.fontMatch === "family" ? "Family match" : "Fallback"}</span></div><p className="mt-2 break-all text-xs font-black text-slate-900">{selectedObject.loadedFontName || selectedObject.fontFamily || selectedObject.fontRef}</p><p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">Size {selectedObject.fontSize.toFixed(1)} • width scale {selectedObject.horizontalScale.toFixed(2)}× • baseline preserved. Replacement export uses visual font matching instead of forced Helvetica.</p></div>}
            <label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Text</span><textarea value={selectedObject.text} onChange={(event) => updateObject(selectedObject.id, { text: event.target.value } as Partial<EditorObject>)} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-blue-400" /></label>
            <div className="grid grid-cols-2 gap-3"><label><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Font size</span><input type="number" min={6} max={96} value={selectedObject.fontSize} onChange={(event) => updateObject(selectedObject.id, { fontSize: Math.max(6, Number(event.target.value) || 12) } as Partial<EditorObject>)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold" /></label><label><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Letter spacing</span><input type="number" min={0} max={12} step={0.25} value={selectedObject.letterSpacing} onChange={(event) => updateObject(selectedObject.id, { letterSpacing: Math.max(0, Number(event.target.value) || 0) } as Partial<EditorObject>)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold" /></label></div>
            <div className="grid grid-cols-2 gap-3"><label><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Text color</span><input type="color" value={selectedObject.color} onChange={(event) => updateObject(selectedObject.id, { color: event.target.value } as Partial<EditorObject>)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white p-1" /></label><label><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Background</span><div className="mt-2 flex gap-1"><input type="color" value={selectedObject.background === "transparent" ? "#ffffff" : selectedObject.background} onChange={(event) => updateObject(selectedObject.id, { background: event.target.value } as Partial<EditorObject>)} className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-1" /><button type="button" onClick={() => updateObject(selectedObject.id, { background: "transparent" } as Partial<EditorObject>)} className="rounded-xl border border-slate-200 px-2 text-[9px] font-black">None</button></div></label></div>
            <div className="flex flex-wrap gap-1"><ToolbarButton title="Bold" active={selectedObject.bold} onClick={() => updateObject(selectedObject.id, { bold: !selectedObject.bold } as Partial<EditorObject>, true)}><Bold className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Italic" active={selectedObject.italic} onClick={() => updateObject(selectedObject.id, { italic: !selectedObject.italic } as Partial<EditorObject>, true)}><Italic className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Underline" active={selectedObject.underline} onClick={() => updateObject(selectedObject.id, { underline: !selectedObject.underline } as Partial<EditorObject>, true)}><Underline className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Align left" active={selectedObject.align === "left"} onClick={() => updateObject(selectedObject.id, { align: "left" } as Partial<EditorObject>, true)}><AlignLeft className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Align center" active={selectedObject.align === "center"} onClick={() => updateObject(selectedObject.id, { align: "center" } as Partial<EditorObject>, true)}><AlignCenter className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Align right" active={selectedObject.align === "right"} onClick={() => updateObject(selectedObject.id, { align: "right" } as Partial<EditorObject>, true)}><AlignRight className="h-4 w-4" /></ToolbarButton></div>
          </div>}

          {selectedObject && selectedObject.type !== "text" && <div className="mt-5 space-y-4">{(selectedObject.type === "whiteout" || selectedObject.type === "highlight" || selectedObject.type === "rect" || selectedObject.type === "ellipse") && <><label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Fill</span><input type="color" value={selectedObject.fill === "transparent" ? "#ffffff" : selectedObject.fill} onChange={(event) => updateObject(selectedObject.id, { fill: event.target.value } as Partial<EditorObject>)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white p-1" /></label><label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Border</span><input type="color" value={selectedObject.stroke === "transparent" ? "#2563eb" : selectedObject.stroke} onChange={(event) => updateObject(selectedObject.id, { stroke: event.target.value } as Partial<EditorObject>)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white p-1" /></label></>}<label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Opacity {Math.round(selectedObject.opacity * 100)}%</span><input type="range" min={10} max={100} value={Math.round(selectedObject.opacity * 100)} onChange={(event) => updateObject(selectedObject.id, { opacity: Number(event.target.value) / 100 } as Partial<EditorObject>)} className="mt-2 w-full" /></label></div>}

          {selectedObject && <div className="mt-6 border-t border-slate-100 pt-5"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={duplicateSelected} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Duplicate</button><button type="button" onClick={deleteSelected} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700">Delete</button></div></div>}
          <div className="mt-6 border-t border-slate-100 pt-5"><div className="rounded-2xl bg-emerald-50 p-4"><div className="flex items-center gap-2 text-xs font-black text-emerald-900"><ShieldCheck className="h-4 w-4" /> Browser-only processing</div><p className="mt-2 text-[11px] font-medium leading-5 text-emerald-800">No PDF upload request is used. Local recovery uses IndexedDB on this browser/device.</p></div><button type="button" onClick={() => void resetEditor()} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Close local document</button></div>
        </aside>
      </div>

      {(status || error) && <div className="fixed bottom-4 left-1/2 z-[150] w-[min(92vw,620px)] -translate-x-1/2"><div className={`rounded-2xl border px-4 py-3 text-sm font-bold shadow-xl ${error ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700"}`}><div className="flex items-center gap-2">{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : error ? <X className="h-4 w-4" /> : <Save className="h-4 w-4 text-emerald-600" />}<span>{error || status}</span>{error && <button type="button" onClick={() => setError("")} className="ml-auto rounded-lg p-1 hover:bg-red-100"><X className="h-4 w-4" /></button>}</div></div></div>}
    </main>
  );
}
