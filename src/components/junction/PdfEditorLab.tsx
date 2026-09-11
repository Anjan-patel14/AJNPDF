/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFDocument, PDFName, PDFString, StandardFonts, degrees, rgb } from "pdf-lib";
import {
  AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, ChevronUp, Circle, Copy,
  Download, Eraser, FileText, Highlighter, ImagePlus, Italic, Layers3, Link2, Loader2,
  MousePointer2, PenTool, Plus, Redo2, RotateCcw, RotateCw, Save, ScanText, Table2,
  Search, ShieldCheck, Square, Trash2, Type, Underline, Undo2, UploadCloud, X, ZoomIn, ZoomOut,
} from "lucide-react";
import { initPdfWorker } from "@/lib/pdfjs-worker";
import { validatePdfFile } from "@/lib/file-validation";

type Mode = "select" | "text" | "whiteout" | "highlight" | "rect" | "ellipse" | "redact" | "link";
type TextAlign = "left" | "center" | "right";
type FontMatch = "exact" | "family" | "fallback" | "ocr";
type TextRenderMode = "vector" | "visual-match";

type BaseObject = {
  id: string;
  pageInstanceId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  sourceHitId?: string;
};

type TextObject = BaseObject & {
  type: "text";
  text: string;
  fontSize: number;
  color: string;
  background: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: TextAlign;
  letterSpacing: number;
  lineHeight: number;
  source: "new" | "replacement" | "ocr";
  fontRef: string;
  fontFamily: string;
  loadedFontName: string;
  fontMatch: FontMatch;
  renderMode: TextRenderMode;
  ascent: number;
  descent: number;
  baselineOffset: number;
  horizontalScale: number;
  autoStyle?: boolean;
  matchedFontSize?: number;
  matchedHorizontalScale?: number;
  styleConfidence?: number;
};

type RectObject = BaseObject & {
  type: "whiteout" | "highlight" | "rect" | "ellipse" | "redact";
  fill: string;
  stroke: string;
  strokeWidth: number;
};

type ImageObject = BaseObject & {
  type: "image" | "signature";
  dataUrl: string;
};

type LinkObject = BaseObject & {
  type: "link";
  url: string;
};

type EditorObject = TextObject | RectObject | ImageObject | LinkObject;

type TextHit = {
  id: string;
  sourceIndex: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontRef: string;
  fontFamily: string;
  loadedFontName: string;
  fontMatch: FontMatch;
  bold: boolean;
  italic: boolean;
  ascent: number;
  descent: number;
  horizontalScale: number;
  ocr?: boolean;
  visualFallback?: boolean;
  confidence?: number;
  uncertain?: boolean;
  tableRow?: number;
  tableColumn?: number;
  tableCell?: { x: number; y: number; width: number; height: number };
  ocrFontSizeHint?: number;
  ocrFontFamilyHint?: string;
  ocrBoldHint?: boolean;
  ocrItalicHint?: boolean;
};

type ImageHit = {
  id: string;
  sourceIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PageInstance = { instanceId: string; sourceIndex: number; rotation: number };
type Snapshot = { objects: EditorObject[]; pages: PageInstance[] };
type RestoreRecord = {
  fileBlob: Blob;
  fileName: string;
  fileLastModified: number;
  objects: EditorObject[];
  pages: PageInstance[];
  savedAt: number;
  schemaVersion?: number;
};

type RasterSample = { canvas: HTMLCanvasElement; width: number; height: number; scale: number };
type OcrLanguage = "eng" | "hin" | "tel" | "tam" | "kan" | "mal";
type OcrGranularity = "word" | "line" | "table";
type TableCellRegion = { row: number; column: number; x: number; y: number; width: number; height: number; pixelLeft: number; pixelTop: number; pixelRight: number; pixelBottom: number };
type TableGridModel = { canvas: HTMLCanvasElement; cells: TableCellRegion[]; horizontalLines: number[]; verticalLines: number[] };
type OcrRecognizeResult = { data?: { text?: string; tsv?: string; hocr?: string; blocks?: unknown; words?: unknown; [key: string]: unknown } };

declare global {
  interface Window {
    Tesseract?: {
      createWorker: (language: string, oem?: number, options?: Record<string, unknown>) => Promise<any>;
    };
  }
}

const MAX_FILE_MB = 60;
const MAX_PAGES = 160;
const MIN_OBJECT_SIZE = 8;
const DB_NAME = "ajn-pdf-editor-v4";
const STORE_NAME = "sessions";
const STORE_KEY = "active";
const DEFAULT_ZOOM = 1.05;
const OCR_RUNTIME_BASE = "/ajn-ocr";
const TESSERACT_LOCAL_SCRIPT = `${OCR_RUNTIME_BASE}/tesseract.min.js`;
const TESSERACT_WORKER_FILE = "worker.min.js";
const TESSERACT_CORE_DIR = "core";
const TESSERACT_LANG_DIR = "lang";
const OCR_LANGUAGES: Array<{ value: OcrLanguage; label: string }> = [
  { value: "eng", label: "English" },
  { value: "hin", label: "Hindi" },
  { value: "tel", label: "Telugu" },
  { value: "tam", label: "Tamil" },
  { value: "kan", label: "Kannada" },
  { value: "mal", label: "Malayalam" },
];

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const cloneObjects = (items: EditorObject[]) => items.map((item) => {
  const clean = { ...(item as EditorObject & { locked?: boolean }) } as EditorObject & { locked?: boolean };
  delete clean.locked;
  return clean as EditorObject;
});
const clonePages = (items: PageInstance[]) => items.map((item) => ({ ...item }));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const genericFontFamilies = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"]);

type FontDescriptor = { loadedFontName?: string; fontFamily?: string; fontRef?: string };
const safeFontToken = (value?: string) => (value ?? "").replace(/["'\\]/g, "").trim();
const cssFontFamily = (item: FontDescriptor) => {
  // PDF.js embedded fonts remap glyph codes and cannot render arbitrary typed Unicode.
  const candidates = [item.fontFamily]
    .map(safeFontToken)
    .filter(Boolean)
    .map((value) => genericFontFamilies.has(value.toLowerCase()) ? value : `"${value}"`);
  return [...new Set([...candidates, "Arial", "Helvetica", "sans-serif"])].join(", ");
};
const cssFont = (item: Pick<TextObject, "fontSize" | "bold" | "italic" | "loadedFontName" | "fontFamily">, size = item.fontSize) =>
  `${item.italic ? "italic" : "normal"} ${item.bold ? 700 : 400} ${Math.max(1, size)}px ${cssFontFamily(item)}`;

const hexToRgb = (hex: string) => {
  const value = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(value, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
const rgbHex = (r: number, g: number, b: number) => `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")).join("")}`;
const colorDistance = (a: [number, number, number], b: [number, number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const OCR_FONT_CANDIDATES = [
  "Aptos", "Calibri", "Cambria", "Segoe UI", "Arial", "Helvetica",
  "Times New Roman", "Georgia", "Verdana", "Tahoma", "Trebuchet MS", "Courier New",
] as const;
const normalizeDetectedFontFamily = (value: string) => {
  const token = safeFontToken(value).replace(/^[A-Z]{6}\+/, "");
  const lower = token.toLowerCase().replace(/[\s_-]+/g, "");
  if (!token) return "Arial";
  if (/arial(mt|psmt)?/.test(lower) || lower === "helvetica") return "Arial";
  if (/timesnewroman|timesroman|timesnewromanps/.test(lower)) return "Times New Roman";
  if (/calibri/.test(lower)) return "Calibri";
  if (/cambria/.test(lower)) return "Cambria";
  if (/aptos/.test(lower)) return "Aptos";
  if (/segoeui/.test(lower)) return "Segoe UI";
  if (/courier/.test(lower)) return "Courier New";
  if (/trebuchet/.test(lower)) return "Trebuchet MS";
  return token;
};
const scriptCompatible = (text: string, language: OcrLanguage) => {
  const compact = text.replace(/[\d\s\p{P}\p{S}]/gu, "");
  if (!compact) return true;
  if (language === "eng") return !/[\u0900-\u0D7F]/u.test(compact) && /^[A-Za-zÀ-ÖØ-öø-ÿ]+$/u.test(compact);
  const ranges: Record<Exclude<OcrLanguage, "eng">, RegExp> = {
    hin: /^[\u0900-\u097F]+$/u,
    tel: /^[\u0C00-\u0C7F]+$/u,
    tam: /^[\u0B80-\u0BFF]+$/u,
    kan: /^[\u0C80-\u0CFF]+$/u,
    mal: /^[\u0D00-\u0D7F]+$/u,
  };
  return ranges[language].test(compact);
};
const cleanOcrText = (text: string, language: OcrLanguage, confidence = 100) => {
  const cleaned = text.normalize("NFC").replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned || !scriptCompatible(cleaned, language)) return { text: "", uncertain: true };
  // Keep moderately confident OCR editable instead of turning recognized words into blank regions.
  // Very low-confidence output is still withheld so obvious OCR noise is not painted over the scan.
  if (confidence < 32) return { text: "", uncertain: true };
  return { text: cleaned, uncertain: confidence < 68 };
};

const inferOcrFontStyle = (
  text: string,
  targetWidth: number,
  glyphHeight: number,
  glyphInkDensity: number,
  language: OcrLanguage,
  italicHint = 0,
) => {
  const fallbackSize = clamp(glyphHeight * 1.08, 5.5, 48);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx || !text) return { family: language === "eng" ? "Arial" : "Noto Sans", size: fallbackSize, bold: glyphInkDensity > 0.40, italic: false, horizontalScale: 1, score: 1 };
  const probe = 100;
  const families = language === "eng" ? OCR_FONT_CANDIDATES : (["Noto Sans", "Arial"] as const);
  let best = { family: language === "eng" ? "Arial" : "Noto Sans", size: fallbackSize, bold: false, italic: false, horizontalScale: 1, score: Number.POSITIVE_INFINITY };
  const hintedItalic = Math.abs(italicHint) >= 0.09;
  for (const family of families) {
    for (const bold of [false, true]) {
      for (const italic of [false, true]) {
        ctx.font = `${italic ? "italic" : "normal"} ${bold ? 700 : 400} ${probe}px "${family}"`;
        const metrics = ctx.measureText(text);
        const probeHeight = Math.max(36, (metrics.actualBoundingBoxAscent || 74) + (metrics.actualBoundingBoxDescent || 18));
        const size = clamp(glyphHeight * probe / probeHeight, 5.5, 48);
        const predictedWidth = Math.max(1, metrics.width * size / probe);
        const rawScale = targetWidth / predictedWidth;
        const horizontalScale = clamp(rawScale, 0.72, 1.34);
        const fittedWidth = predictedWidth * horizontalScale;
        const widthResidual = Math.abs(fittedWidth - targetWidth) / Math.max(5, targetWidth);
        const scalePenalty = Math.abs(Math.log(Math.max(0.01, horizontalScale))) * 0.42;
        const boldExpected = glyphInkDensity >= 0.40;
        const densityPenalty = bold === boldExpected ? 0 : 0.055;
        const italicPenalty = italic === hintedItalic ? 0 : hintedItalic ? 0.045 : 0.018;
        const monoPenalty = family === "Courier New" && !/^[A-Z0-9._:/\-]+$/i.test(text) ? 0.045 : 0;
        const score = widthResidual + scalePenalty + densityPenalty + italicPenalty + monoPenalty;
        if (score < best.score) best = { family, size, bold, italic, horizontalScale, score };
      }
    }
  }
  return best;
};

const dataUrlToBytes = (dataUrl: string) => {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Invalid image data.");
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

const openDb = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  const timer = window.setTimeout(() => reject(new Error("Local recovery storage is unavailable.")), 3000);
  request.onblocked = () => { window.clearTimeout(timer); reject(new Error("Close another editor tab to enable local recovery.")); };
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
  };
  request.onsuccess = () => { window.clearTimeout(timer); resolve(request.result); };
  request.onerror = () => { window.clearTimeout(timer); reject(request.error); };
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
    const request = tx.objectStore(STORE_NAME).get(STORE_KEY);
    request.onsuccess = () => resolve(request.result as RestoreRecord | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  if (!record || !(record.fileBlob instanceof Blob) || typeof record.fileName !== "string" ||
      !Number.isFinite(record.savedAt) || !Array.isArray(record.objects) || !Array.isArray(record.pages)) return undefined;
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


const withOcrTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  let timer = 0;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    window.clearTimeout(timer);
  }
};

const loadTesseract = async () => {
  if (window.Tesseract?.createWorker) return window.Tesseract;

  // A failed/half-loaded script tag can otherwise leave later OCR attempts waiting forever.
  const stale = document.querySelector<HTMLScriptElement>(`script[data-ajn-tesseract="true"]`);
  if (stale && !window.Tesseract?.createWorker) stale.remove();

  await withOcrTimeout(new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${TESSERACT_LOCAL_SCRIPT}?v=5.7.0`;
    script.async = true;
    script.dataset.ajnTesseract = "true";
    script.onload = () => {
      if (window.Tesseract?.createWorker) resolve();
      else reject(new Error("Local OCR script loaded but Tesseract did not initialize. Refresh and retry."));
    };
    script.onerror = () => reject(new Error("Local OCR runtime is missing or blocked. Refresh and retry after checking the local OCR assets."));
    document.head.appendChild(script);
  }), 12000, "Local OCR runtime script did not initialize within 12 seconds. AJN PDF stopped the scan instead of leaving it loading forever.");

  if (!window.Tesseract?.createWorker) throw new Error("Local OCR runtime is unavailable. Refresh and retry.");
  return window.Tesseract;
};

const verifyLocalOcrWasm = async () => {
  if (typeof WebAssembly === "undefined") {
    throw new Error("This browser does not support WebAssembly, which is required for scanned-document OCR.");
  }
  try {
    // Minimal valid WASM module. This catches CSP blocks before Tesseract worker startup.
    await withOcrTimeout(
      WebAssembly.compile(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])),
      3000,
      "WebAssembly permission check timed out.",
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Local OCR WebAssembly is blocked by browser security policy. Refresh and try a supported browser. ${detail}`);
  }
};

const terminateOcrWorkerSafely = async (worker: any) => {
  if (!worker?.terminate) return;
  try {
    await withOcrTimeout(Promise.resolve(worker.terminate()), 2500, "");
  } catch {
    // A wedged OCR worker must never keep the editor in a permanent busy state.
  }
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
    const maxSide = 3000;
    const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image canvas is unavailable.");
    ctx.drawImage(image, 0, 0, width, height);
    return { dataUrl: canvas.toDataURL("image/png"), width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
};

const fontNameFor = (item: TextObject) => {
  if (item.bold && item.italic) return StandardFonts.HelveticaBoldOblique;
  if (item.bold) return StandardFonts.HelveticaBold;
  if (item.italic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
};

const rasterizeMatchedText = async (item: TextObject) => {
  const scale = clamp(Math.ceil(320 / Math.max(24, item.fontSize)), 3, 6);
  const widthPx = Math.max(8, Math.ceil(item.width * scale));
  const heightPx = Math.max(8, Math.ceil(item.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Matched-font canvas is unavailable.");
  ctx.clearRect(0, 0, widthPx, heightPx);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = item.color;
  ctx.font = cssFont(item, item.fontSize * scale);
  const lines = item.text.replace(/\r/g, "").split("\n");
  const lineHeight = item.fontSize * item.lineHeight * scale;
  const baseBaseline = item.source !== "new"
    ? (item.height - item.baselineOffset) * scale
    : Math.min(heightPx - item.fontSize * 0.14 * scale, item.fontSize * 0.88 * scale);
  lines.forEach((line, lineIndex) => {
    const measured = Math.max(0.01, ctx.measureText(line).width);
    const requestedScale = clamp(item.horizontalScale, 0.35, 2.5);
    const withPdfScale = measured * requestedScale;
    const fitScale = withPdfScale > widthPx ? widthPx / withPdfScale : 1;
    const scaleX = requestedScale * fitScale;
    const finalWidth = measured * scaleX;
    let x = 0;
    if (item.align === "center") x = Math.max(0, (widthPx - finalWidth) / 2);
    if (item.align === "right") x = Math.max(0, widthPx - finalWidth);
    const y = baseBaseline + lineIndex * lineHeight;
    ctx.save();
    ctx.translate(x, 0);
    ctx.scale(scaleX, 1);
    ctx.fillText(line, 0, y);
    if (item.underline) {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = Math.max(1, item.fontSize * scale / 18);
      ctx.beginPath();
      ctx.moveTo(0, y + Math.max(1, item.fontSize * scale * 0.08));
      ctx.lineTo(measured, y + Math.max(1, item.fontSize * scale * 0.08));
      ctx.stroke();
    }
    ctx.restore();
  });
  return canvas.toDataURL("image/png");
};

const multiplyMatrix = (a: number[], b: number[]) => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];

const imageHitsFromOperators = async (page: any, sourceIndex: number): Promise<ImageHit[]> => {
  try {
    const list = await page.getOperatorList();
    const OPS = (pdfjsLib as any).OPS ?? {};
    let ctm = [1, 0, 0, 1, 0, 0];
    const stack: number[][] = [];
    const hits: ImageHit[] = [];
    for (let index = 0; index < list.fnArray.length; index += 1) {
      const fn = list.fnArray[index];
      const args = list.argsArray[index] ?? [];
      if (fn === OPS.save) { stack.push([...ctm]); continue; }
      if (fn === OPS.restore) { ctm = stack.pop() ?? [1, 0, 0, 1, 0, 0]; continue; }
      if (fn === OPS.transform) { ctm = multiplyMatrix(ctm, args.map(Number)); continue; }
      const isImage = fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject || fn === OPS.paintInlineImageXObject || fn === OPS.paintImageMaskXObject;
      if (!isImage) continue;
      const points = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => ({ x: ctm[0] * x + ctm[2] * y + ctm[4], y: ctm[1] * x + ctm[3] * y + ctm[5] }));
      const minX = Math.min(...points.map((point) => point.x));
      const maxX = Math.max(...points.map((point) => point.x));
      const minY = Math.min(...points.map((point) => point.y));
      const maxY = Math.max(...points.map((point) => point.y));
      const width = Math.abs(maxX - minX);
      const height = Math.abs(maxY - minY);
      if (width < 8 || height < 8) continue;
      hits.push({ id: `image-hit-${sourceIndex}-${index}`, sourceIndex, x: minX, y: minY, width, height });
    }
    return hits.slice(0, 250);
  } catch {
    return [];
  }
};

const isPageBackgroundImageHit = (hit: ImageHit, pageWidth: number, pageHeight: number, _nativeTextCount = 0) => {
  if (pageWidth <= 0 || pageHeight <= 0) return false;
  const widthRatio = hit.width / pageWidth;
  const heightRatio = hit.height / pageHeight;
  const areaRatio = (hit.width * hit.height) / (pageWidth * pageHeight);
  // A page-sized scan is a background even when the PDF also contains a tiny/hidden OCR text layer.
  // Treating it as an editable image would steal pointer events from OCR/native text.
  return (widthRatio >= 0.65 && heightRatio >= 0.65) || areaRatio >= 0.58;
};

const sanitizeRestoredObjectsForPdf = async (items: EditorObject[], pages: PageInstance[], pdf: any, discardLegacyOcr = false): Promise<EditorObject[]> => {
  const clean = cloneObjects(items);
  if (!clean.length || !pages.length) return clean;
  const pageByInstance = new Map(pages.map((page) => [page.instanceId, page]));
  const metrics = new Map<number, { width: number; height: number }>();
  for (const sourceIndex of [...new Set(pages.map((page) => page.sourceIndex))]) {
    try {
      const page = await pdf.getPage(sourceIndex + 1);
      const viewport = page.getViewport({ scale: 1, rotation: 0 });
      metrics.set(sourceIndex, { width: viewport.width, height: viewport.height });
    } catch { /* keep recovery usable even if one page metric fails */ }
  }
  const staleScanSourceIds = new Set<string>();
  if (discardLegacyOcr) {
    clean.forEach((item) => {
      if (item.type === "text" && item.source === "ocr" && item.sourceHitId && (item.fontRef === "ocr" || item.fontRef === "ocr-visual")) staleScanSourceIds.add(item.sourceHitId);
    });
  }
  clean.forEach((item) => {
    if (item.type !== "image" || !item.sourceHitId || !item.id.startsWith("existing-image-")) return;
    const page = pageByInstance.get(item.pageInstanceId);
    const metric = page ? metrics.get(page.sourceIndex) : undefined;
    if (!metric) return;
    const widthRatio = item.width / metric.width;
    const heightRatio = item.height / metric.height;
    const areaRatio = (item.width * item.height) / (metric.width * metric.height);
    if ((widthRatio >= 0.72 && heightRatio >= 0.72) || areaRatio >= 0.62) staleScanSourceIds.add(item.sourceHitId);
  });
  return staleScanSourceIds.size ? clean.filter((item) => !item.sourceHitId || !staleScanSourceIds.has(item.sourceHitId)) : clean;
};

function ToolbarButton({ active, disabled, title, onClick, children }: {
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(620 * ratio);
    canvas.height = Math.round(220 * ratio);
    canvas.style.width = "100%";
    canvas.style.height = "220px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 620, 220);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.4;
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * 620, y: ((event.clientY - rect.top) / rect.height) * 220 };
  };
  const down = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastRef.current = point(event);
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastRef.current) return;
    const next = point(event);
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    lastRef.current = next;
  };
  const up = () => { drawingRef.current = false; lastRef.current = null; };
  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 620 * ratio, 220 * ratio);
  };
  return (
    <div className="fixed inset-0 z-[300] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div><h3 className="text-lg font-black">Draw signature</h3><p className="text-xs font-medium text-slate-500">Signature pixels stay in this browser session.</p></div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <canvas ref={canvasRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className="mt-5 touch-none rounded-2xl border border-dashed border-slate-300 bg-white" />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={clear} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black">Clear</button>
          <button type="button" onClick={() => { const canvas = canvasRef.current; if (canvas) onInsert(canvas.toDataURL("image/png")); }} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white">Insert signature</button>
        </div>
      </div>
    </div>
  );
}

export default function PdfEditorLab() {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageSurfaceRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<any>(null);
  const fileBytesRef = useRef<ArrayBuffer | null>(null);
  const ocrSessionRef = useRef(0);
  const ocrWorkerRef = useRef<any>(null);
  const ocrRunRef = useRef(false);
  const pdfPickerInputRef = useRef<HTMLInputElement>(null);
  const openingPdfRef = useRef(false);
  const pendingPdfRef = useRef<File | null>(null);
  const uploadAttemptRef = useRef(0);
  const loadingTaskRef = useRef<any>(null);
  const analysedPdfRef = useRef<any>(null);
  const textMeasureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const textEditStartRef = useRef<{ id: string; text: string; width: number; height: number; fontSize: number; horizontalScale: number } | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<"upload" | "editor">("upload");
  const [pdfEngineReady, setPdfEngineReady] = useState(false);
  const [canvasPreviewReady, setCanvasPreviewReady] = useState(false);
  const [selectedPdfName, setSelectedPdfName] = useState("");
  const [pendingPdf, setPendingPdf] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState<"idle" | "selected" | "reading" | "parsing" | "analysing" | "ready" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("select");
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pages, setPages] = useState<PageInstance[]>([]);
  const [activePageId, setActivePageId] = useState("");
  const [sourceRotation, setSourceRotation] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 595, height: 842 });
  const [objects, setObjects] = useState<EditorObject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [textHits, setTextHits] = useState<Record<number, TextHit[]>>({});
  const [imageHits, setImageHits] = useState<Record<number, ImageHit[]>>({});
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [clipboard, setClipboard] = useState<EditorObject | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [restoreRecord, setRestoreRecord] = useState<RestoreRecord | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dragDraft, setDragDraft] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState<OcrLanguage>("eng");
  const [ocrGranularity, setOcrGranularity] = useState<OcrGranularity>("word");
  const [showImageHits, setShowImageHits] = useState(false);
  const [showTableGuides, setShowTableGuides] = useState(true);
  const [hoveredTextHitId, setHoveredTextHitId] = useState<string | null>(null);
  const [activatingTextHitId, setActivatingTextHitId] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [previewRendering, setPreviewRendering] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewRenderNonce, setPreviewRenderNonce] = useState(0);

  const activePage = useMemo(() => pages.find((page) => page.instanceId === activePageId) ?? pages[0], [pages, activePageId]);
  const viewRotation = (sourceRotation + (activePage?.rotation || 0)) % 360;
  const pageObjects = useMemo(() => objects.filter((item) => item.pageInstanceId === activePage?.instanceId), [objects, activePage?.instanceId]);
  const selectedId = selectedIds.at(-1) ?? null;
  const selectedObject = useMemo(() => objects.find((item) => item.id === selectedId) ?? null, [objects, selectedId]);
  const activeSourceIndex = activePage?.sourceIndex;
  const currentTextHits = useMemo(
    () => activeSourceIndex === undefined ? [] : textHits[activeSourceIndex] ?? [],
    [activeSourceIndex, textHits],
  );
  const currentImageHits = useMemo(
    () => activeSourceIndex === undefined ? [] : imageHits[activeSourceIndex] ?? [],
    [activeSourceIndex, imageHits],
  );
  const convertedSourceIds = useMemo(() => new Set(pageObjects.map((item) => item.sourceHitId).filter(Boolean) as string[]), [pageObjects]);
  const interactiveTextHits = useMemo(() => currentTextHits.filter((hit) => !convertedSourceIds.has(hit.id)), [convertedSourceIds, currentTextHits]);
  const currentOcrHits = useMemo(() => currentTextHits.filter((hit) => hit.ocr), [currentTextHits]);
  const sourceHitById = useMemo(() => {
    const index = new Map<string, TextHit>();
    Object.values(textHits).forEach((hits) => hits.forEach((hit) => index.set(hit.id, hit)));
    return index;
  }, [textHits]);
  const currentTableHits = useMemo(() => currentOcrHits.filter((hit) => Number.isInteger(hit.tableRow) && Number.isInteger(hit.tableColumn)), [currentOcrHits]);
  const currentTableCells = useMemo(() => {
    const cells = new Map<string, NonNullable<TextHit["tableCell"]> & { row: number; column: number }>();
    for (const hit of currentTableHits) {
      if (!hit.tableCell || hit.tableRow === undefined || hit.tableColumn === undefined) continue;
      const key = `${hit.tableRow}:${hit.tableColumn}`;
      if (!cells.has(key)) cells.set(key, { ...hit.tableCell, row: hit.tableRow, column: hit.tableColumn });
    }
    return [...cells.values()];
  }, [currentTableHits]);
  const uniqueSourceIndexes = useMemo(() => [...new Set(pages.map((page) => page.sourceIndex))], [pages]);

  const findTextHitAtPdfPoint = useCallback((x: number, y: number) => {
    if (mode !== "select") return null;
    const padding = Math.max(1.5, 3 / Math.max(zoom, 0.25));
    const matches = interactiveTextHits.filter((hit) =>
      x >= hit.x - padding && x <= hit.x + hit.width + padding &&
      y >= hit.y - padding && y <= hit.y + hit.height + padding);
    if (!matches.length) return null;
    // Smallest box wins so word boxes beat any overlapping line/page fallback. OCR also wins over native text at equal size.
    return matches.sort((a, b) => {
      if (Boolean(a.ocr) !== Boolean(b.ocr)) return a.ocr ? -1 : 1;
      return (a.width * a.height) - (b.width * b.height);
    })[0] ?? null;
  }, [interactiveTextHits, mode, zoom]);

  const searchResults = useMemo<Array<{ pageId: string; sourceIndex: number; hit: TextHit }>>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const results: Array<{ pageId: string; sourceIndex: number; hit: TextHit }> = [];
    pages.forEach((page) => {
      (textHits[page.sourceIndex] ?? []).forEach((hit) => {
        if (hit.text.toLowerCase().includes(query)) results.push({ pageId: page.instanceId, sourceIndex: page.sourceIndex, hit });
      });
    });
    return results;
  }, [pages, searchQuery, textHits]);

  const currentDocumentRef = useRef({ objects, pages });
  currentDocumentRef.current = { objects, pages };
  const snapshot = useCallback((): Snapshot => ({ objects: cloneObjects(currentDocumentRef.current.objects), pages: clonePages(currentDocumentRef.current.pages) }), []);
  const commitMutation = useCallback((mutate: () => void) => {
    const before = snapshot();
    setHistory((current) => [...current.slice(-59), before]);
    setFuture([]);
    mutate();
  }, [snapshot]);

  const clearSelection = useCallback(() => { setSelectedIds([]); setInlineEditingId(null); }, []);
  const selectOnly = useCallback((id: string) => setSelectedIds([id]), []);
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }, []);

  const undo = useCallback(() => {
    const previous = history.at(-1);
    if (!previous) return;
    const before = snapshot();
    setFuture((current) => [before, ...current.slice(0, 59)]);
    setHistory((current) => current.slice(0, -1));
    setObjects(cloneObjects(previous.objects));
    setPages(clonePages(previous.pages));
    clearSelection();
    if (!previous.pages.some((page) => page.instanceId === activePageId)) setActivePageId(previous.pages[0]?.instanceId ?? "");
  }, [activePageId, clearSelection, history, snapshot]);

  const redo = useCallback(() => {
    const next = future[0];
    if (!next) return;
    const before = snapshot();
    setHistory((current) => [...current.slice(-59), before]);
    setFuture((current) => current.slice(1));
    setObjects(cloneObjects(next.objects));
    setPages(clonePages(next.pages));
    clearSelection();
    if (!next.pages.some((page) => page.instanceId === activePageId)) setActivePageId(next.pages[0]?.instanceId ?? "");
  }, [activePageId, clearSelection, future, snapshot]);

  const updateObject = useCallback((id: string, patch: Partial<EditorObject>, recordHistory = true) => {
    const run = () => setObjects((current) => current.map((item) => item.id === id ? ({ ...item, ...patch } as EditorObject) : item));
    if (recordHistory) commitMutation(run); else run();
  }, [commitMutation]);

  const rememberTextEditStart = useCallback((item: TextObject) => {
    const current = textEditStartRef.current;
    if (!current || current.id !== item.id) textEditStartRef.current = {
      id: item.id, text: item.text, width: item.width, height: item.height, fontSize: item.fontSize, horizontalScale: item.horizontalScale,
    };
  }, []);

  const updateTextValue = useCallback((item: TextObject, value: string) => {
    if (!textMeasureCanvasRef.current) textMeasureCanvasRef.current = document.createElement("canvas");
    const ctx = textMeasureCanvasRef.current.getContext("2d");
    let width = item.width;
    let height = item.height;
    let fontSize = item.fontSize;
    let horizontalScale = item.horizontalScale;
    if (ctx) {
      const sourceHit = item.sourceHitId ? sourceHitById.get(item.sourceHitId) : undefined;
      const cell = sourceHit?.tableCell;
      const lines = value.split(/\r?\n/);
      // Source-backed text defaults to automatic style preservation. Keep the sampled
      // family/weight/colour and original matched size; only shrink when a replacement
      // cannot fit the original word/line/table cell. Short replacements never get
      // stretched simply to fill the old word width.
      if (sourceHit && item.autoStyle !== false) {
        const baseSize = clamp(item.matchedFontSize ?? item.fontSize, 5, 200);
        const baseScale = clamp(item.matchedHorizontalScale ?? item.horizontalScale, 0.35, 2.5);
        ctx.font = cssFont(item, baseSize);
        const measuredLines = lines.map((line) => ctx.measureText(line || " ").width + Math.max(0, line.length - 1) * item.letterSpacing);
        const measured = Math.max(1, ...measuredLines) * baseScale;
        const sourceRight = sourceHit.x + sourceHit.width;
        const rightBoundary = cell ? cell.x + cell.width - Math.max(1, baseSize * 0.06) : Math.min(pageSize.width, Math.max(item.x + item.width, sourceRight + Math.max(2, sourceHit.width * 0.08)));
        const targetWidth = Math.max(MIN_OBJECT_SIZE, rightBoundary - item.x);
        const sourceTop = sourceHit.y + sourceHit.height;
        const topBoundary = cell ? cell.y + cell.height - Math.max(0.8, baseSize * 0.04) : Math.min(pageSize.height, Math.max(item.y + item.height, sourceTop + Math.max(2, sourceHit.height * 0.18)));
        const targetHeight = Math.max(MIN_OBJECT_SIZE, topBoundary - item.y);
        const widthRatio = targetWidth / Math.max(1, measured);
        const lineHeightAtBase = baseSize * item.lineHeight * Math.max(1, lines.length);
        const heightRatio = targetHeight / Math.max(1, lineHeightAtBase);
        const fitRatio = Math.min(1, widthRatio, heightRatio);
        fontSize = clamp(baseSize * fitRatio, Math.max(5, Math.min(baseSize, 5.5)), baseSize);
        horizontalScale = baseScale;
        ctx.font = cssFont(item, fontSize);
        const finalMeasured = Math.max(1, ...lines.map((line) => ctx.measureText(line || " ").width + Math.max(0, line.length - 1) * item.letterSpacing)) * horizontalScale;
        width = clamp(Math.max(sourceHit.width, Math.min(finalMeasured + Math.max(2, fontSize * 0.16), targetWidth)), MIN_OBJECT_SIZE, targetWidth);
        height = clamp(Math.max(sourceHit.height, lines.length * fontSize * item.lineHeight + Math.max(1, fontSize * 0.08)), MIN_OBJECT_SIZE, targetHeight);
      } else {
        ctx.font = cssFont(item);
        const measured = Math.max(0, ...lines.map((line) => ctx.measureText(line || " ").width + Math.max(0, line.length - 1) * item.letterSpacing));
        const rightBoundary = cell ? cell.x + cell.width - Math.max(0.8, item.fontSize * 0.04) : pageSize.width;
        const topBoundary = cell ? cell.y + cell.height - Math.max(0.6, item.fontSize * 0.03) : pageSize.height;
        const maxWidth = Math.max(MIN_OBJECT_SIZE, rightBoundary - item.x);
        const maxHeight = Math.max(MIN_OBJECT_SIZE, topBoundary - item.y);
        const desiredWidth = measured * item.horizontalScale + Math.max(5, item.fontSize * 0.35);
        width = clamp(Math.max(item.width, Math.min(desiredWidth, maxWidth)), MIN_OBJECT_SIZE, maxWidth);
        const wrappedLineEstimate = cell && width > 0
          ? lines.reduce((count, line) => count + Math.max(1, Math.ceil(((ctx.measureText(line || " ").width + Math.max(0, line.length - 1) * item.letterSpacing) * item.horizontalScale) / Math.max(1, width - 2))), 0)
          : lines.length;
        height = clamp(Math.max(item.height, wrappedLineEstimate * item.fontSize * item.lineHeight + 4), MIN_OBJECT_SIZE, maxHeight);
      }
    }
    updateObject(item.id, { text: value, width, height, fontSize, horizontalScale } as Partial<EditorObject>, false);
  }, [pageSize.height, pageSize.width, sourceHitById, updateObject]);

  const finishTextEdit = useCallback((id: string) => {
    const started = textEditStartRef.current;
    const currentObject = currentDocumentRef.current.objects.find((item) => item.id === id);
    if (started?.id === id && currentObject?.type === "text" && (
      currentObject.text !== started.text || currentObject.width !== started.width || currentObject.height !== started.height ||
      currentObject.fontSize !== started.fontSize || currentObject.horizontalScale !== started.horizontalScale
    )) {
      const currentSnapshot = snapshot();
      const before: Snapshot = {
        ...currentSnapshot,
        objects: currentSnapshot.objects.map((item) => item.id === id && item.type === "text" ? {
          ...item, text: started.text, width: started.width, height: started.height, fontSize: started.fontSize, horizontalScale: started.horizontalScale,
        } : item),
      };
      setHistory((historyItems) => [...historyItems.slice(-59), before]);
      setFuture([]);
    }
    if (started?.id === id) textEditStartRef.current = null;
    setInlineEditingId((current) => current === id ? null : current);
  }, [snapshot]);

  const deleteSelected = useCallback(() => {
    if (!selectedIds.length) return;
    // Source-backed OCR/PDF text and reconstructed images keep their internal cover when deleted.
    // That makes Delete mean â€œremove this visible contentâ€ instead of accidentally restoring the original pixels/text.
    commitMutation(() => {
      setObjects((current) => current.filter((item) => !selectedIds.includes(item.id)));
      clearSelection();
    });
    setStatus("Selected content removed â€” original source remains covered. Use Undo if you want it back.");
  }, [clearSelection, commitMutation, selectedIds]);

  const removeSelectedSourceText = useCallback(() => {
    if (!selectedObject || selectedObject.type !== "text" || !selectedObject.sourceHitId) return;
    updateObject(selectedObject.id, { text: "" } as Partial<EditorObject>, true);
    setInlineEditingId(selectedObject.id);
    setStatus("Original OCR/PDF text erased â€” type a replacement now, or use Restore original.");
  }, [selectedObject, updateObject]);

  const restoreOriginalSelected = useCallback(() => {
    const sourceIds = new Set(objects.filter((item) => selectedIds.includes(item.id)).map((item) => item.sourceHitId).filter(Boolean) as string[]);
    if (!sourceIds.size) return;
    commitMutation(() => {
      setObjects((current) => current.filter((item) => !item.sourceHitId || !sourceIds.has(item.sourceHitId)));
      clearSelection();
    });
    setStatus("Original PDF/image content restored for the selected source object.");
  }, [clearSelection, commitMutation, objects, selectedIds]);

  const addTextNearSelected = useCallback(() => {
    if (!activePage) return;
    const base = selectedObject?.type === "text" ? selectedObject : null;
    const fontSize = base?.fontSize ?? 14;
    const width = Math.min(220, Math.max(90, base?.width ?? 160));
    const x = clamp((base?.x ?? 36) + (base?.width ?? 0) + 8, 0, Math.max(0, pageSize.width - width));
    const y = clamp(base?.y ?? Math.max(36, pageSize.height - 100), 0, Math.max(0, pageSize.height - 34));
    const next: TextObject = {
      id: uid("image-text"), type: "text", pageInstanceId: activePage.instanceId, x, y, width, height: Math.max(30, fontSize * 1.45),
      rotation: 0, opacity: 1, text: "New text", fontSize, color: base?.color ?? "#111827", background: "transparent",
      bold: base?.bold ?? false, italic: base?.italic ?? false, underline: base?.underline ?? false, align: base?.align ?? "left",
      letterSpacing: base?.letterSpacing ?? 0, lineHeight: base?.lineHeight ?? 1.2, source: "new",
      fontRef: base?.fontRef ?? "manual", fontFamily: base?.fontFamily ?? "Arial", loadedFontName: base?.loadedFontName ?? "",
      fontMatch: base?.fontMatch === "exact" ? "family" : (base?.fontMatch ?? "family"), renderMode: "visual-match",
      ascent: base?.ascent ?? 0.82, descent: base?.descent ?? -0.2, baselineOffset: base?.baselineOffset ?? 3, horizontalScale: base?.horizontalScale ?? 1,
      autoStyle: false, matchedFontSize: fontSize, matchedHorizontalScale: base?.horizontalScale ?? 1,
    };
    commitMutation(() => { setObjects((current) => [...current, next]); selectOnly(next.id); setInlineEditingId(next.id); setMode("select"); });
    setStatus("New text added beside the selected content â€” type directly on the page.");
  }, [activePage, commitMutation, pageSize.height, pageSize.width, selectOnly, selectedObject]);

  const copySelected = useCallback(() => { if (selectedObject) setClipboard({ ...selectedObject }); }, [selectedObject]);
  const pasteClipboard = useCallback(() => {
    if (!clipboard || !activePage) return;
    const next = {
      ...clipboard,
      id: uid(clipboard.type),
      sourceHitId: undefined,
      ...(clipboard.type === "text" ? { autoStyle: false } : {}),
      pageInstanceId: activePage.instanceId,
      x: Math.min(pageSize.width - clipboard.width, clipboard.x + 12),
      y: Math.max(0, clipboard.y - 12),
    } as EditorObject;
    commitMutation(() => { setObjects((current) => [...current, next]); selectOnly(next.id); });
  }, [activePage, clipboard, commitMutation, pageSize.width, selectOnly]);

  const duplicateSelected = useCallback(() => {
    if (!selectedObject || !activePage) return;
    const next = {
      ...selectedObject,
      id: uid(selectedObject.type),
      sourceHitId: undefined,
      ...(selectedObject.type === "text" ? { autoStyle: false } : {}),
      pageInstanceId: activePage.instanceId,
      x: Math.min(pageSize.width - selectedObject.width, selectedObject.x + 12),
      y: Math.max(0, selectedObject.y - 12),
    } as EditorObject;
    commitMutation(() => { setObjects((current) => [...current, next]); selectOnly(next.id); });
  }, [activePage, commitMutation, pageSize.width, selectOnly, selectedObject]);

  useEffect(() => {
    if (workspaceMode !== "editor") return;
    const revealEditor = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    revealEditor();
    const timer = window.setTimeout(revealEditor, 0);
    return () => window.clearTimeout(timer);
  }, [workspaceMode]);

  useEffect(() => {
    if (workspaceMode !== "upload") return;
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const revealUploadWorkspace = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    revealUploadWorkspace();
    const timer = window.setTimeout(revealUploadWorkspace, 160);
    return () => {
      window.clearTimeout(timer);
      window.history.scrollRestoration = previousRestoration;
    };
  }, [workspaceMode]);

  useEffect(() => () => {
    uploadAttemptRef.current += 1;
    ocrSessionRef.current += 1;
    void loadingTaskRef.current?.destroy().catch(() => undefined);
    if (ocrWorkerRef.current) void terminateOcrWorkerSafely(ocrWorkerRef.current);
  }, []);

  useEffect(() => {
    void loadRestoreRecord().then((record) => {
      if (record && Date.now() - record.savedAt < 24 * 60 * 60 * 1000) setRestoreRecord(record);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!file || !pdfEngineReady || !pages.length) return;
    const timer = window.setTimeout(() => {
      void saveRestoreRecord({ fileBlob: file, fileName: file.name, fileLastModified: file.lastModified, objects: cloneObjects(objects), pages: clonePages(pages), savedAt: Date.now(), schemaVersion: 70 })
        .then(() => setSavedAt(Date.now())).catch(() => undefined);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [file, objects, pages, pdfEngineReady]);

  const renderPageSample = useCallback(async (sourceIndex: number, scale = 1.45): Promise<RasterSample> => {
    if (!pdfRef.current) throw new Error("PDF is not loaded.");
    const page = await pdfRef.current.getPage(sourceIndex + 1);
    const base = page.getViewport({ scale: 1, rotation: 0 });
    const viewport = page.getViewport({ scale, rotation: 0 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(viewport.width));
    canvas.height = Math.max(1, Math.ceil(viewport.height));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Page sample canvas is unavailable.");
    await page.render({ canvasContext: ctx, viewport }).promise;
    return { canvas, width: base.width, height: base.height, scale };
  }, []);

  const sampleFromRaster = useCallback((hit: Pick<TextHit, "x" | "y" | "width" | "height">, raster: RasterSample) => {
    const fallback = { background: "#ffffff", color: "#111827", inkDensity: 0.12, glyphInkDensity: 0.18, glyphHeight: Math.max(5, hit.height * 0.72), italicHint: 0, contrast: 0 };
    const ctx = raster.canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fallback;
    const left = clamp(Math.floor(hit.x * raster.scale), 0, raster.canvas.width - 1);
    const top = clamp(Math.floor((raster.height - hit.y - hit.height) * raster.scale), 0, raster.canvas.height - 1);
    const right = clamp(Math.ceil((hit.x + hit.width) * raster.scale), left, raster.canvas.width - 1);
    const bottom = clamp(Math.ceil((raster.height - hit.y) * raster.scale), top, raster.canvas.height - 1);
    const pad = Math.max(3, Math.round(raster.scale * 2.1));
    const exLeft = clamp(left - pad, 0, raster.canvas.width - 1);
    const exTop = clamp(top - pad, 0, raster.canvas.height - 1);
    const exRight = clamp(right + pad, exLeft, raster.canvas.width - 1);
    const exBottom = clamp(bottom + pad, exTop, raster.canvas.height - 1);
    const ringBuckets = new Map<string, { count: number; r: number; g: number; b: number }>();
    const quantKey = (r: number, g: number, b: number, step = 16) => `${Math.round(r / step)}:${Math.round(g / step)}:${Math.round(b / step)}`;
    try {
      const expanded = ctx.getImageData(exLeft, exTop, exRight - exLeft + 1, exBottom - exTop + 1).data;
      const ew = exRight - exLeft + 1;
      const eh = exBottom - exTop + 1;
      const innerL = left - exLeft; const innerT = top - exTop; const innerR = right - exLeft; const innerB = bottom - exTop;
      const stride = Math.max(1, Math.floor((ew * eh) / 12000));
      for (let pixel = 0; pixel < ew * eh; pixel += stride) {
        const x = pixel % ew; const y = Math.floor(pixel / ew);
        const inside = x >= innerL && x <= innerR && y >= innerT && y <= innerB;
        if (inside) continue;
        const offset = pixel * 4;
        if (expanded[offset + 3] < 180) continue;
        const rr = expanded[offset]; const gg = expanded[offset + 1]; const bb = expanded[offset + 2];
        const key = quantKey(rr, gg, bb, 20);
        const bucket = ringBuckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
        bucket.count += 1; bucket.r += rr; bucket.g += gg; bucket.b += bb; ringBuckets.set(key, bucket);
      }
    } catch { return fallback; }
    const bestBucket = [...ringBuckets.values()].sort((a, b) => b.count - a.count)[0];
    let background = bestBucket ? rgbHex(bestBucket.r / bestBucket.count, bestBucket.g / bestBucket.count, bestBucket.b / bestBucket.count) : "#ffffff";
    let bg: [number, number, number] = [Number.parseInt(background.slice(1, 3), 16), Number.parseInt(background.slice(3, 5), 16), Number.parseInt(background.slice(5, 7), 16)];
    const width = clamp(right - left + 1, 1, 1400);
    const height = clamp(bottom - top + 1, 1, 600);
    try {
      const pixels = ctx.getImageData(left, top, width, height).data;

      // OCR boxes can sit inside a coloured badge/table cell while the small outer ring
      // leaks into the surrounding page. In that case the ring colour is not the text
      // background (for example WHITE text inside a dark rectangle on a white page).
      // Estimate the local background from the dominant colour INSIDE the OCR box first.
      // A real glyph normally occupies the minority of the box; a solid cell/badge
      // background occupies the majority. Fall back to the outer ring on textured areas.
      const localBackgroundBuckets = new Map<string, { count: number; r: number; g: number; b: number }>();
      let localOpaquePixels = 0;
      const localStride = Math.max(1, Math.floor((width * height) / 16000));
      for (let pixel = 0; pixel < width * height; pixel += localStride) {
        const offset = pixel * 4;
        if (pixels[offset + 3] < 100) continue;
        const rr = pixels[offset]; const gg = pixels[offset + 1]; const bb = pixels[offset + 2];
        const key = quantKey(rr, gg, bb, 20);
        const bucket = localBackgroundBuckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
        bucket.count += 1; bucket.r += rr; bucket.g += gg; bucket.b += bb;
        localBackgroundBuckets.set(key, bucket);
        localOpaquePixels += 1;
      }
      const localBackgroundBucket = [...localBackgroundBuckets.values()].sort((a, b) => b.count - a.count)[0];
      const localCoverage = localBackgroundBucket ? localBackgroundBucket.count / Math.max(1, localOpaquePixels) : 0;
      if (localBackgroundBucket && localCoverage >= 0.24) {
        background = rgbHex(
          localBackgroundBucket.r / localBackgroundBucket.count,
          localBackgroundBucket.g / localBackgroundBucket.count,
          localBackgroundBucket.b / localBackgroundBucket.count,
        );
        bg = [
          Number.parseInt(background.slice(1, 3), 16),
          Number.parseInt(background.slice(3, 5), 16),
          Number.parseInt(background.slice(5, 7), 16),
        ];
      }

      const candidates: Array<{ rgb: [number, number, number]; distance: number; x: number; y: number }> = [];
      let maxDistance = 0;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const offset = (y * width + x) * 4;
          if (pixels[offset + 3] < 100) continue;
          const value: [number, number, number] = [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
          const distance = colorDistance(value, bg);
          maxDistance = Math.max(maxDistance, distance);
          if (distance >= 26) candidates.push({ rgb: value, distance, x, y });
        }
      }
      if (!candidates.length) return { ...fallback, background };
      // Keep the strongest source-ink pixels. Unlike a dark-pixel-only test, this also
      // detects white/light text on dark backgrounds and saturated coloured text.
      candidates.sort((a, b) => b.distance - a.distance);
      const strongCut = Math.max(8, Math.ceil(candidates.length * 0.62));
      const strongest = candidates.slice(0, strongCut);
      const foregroundBuckets = new Map<string, { count: number; r: number; g: number; b: number; distance: number }>();
      for (const pixel of strongest) {
        const key = quantKey(pixel.rgb[0], pixel.rgb[1], pixel.rgb[2], 18);
        const bucket = foregroundBuckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0, distance: 0 };
        bucket.count += 1; bucket.r += pixel.rgb[0]; bucket.g += pixel.rgb[1]; bucket.b += pixel.rgb[2]; bucket.distance += pixel.distance;
        foregroundBuckets.set(key, bucket);
      }
      const foregroundCandidates = [...foregroundBuckets.values()]
        .map((bucket) => ({ ...bucket, averageDistance: bucket.distance / Math.max(1, bucket.count) }))
        .filter((bucket) => bucket.count >= Math.max(2, Math.floor(strongest.length * 0.008)));
      const inkBucket = foregroundCandidates.sort((a, b) => {
        // Prefer a well-supported colour that is genuinely far from the local
        // background. Count-only scoring can mistake the dark badge background
        // for ink when the OCR box is tight around white lettering.
        const aScore = a.averageDistance * Math.sqrt(a.count);
        const bScore = b.averageDistance * Math.sqrt(b.count);
        return bScore - aScore;
      })[0] ?? [...foregroundBuckets.values()].sort((a, b) => b.distance - a.distance)[0];
      let color = inkBucket ? rgbHex(inkBucket.r / inkBucket.count, inkBucket.g / inkBucket.count, inkBucket.b / inkBucket.count) : "#111827";

      // Final polarity guard. On a clearly dark local background, a selected
      // foreground that is still dark cannot represent light lettering. Choose
      // the brightest well-supported high-contrast cluster instead. The mirror
      // case protects ordinary dark text on light paper.
      const luminance = (value: [number, number, number]) => 0.2126 * value[0] + 0.7152 * value[1] + 0.0722 * value[2];
      const bgLum = luminance(bg);
      const inkRgbForGuard: [number, number, number] = [
        Number.parseInt(color.slice(1, 3), 16),
        Number.parseInt(color.slice(3, 5), 16),
        Number.parseInt(color.slice(5, 7), 16),
      ];
      const inkLum = luminance(inkRgbForGuard);
      if (foregroundCandidates.length && bgLum < 105 && inkLum < bgLum + 55) {
        const lightCluster = [...foregroundCandidates]
          .filter((bucket) => bucket.averageDistance >= 55)
          .sort((a, b) => luminance([b.r / b.count, b.g / b.count, b.b / b.count]) - luminance([a.r / a.count, a.g / a.count, a.b / a.count]))[0];
        if (lightCluster) {
          color = rgbHex(lightCluster.r / lightCluster.count, lightCluster.g / lightCluster.count, lightCluster.b / lightCluster.count);
        }
      } else if (foregroundCandidates.length && bgLum > 190 && inkLum > bgLum - 35) {
        const darkCluster = [...foregroundCandidates]
          .filter((bucket) => bucket.averageDistance >= 55)
          .sort((a, b) => luminance([a.r / a.count, a.g / a.count, a.b / a.count]) - luminance([b.r / b.count, b.g / b.count, b.b / b.count]))[0];
        if (darkCluster) {
          color = rgbHex(darkCluster.r / darkCluster.count, darkCluster.g / darkCluster.count, darkCluster.b / darkCluster.count);
        }
      }
      const inkRgb: [number, number, number] = [Number.parseInt(color.slice(1, 3), 16), Number.parseInt(color.slice(3, 5), 16), Number.parseInt(color.slice(5, 7), 16)];
      const inkThreshold = Math.max(24, colorDistance(inkRgb, bg) * 0.28);
      const active: Array<{ x: number; y: number }> = [];
      for (const pixel of candidates) if (pixel.distance >= inkThreshold) active.push({ x: pixel.x, y: pixel.y });
      if (!active.length) return { ...fallback, background, color, contrast: maxDistance };
      const minX = Math.min(...active.map((v) => v.x)); const maxX = Math.max(...active.map((v) => v.x));
      const minY = Math.min(...active.map((v) => v.y)); const maxY = Math.max(...active.map((v) => v.y));
      const activeWidth = Math.max(1, maxX - minX + 1); const activeHeight = Math.max(1, maxY - minY + 1);
      const glyphHeight = activeHeight / raster.scale;
      const inkDensity = active.length / Math.max(1, width * height);
      const glyphInkDensity = active.length / Math.max(1, activeWidth * activeHeight);
      // Estimate italic shear by finding the horizontal de-skew that makes vertical
      // strokes most column-aligned. This is more stable than comparing top/bottom
      // centroids, which changes heavily with the letters themselves.
      const sampledActive = active.length > 1400
        ? active.filter((_, index) => index % Math.ceil(active.length / 1400) === 0)
        : active;
      const centerY = (minY + maxY) / 2;
      let bestShear = 0;
      let bestConcentration = -1;
      for (let step = -6; step <= 6; step += 1) {
        const shear = step * 0.05;
        const columns = new Map<number, number>();
        for (const point of sampledActive) {
          const projectedX = Math.round(point.x - shear * (centerY - point.y));
          columns.set(projectedX, (columns.get(projectedX) ?? 0) + 1);
        }
        let concentration = 0;
        for (const count of columns.values()) concentration += count * count;
        concentration /= Math.max(1, sampledActive.length);
        if (concentration > bestConcentration + 0.02 || (Math.abs(concentration - bestConcentration) <= 0.02 && Math.abs(shear) < Math.abs(bestShear))) {
          bestConcentration = concentration;
          bestShear = shear;
        }
      }
      const italicHint = Math.abs(bestShear) >= 0.09 ? bestShear : 0;
      return { background, color, inkDensity, glyphInkDensity, glyphHeight, italicHint, contrast: maxDistance };
    } catch {
      return { ...fallback, background };
    }
  }, []);

  const buildEditablePair = useCallback((hit: TextHit, pageInstanceId: string, raster: RasterSample) => {
    const sampled = sampleFromRaster(hit, raster);
    const isOcr = Boolean(hit.ocr);
    const style = isOcr && hit.text
      ? inferOcrFontStyle(hit.text, hit.width, sampled.glyphHeight, sampled.glyphInkDensity, ocrLanguage, sampled.italicHint)
      : null;
    const inferredOcrSize = style?.size ?? sampled.glyphHeight * 1.08;
    const fontSize = isOcr
      ? clamp(hit.ocrFontSizeHint ? hit.ocrFontSizeHint * 0.72 + inferredOcrSize * 0.28 : inferredOcrSize, 5.5, 48)
      : clamp(hit.fontSize, 6, 160);
    const fontFamily = isOcr
      ? normalizeDetectedFontFamily(hit.ocrFontFamilyHint || style?.family || hit.fontFamily)
      : normalizeDetectedFontFamily(hit.fontFamily);
    const bold = isOcr ? (hit.ocrBoldHint ?? Boolean(style?.bold)) : hit.bold;
    const italic = isOcr ? (hit.ocrItalicHint ?? Boolean(style?.italic)) : hit.italic;
    const horizontalScale = isOcr ? clamp(style?.horizontalScale ?? 1, 0.72, 1.34) : hit.horizontalScale;
    const lineHeight = isOcr ? 1.0 : 1.2;
    const objectHeight = isOcr ? Math.max(fontSize * 1.18, Math.min(Math.max(hit.height, sampled.glyphHeight), fontSize * 1.65)) : Math.max(hit.height, fontSize * 1.15);
    const objectY = isOcr ? Math.max(0, hit.y - Math.max(0, (objectHeight - hit.height) / 2)) : Math.max(0, hit.y - Math.max(0, -hit.descent * fontSize));
    const baselineOffset = isOcr ? Math.max(0.5, fontSize * 0.18) : Math.max(0, hit.y - objectY);
    const isTableCell = hit.tableRow !== undefined && hit.tableColumn !== undefined;
    const coverPadX = isTableCell ? 0.2 : isOcr ? 0.8 : 1.5;
    const coverPadY = isTableCell ? 0.15 : isOcr ? 0.6 : 1.5;
    const whiteout: RectObject = {
      id: uid("source-cover"), type: "whiteout", sourceHitId: hit.id, pageInstanceId,
      x: Math.max(0, hit.x - coverPadX), y: Math.max(0, hit.y - coverPadY), width: Math.max(3, hit.width + coverPadX * 2), height: Math.max(3, hit.height + coverPadY * 2),
      rotation: 0, opacity: 1, fill: sampled.background, stroke: sampled.background, strokeWidth: 0,
    };
    const text: TextObject = {
      id: uid(isOcr ? "ocr-text" : "replacement"), type: "text", sourceHitId: hit.id, pageInstanceId,
      x: hit.x, y: objectY, width: Math.max(hit.width, fontSize * 1.25), height: objectHeight, rotation: 0, opacity: 1,
      text: hit.text, fontSize, color: sampled.color, background: "transparent", bold, italic,
      underline: false, align: "left", letterSpacing: 0, lineHeight, source: isOcr ? "ocr" : "replacement",
      fontRef: hit.fontRef, fontFamily, loadedFontName: isOcr ? "" : hit.loadedFontName,
      fontMatch: isOcr ? "ocr" : hit.fontMatch, renderMode: "visual-match", ascent: isOcr ? 0.82 : hit.ascent, descent: isOcr ? -0.18 : hit.descent,
      baselineOffset, horizontalScale, autoStyle: true, matchedFontSize: fontSize, matchedHorizontalScale: horizontalScale,
      styleConfidence: isOcr
        ? clamp(
            clamp(1 - (style?.score ?? 1), 0, 1) * 0.45 +
            clamp((hit.confidence ?? 72) / 100, 0, 1) * 0.30 +
            clamp(sampled.contrast / 120, 0, 1) * 0.15 +
            (hit.ocrFontSizeHint ? 0.06 : 0) +
            (hit.ocrFontFamilyHint ? 0.04 : 0),
            0, 1,
          )
        : hit.fontMatch === "exact" ? 1 : hit.fontMatch === "family" ? 0.86 : 0.66,
    };
    return { whiteout, text };
  }, [ocrLanguage, sampleFromRaster]);

  const prepareOcrCanvas = useCallback((raster: RasterSample, variant: "contrast" | "binary") => {
    const canvas = document.createElement("canvas");
    canvas.width = raster.canvas.width;
    canvas.height = raster.canvas.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("OCR preprocessing canvas is unavailable.");
    ctx.drawImage(raster.canvas, 0, 0);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = image.data;
    const histogram = new Uint32Array(256);
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const gray = Math.round(pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114);
      histogram[gray] += 1;
    }
    const total = Math.max(1, canvas.width * canvas.height);
    const percentile = (ratio: number) => {
      const target = Math.floor(total * ratio);
      let seen = 0;
      for (let value = 0; value < 256; value += 1) {
        seen += histogram[value];
        if (seen >= target) return value;
      }
      return 255;
    };
    const low = Math.min(220, percentile(0.02));
    const high = Math.max(low + 18, percentile(0.985));
    let threshold = 190;
    if (variant === "binary") {
      let sum = 0;
      for (let i = 0; i < 256; i += 1) sum += i * histogram[i];
      let sumBackground = 0; let weightBackground = 0; let best = -1;
      for (let i = 0; i < 256; i += 1) {
        weightBackground += histogram[i];
        if (!weightBackground) continue;
        const weightForeground = total - weightBackground;
        if (!weightForeground) break;
        sumBackground += i * histogram[i];
        const meanBackground = sumBackground / weightBackground;
        const meanForeground = (sum - sumBackground) / weightForeground;
        const between = weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;
        if (between > best) { best = between; threshold = i; }
      }
      threshold = clamp(threshold + 8, 145, 225);
    }
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const gray = pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114;
      const stretched = clamp(((gray - low) / Math.max(1, high - low)) * 255, 0, 255);
      const value = variant === "binary" ? (gray < threshold ? 0 : 255) : Math.round(stretched);
      pixels[offset] = value; pixels[offset + 1] = value; pixels[offset + 2] = value; pixels[offset + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
  }, []);


  const detectTableGrid = useCallback((raster: RasterSample, binaryCanvas: HTMLCanvasElement, sourceCanvas: HTMLCanvasElement): TableGridModel | null => {
    const binaryCtx = binaryCanvas.getContext("2d", { willReadFrequently: true });
    if (!binaryCtx) return null;
    const width = binaryCanvas.width;
    const height = binaryCanvas.height;
    if (width < 80 || height < 80) return null;
    const pixels = binaryCtx.getImageData(0, 0, width, height).data;
    const inkMask = new Uint8Array(width * height);
    const rowCounts = new Uint32Array(height);
    const colCounts = new Uint32Array(width);
    const rowLongestRun = new Uint32Array(height);
    const colLongestRun = new Uint32Array(width);
    for (let y = 0; y < height; y += 1) {
      let run = 0;
      for (let x = 0; x < width; x += 1) {
        if (pixels[(y * width + x) * 4] >= 128) { run = 0; continue; }
        inkMask[y * width + x] = 1;
        rowCounts[y] += 1;
        colCounts[x] += 1;
        run += 1;
        if (run > rowLongestRun[y]) rowLongestRun[y] = run;
      }
    }
    for (let x = 0; x < width; x += 1) {
      let run = 0;
      for (let y = 0; y < height; y += 1) {
        if (!inkMask[y * width + x]) { run = 0; continue; }
        run += 1;
        if (run > colLongestRun[x]) colLongestRun[x] = run;
      }
    }
    const cluster = (values: number[]) => {
      if (!values.length) return [] as number[];
      const groups: number[][] = [[values[0]]];
      for (const value of values.slice(1)) {
        const group = groups[groups.length - 1];
        if (value - group[group.length - 1] <= 3) group.push(value);
        else groups.push([value]);
      }
      return groups.map((group) => Math.round(group.reduce((sum, value) => sum + value, 0) / group.length));
    };
    const horizontalLines = cluster(Array.from({ length: height }, (_, y) => y).filter((y) =>
      rowCounts[y] >= Math.max(45, Math.round(width * 0.24)) && rowLongestRun[y] >= Math.max(35, Math.round(width * 0.20))));
    const verticalLines = cluster(Array.from({ length: width }, (_, x) => x).filter((x) =>
      colCounts[x] >= Math.max(45, Math.round(height * 0.12)) && colLongestRun[x] >= Math.max(40, Math.round(height * 0.10))));
    if (horizontalLines.length < 2 || verticalLines.length < 2) return null;
    if (horizontalLines.length < 3 && verticalLines.length < 3) return null;
    if (horizontalLines.length > 90 || verticalLines.length > 90) return null;

    const cleaned = document.createElement("canvas");
    cleaned.width = sourceCanvas.width;
    cleaned.height = sourceCanvas.height;
    const cleanedCtx = cleaned.getContext("2d");
    if (!cleanedCtx) return null;
    cleanedCtx.fillStyle = "#ffffff";
    cleanedCtx.fillRect(0, 0, cleaned.width, cleaned.height);
    cleanedCtx.drawImage(sourceCanvas, 0, 0);
    const rulePad = Math.max(1, Math.round(raster.scale * 0.55));
    cleanedCtx.fillStyle = "#ffffff";
    for (const y of horizontalLines) cleanedCtx.fillRect(0, Math.max(0, y - rulePad), width, rulePad * 2 + 1);
    for (const x of verticalLines) cleanedCtx.fillRect(Math.max(0, x - rulePad), 0, rulePad * 2 + 1, height);

    const cells: TableCellRegion[] = [];
    for (let row = 0; row < horizontalLines.length - 1; row += 1) {
      const top = horizontalLines[row] + rulePad + 1;
      const bottom = horizontalLines[row + 1] - rulePad - 1;
      if (bottom - top < Math.max(10, Math.round(raster.scale * 4))) continue;
      for (let column = 0; column < verticalLines.length - 1; column += 1) {
        const left = verticalLines[column] + rulePad + 1;
        const right = verticalLines[column + 1] - rulePad - 1;
        if (right - left < Math.max(14, Math.round(raster.scale * 5))) continue;
        let ink = 0;
        const step = Math.max(1, Math.floor(Math.max(right - left, bottom - top) / 240));
        let sampled = 0;
        for (let y = top; y <= bottom; y += step) {
          for (let x = left; x <= right; x += step) {
            sampled += 1;
            if (pixels[(y * width + x) * 4] < 128) ink += 1;
          }
        }
        if (ink < Math.max(3, sampled * 0.0015)) continue;
        const pdfX = left / raster.scale;
        const pdfTop = top / raster.scale;
        const pdfRight = right / raster.scale;
        const pdfBottom = bottom / raster.scale;
        cells.push({
          row, column, x: pdfX, y: Math.max(0, raster.height - pdfBottom),
          width: Math.max(1, pdfRight - pdfX), height: Math.max(1, pdfBottom - pdfTop),
          pixelLeft: left, pixelTop: top, pixelRight: right, pixelBottom: bottom,
        });
      }
    }
    return cells.length >= 2 ? { canvas: cleaned, cells, horizontalLines, verticalLines } : null;
  }, []);

  const markTableHits = useCallback((hits: TextHit[], cells: TableCellRegion[]) => hits.map((hit) => {
    const cx = hit.x + hit.width / 2;
    const cy = hit.y + hit.height / 2;
    const cell = cells.find((candidate) => cx >= candidate.x && cx <= candidate.x + candidate.width && cy >= candidate.y && cy <= candidate.y + candidate.height);
    return cell ? { ...hit, tableRow: cell.row, tableColumn: cell.column, tableCell: { x: cell.x, y: cell.y, width: cell.width, height: cell.height } } : hit;
  }), []);

  const mergeOcrHits = useCallback((groups: TextHit[][]) => {
    const merged: TextHit[] = [];
    const overlapRatio = (a: TextHit, b: TextHit) => {
      const left = Math.max(a.x, b.x); const right = Math.min(a.x + a.width, b.x + b.width);
      const bottom = Math.max(a.y, b.y); const top = Math.min(a.y + a.height, b.y + b.height);
      const area = Math.max(0, right - left) * Math.max(0, top - bottom);
      return area / Math.max(1, Math.min(a.width * a.height, b.width * b.height));
    };
    const quality = (hit: TextHit) => (hit.text ? 1000 : 0) + (hit.confidence ?? 0) + (hit.tableRow !== undefined ? 15 : 0) - (hit.visualFallback ? 400 : 0);
    for (const candidate of groups.flat()) {
      const normalized = candidate.text.replace(/\s+/g, "").toLowerCase();
      const index = merged.findIndex((existing) => {
        const sameText = Boolean(normalized) && existing.text.replace(/\s+/g, "").toLowerCase() === normalized;
        return overlapRatio(existing, candidate) >= (sameText ? 0.34 : 0.68);
      });
      if (index < 0) merged.push(candidate);
      else if (quality(candidate) > quality(merged[index])) merged[index] = candidate;
      else if (merged[index].tableRow === undefined && candidate.tableRow !== undefined) merged[index] = { ...merged[index], tableRow: candidate.tableRow, tableColumn: candidate.tableColumn, tableCell: candidate.tableCell };
    }
    return merged.sort((a, b) => (b.y - a.y) || (a.x - b.x)).slice(0, 5000);
  }, []);


  const groupTableHitsByCell = useCallback((hits: TextHit[]) => {
    const buckets = new Map<string, TextHit[]>();
    for (const hit of hits) {
      if (hit.tableRow === undefined || hit.tableColumn === undefined || !hit.tableCell) continue;
      const key = `${hit.tableRow}:${hit.tableColumn}`;
      const bucket = buckets.get(key) ?? [];
      bucket.push(hit);
      buckets.set(key, bucket);
    }
    const grouped: TextHit[] = [];
    for (const bucket of buckets.values()) {
      const ordered = [...bucket].sort((a, b) => (b.y - a.y) || (a.x - b.x));
      const readable = ordered.filter((hit) => Boolean(hit.text.trim()));
      const base = [...(readable.length ? readable : ordered)].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];
      if (!base) continue;
      const lineTolerance = Math.max(2, ordered.reduce((sum, hit) => sum + hit.height, 0) / Math.max(1, ordered.length) * 0.62);
      const lines: TextHit[][] = [];
      for (const hit of readable) {
        const center = hit.y + hit.height / 2;
        const line = lines.find((items) => {
          const average = items.reduce((sum, item) => sum + item.y + item.height / 2, 0) / items.length;
          return Math.abs(average - center) <= lineTolerance;
        });
        if (line) line.push(hit); else lines.push([hit]);
      }
      lines.sort((a, b) => {
        const ay = a.reduce((sum, item) => sum + item.y + item.height / 2, 0) / a.length;
        const by = b.reduce((sum, item) => sum + item.y + item.height / 2, 0) / b.length;
        return by - ay;
      });
      const text = lines.map((line) => [...line].sort((a, b) => a.x - b.x).map((hit) => hit.text.trim()).filter(Boolean).join(" ")).filter(Boolean).join("\n");
      const geometryHits = readable.length ? readable : ordered;
      const left = Math.min(...geometryHits.map((hit) => hit.x));
      const bottom = Math.min(...geometryHits.map((hit) => hit.y));
      const right = Math.max(...geometryHits.map((hit) => hit.x + hit.width));
      const top = Math.max(...geometryHits.map((hit) => hit.y + hit.height));
      const confidences = readable.map((hit) => hit.confidence).filter((value): value is number => Number.isFinite(value));
      grouped.push({
        ...base,
        id: `ocr-table-cell-hit-${base.sourceIndex}-${base.tableRow}-${base.tableColumn}`,
        text,
        x: left, y: bottom, width: Math.max(4, right - left), height: Math.max(7, top - bottom),
        confidence: confidences.length ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length : base.confidence,
        uncertain: !text || ordered.some((hit) => hit.uncertain),
        visualFallback: !text,
      });
    }
    return grouped.sort((a, b) => ((a.tableRow ?? 0) - (b.tableRow ?? 0)) || ((a.tableColumn ?? 0) - (b.tableColumn ?? 0)));
  }, []);

  const buildOcrContentCrop = useCallback((sourceCanvas: HTMLCanvasElement, binaryCanvas: HTMLCanvasElement, raster: RasterSample) => {
    const binaryCtx = binaryCanvas.getContext("2d", { willReadFrequently: true });
    if (!binaryCtx) return { canvas: sourceCanvas, offsetX: 0, offsetY: 0, scaleFactor: 1 };
    const { width, height } = binaryCanvas;
    const pixels = binaryCtx.getImageData(0, 0, width, height).data;
    let minX = width; let minY = height; let maxX = -1; let maxY = -1;
    const step = Math.max(1, Math.floor(Math.max(width, height) / 1800));
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const offset = (y * width + x) * 4;
        if (pixels[offset] >= 150) continue;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    if (maxX < minX || maxY < minY) return { canvas: sourceCanvas, offsetX: 0, offsetY: 0, scaleFactor: 1 };
    const marginX = Math.max(12, Math.round((maxX - minX + 1) * 0.04));
    const marginY = Math.max(12, Math.round((maxY - minY + 1) * 0.06));
    minX = clamp(minX - marginX, 0, width - 1); maxX = clamp(maxX + marginX, minX + 1, width - 1);
    minY = clamp(minY - marginY, 0, height - 1); maxY = clamp(maxY + marginY, minY + 1, height - 1);
    const cropWidth = Math.max(1, maxX - minX + 1);
    const cropHeight = Math.max(1, maxY - minY + 1);
    const contentRatio = (cropWidth * cropHeight) / Math.max(1, width * height);
    if (contentRatio > 0.92) return { canvas: sourceCanvas, offsetX: 0, offsetY: 0, scaleFactor: 1 };

    const targetMinWidth = Math.min(2600, Math.max(1700, Math.round(raster.width * raster.scale * 0.95)));
    const scaleFactor = clamp(targetMinWidth / cropWidth, 1, 2.2);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(cropWidth * scaleFactor));
    canvas.height = Math.max(1, Math.round(cropHeight * scaleFactor));
    const ctx = canvas.getContext("2d");
    if (!ctx) return { canvas: sourceCanvas, offsetX: 0, offsetY: 0, scaleFactor: 1 };
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sourceCanvas, minX, minY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    return { canvas, offsetX: minX, offsetY: minY, scaleFactor };
  }, []);

  const detectVisualTextRegions = useCallback((raster: RasterSample, sourceIndex: number): TextHit[] => {
    const binaryCanvas = prepareOcrCanvas(raster, "binary");
    const ctx = binaryCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];
    const width = binaryCanvas.width;
    const height = binaryCanvas.height;
    const pixels = ctx.getImageData(0, 0, width, height).data;
    const ink = new Uint8Array(width * height);
    const rowCounts = new Uint32Array(height);
    const colCounts = new Uint32Array(width);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        if (pixels[offset] >= 128) continue;
        const index = y * width + x;
        ink[index] = 1;
        rowCounts[y] += 1;
        colCounts[x] += 1;
      }
    }

    const blockedRows = new Uint8Array(height);
    const blockedCols = new Uint8Array(width);
    const rowRuleThreshold = Math.max(36, Math.round(width * 0.30));
    const colRuleThreshold = Math.max(48, Math.round(height * 0.22));
    for (let y = 0; y < height; y += 1) if (rowCounts[y] >= rowRuleThreshold) {
      for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy += 1) blockedRows[yy] = 1;
    }
    for (let x = 0; x < width; x += 1) if (colCounts[x] >= colRuleThreshold) {
      for (let xx = Math.max(0, x - 1); xx <= Math.min(width - 1, x + 1); xx += 1) blockedCols[xx] = 1;
    }

    const cleanRowCounts = new Uint32Array(height);
    for (let y = 0; y < height; y += 1) {
      if (blockedRows[y]) continue;
      let count = 0;
      for (let x = 0; x < width; x += 1) {
        if (blockedCols[x]) continue;
        count += ink[y * width + x];
      }
      cleanRowCounts[y] = count;
    }

    const activeThreshold = Math.max(2, Math.round(width * 0.001));
    const maxRowGap = Math.max(2, Math.round(raster.scale * 1.1));
    const bands: Array<{ top: number; bottom: number }> = [];
    let start = -1; let lastInk = -1; let gap = 0;
    for (let y = 0; y < height; y += 1) {
      if (cleanRowCounts[y] >= activeThreshold) {
        if (start < 0) start = y;
        lastInk = y; gap = 0;
      } else if (start >= 0) {
        gap += 1;
        if (gap > maxRowGap) {
          bands.push({ top: start, bottom: lastInk });
          start = -1; lastInk = -1; gap = 0;
        }
      }
    }
    if (start >= 0 && lastInk >= start) bands.push({ top: start, bottom: lastInk });

    const hits: TextHit[] = [];
    for (const band of bands) {
      const bandHeight = band.bottom - band.top + 1;
      if (bandHeight < Math.max(3, Math.round(raster.scale * 1.4)) || bandHeight > Math.max(100, Math.round(raster.scale * 42))) continue;
      const columnHasInk = new Uint8Array(width);
      for (let x = 0; x < width; x += 1) {
        if (blockedCols[x]) continue;
        let count = 0;
        for (let y = band.top; y <= band.bottom; y += 1) {
          if (blockedRows[y]) continue;
          count += ink[y * width + x];
        }
        if (count > 0) columnHasInk[x] = 1;
      }
      const raw: Array<{ left: number; right: number }> = [];
      let left = -1; let right = -1;
      for (let x = 0; x < width; x += 1) {
        if (columnHasInk[x]) {
          if (left < 0) left = x;
          right = x;
        } else if (left >= 0) {
          raw.push({ left, right });
          left = -1; right = -1;
        }
      }
      if (left >= 0) raw.push({ left, right });
      const mergeGap = Math.max(2, Math.round(bandHeight * 0.34));
      const merged: Array<{ left: number; right: number }> = [];
      for (const segment of raw) {
        const previous = merged[merged.length - 1];
        if (!previous || segment.left - previous.right - 1 > mergeGap) merged.push({ ...segment });
        else previous.right = segment.right;
      }

      for (const segment of merged) {
        const boxWidth = segment.right - segment.left + 1;
        if (boxWidth < Math.max(4, Math.round(bandHeight * 0.35))) continue;
        let dark = 0;
        for (let y = band.top; y <= band.bottom; y += 1) {
          for (let x = segment.left; x <= segment.right; x += 1) {
            if (blockedRows[y] || blockedCols[x]) continue;
            dark += ink[y * width + x];
          }
        }
        const density = dark / Math.max(1, boxWidth * bandHeight);
        if (density < 0.018 || density > 0.72) continue;
        const padX = Math.max(1, Math.round(raster.scale * 0.6));
        const padY = Math.max(1, Math.round(raster.scale * 0.35));
        const x0 = clamp(segment.left - padX, 0, width - 1);
        const x1 = clamp(segment.right + padX, x0 + 1, width - 1);
        const y0 = clamp(band.top - padY, 0, height - 1);
        const y1 = clamp(band.bottom + padY, y0 + 1, height - 1);
        const x = x0 / raster.scale;
        const top = y0 / raster.scale;
        const right = x1 / raster.scale;
        const bottom = y1 / raster.scale;
        const pdfWidth = Math.max(4, right - x);
        const pdfHeight = Math.max(7, bottom - top);
        const pdfY = Math.max(0, raster.height - bottom);
        hits.push({
          id: `ocr-visual-hit-${sourceIndex}-${hits.length}-${Math.round(x0)}-${Math.round(y0)}`,
          sourceIndex,
          text: "",
          x,
          y: pdfY,
          width: pdfWidth,
          height: pdfHeight,
          fontSize: clamp(Math.max(5.5, (bandHeight / raster.scale) * 1.08), 5.5, 28),
          fontRef: "ocr-visual",
          fontFamily: "Times New Roman",
          loadedFontName: "",
          fontMatch: "ocr" as FontMatch,
          bold: false,
          italic: false,
          ascent: 0.82,
          descent: -0.2,
          horizontalScale: 1,
          ocr: true,
          visualFallback: true,
        });
        if (hits.length >= 1800) return hits;
      }
    }
    return hits;
  }, [prepareOcrCanvas]);

  const collectOcrBoxes = useCallback((data: any, sourceIndex: number, pageWidth: number, pageHeight: number, scale: number, granularity: OcrGranularity, coordinateMap: { offsetX: number; offsetY: number; scaleFactor: number } = { offsetX: 0, offsetY: 0, scaleFactor: 1 }): TextHit[] => {
    const resolvedGranularity: "word" | "line" = granularity === "table" ? "word" : granularity;
    type OcrRow = {
      text: string;
      bbox: { x0: number; y0: number; x1: number; y1: number };
      confidence?: number;
      fontSizeHint?: number;
      fontFamilyHint?: string;
      boldHint?: boolean;
      italicHint?: boolean;
    };
    type TsvWord = OcrRow & { block: string; paragraph: string; line: string };
    const rows: OcrRow[] = [];
    const blocks = Array.isArray(data?.blocks) ? data.blocks : [];

    const parseTsvWords = (): TsvWord[] => {
      const tsv = typeof data?.tsv === "string" ? data.tsv : "";
      if (!tsv.trim()) return [];
      const lines = tsv.replace(/\r/g, "").split("\n").filter(Boolean);
      if (lines.length < 2) return [];
      const header = lines[0].split("\t");
      const indexOf = (name: string) => header.indexOf(name);
      const ix = {
        level: indexOf("level"), block: indexOf("block_num"), paragraph: indexOf("par_num"), line: indexOf("line_num"),
        left: indexOf("left"), top: indexOf("top"), width: indexOf("width"), height: indexOf("height"), conf: indexOf("conf"), text: indexOf("text"),
      };
      if ([ix.level, ix.left, ix.top, ix.width, ix.height, ix.text].some((value) => value < 0)) return [];
      const words: TsvWord[] = [];
      for (const line of lines.slice(1)) {
        const cols = line.split("\t");
        if (Number(cols[ix.level]) !== 5) continue;
        const text = String(cols[ix.text] ?? "").trim();
        if (!text) continue;
        const left = Number(cols[ix.left]); const top = Number(cols[ix.top]);
        const width = Number(cols[ix.width]); const height = Number(cols[ix.height]);
        const confidence = ix.conf >= 0 ? Number(cols[ix.conf]) : 100;
        if (![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0) continue;
        words.push({
          text, confidence: Number.isFinite(confidence) ? confidence : 100,
          bbox: { x0: left, y0: top, x1: left + width, y1: top + height },
          block: ix.block >= 0 ? String(cols[ix.block] ?? "0") : "0",
          paragraph: ix.paragraph >= 0 ? String(cols[ix.paragraph] ?? "0") : "0",
          line: ix.line >= 0 ? String(cols[ix.line] ?? "0") : "0",
        });
      }
      return words;
    };

    const parseHocrRows = (wanted: OcrGranularity): OcrRow[] => {
      const hocr = typeof data?.hocr === "string" ? data.hocr : "";
      if (!hocr.trim() || typeof DOMParser === "undefined") return [];
      try {
        const doc = new DOMParser().parseFromString(hocr, "text/html");
        const selector = wanted === "word" ? ".ocrx_word" : ".ocr_line";
        return Array.from(doc.querySelectorAll(selector)).flatMap((node) => {
          const text = String(node.textContent ?? "").replace(/\s+/g, " ").trim();
          const title = String(node.getAttribute("title") ?? "");
          const match = title.match(/bbox\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/i);
          if (!text || !match) return [];
          const confidenceMatch = title.match(/x_wconf\s+(-?\d+(?:\.\d+)?)/i);
          const fontSizeMatch = title.match(/x_fsize\s+(-?\d+(?:\.\d+)?)/i);
          const fontFamilyMatch = title.match(/x_font\s+([^;]+)/i);
          const boldMatch = title.match(/x_bold\s+(true|false|1|0)/i);
          const italicMatch = title.match(/x_italic\s+(true|false|1|0)/i);
          return [{
            text,
            confidence: confidenceMatch ? Number(confidenceMatch[1]) : 50,
            bbox: { x0: Number(match[1]), y0: Number(match[2]), x1: Number(match[3]), y1: Number(match[4]) },
            fontSizeHint: fontSizeMatch ? Number(fontSizeMatch[1]) : undefined,
            fontFamilyHint: fontFamilyMatch ? fontFamilyMatch[1].trim().replace(/^['"]|['"]$/g, "") : undefined,
            boldHint: boldMatch ? /^(true|1)$/i.test(boldMatch[1]) : undefined,
            italicHint: italicMatch ? /^(true|1)$/i.test(italicMatch[1]) : undefined,
          }];
        });
      } catch {
        return [];
      }
    };

    const tsvWords = parseTsvWords();
    const hocrRows = parseHocrRows(resolvedGranularity);
    if (resolvedGranularity === "word") {
      // hOCR is preferred when available because hocr_font_info supplies a source-size hint.
      // Blocks/TSV remain fallbacks for engines/builds that do not return hOCR geometry.
      if (hocrRows.length) rows.push(...hocrRows);
      if (!rows.length) {
        for (const block of blocks) for (const paragraph of block?.paragraphs ?? []) for (const line of paragraph?.lines ?? []) {
          for (const word of line?.words ?? []) {
            const text = String(word?.text ?? "").trim();
            if (text && word?.bbox) rows.push({
              text, bbox: word.bbox, confidence: word.confidence,
              fontSizeHint: Number.isFinite(word?.pointsize) ? Number(word.pointsize) : undefined,
              fontFamilyHint: typeof word?.font_name === "string" ? word.font_name : undefined,
              boldHint: typeof word?.bold === "boolean" ? word.bold : undefined,
              italicHint: typeof word?.italic === "boolean" ? word.italic : undefined,
            });
          }
        }
      }
      if (!rows.length && Array.isArray(data?.words)) {
        for (const word of data.words) {
          const text = String(word?.text ?? "").trim();
          if (text && word?.bbox) rows.push({
            text, bbox: word.bbox, confidence: word.confidence,
            fontSizeHint: Number.isFinite(word?.pointsize) ? Number(word.pointsize) : undefined,
            fontFamilyHint: typeof word?.font_name === "string" ? word.font_name : undefined,
            boldHint: typeof word?.bold === "boolean" ? word.bold : undefined,
            italicHint: typeof word?.italic === "boolean" ? word.italic : undefined,
          });
        }
      }
      if (!rows.length && tsvWords.length) rows.push(...tsvWords);
    }

    if (resolvedGranularity === "line" && tsvWords.length) {
      const groups = new Map<string, TsvWord[]>();
      for (const word of tsvWords) {
        const key = `${word.block}:${word.paragraph}:${word.line}`;
        groups.set(key, [...(groups.get(key) ?? []), word]);
      }
      for (const words of groups.values()) {
        words.sort((a, b) => a.bbox.x0 - b.bbox.x0);
        rows.push({
          text: words.map((word) => word.text).join(" "),
          confidence: words.reduce((sum, word) => sum + (word.confidence ?? 100), 0) / Math.max(1, words.length),
          bbox: {
            x0: Math.min(...words.map((word) => word.bbox.x0)), y0: Math.min(...words.map((word) => word.bbox.y0)),
            x1: Math.max(...words.map((word) => word.bbox.x1)), y1: Math.max(...words.map((word) => word.bbox.y1)),
          },
        });
      }
    }

    if (!rows.length && resolvedGranularity === "line" && hocrRows.length) rows.push(...hocrRows);

    if (!rows.length) {
      for (const block of blocks) for (const paragraph of block?.paragraphs ?? []) for (const line of paragraph?.lines ?? []) {
        const text = String(line?.text ?? "").trim();
        if (text && line?.bbox) rows.push({ text, bbox: line.bbox, confidence: line.confidence });
      }
    }
    const confidentRows = rows.filter((row) => (row.confidence ?? 100) >= 15);
    const usableRows = confidentRows.length ? confidentRows : rows.filter((row) => (row.confidence ?? 100) >= 0);
    return usableRows.map((row, index) => {
      const mapScale = Math.max(0.0001, coordinateMap.scaleFactor || 1);
      const mappedX0 = coordinateMap.offsetX + row.bbox.x0 / mapScale;
      const mappedY0 = coordinateMap.offsetY + row.bbox.y0 / mapScale;
      const mappedX1 = coordinateMap.offsetX + row.bbox.x1 / mapScale;
      const mappedY1 = coordinateMap.offsetY + row.bbox.y1 / mapScale;
      const x = clamp(mappedX0 / scale, 0, pageWidth);
      const top = clamp(mappedY0 / scale, 0, pageHeight);
      const right = clamp(mappedX1 / scale, x, pageWidth);
      const bottom = clamp(mappedY1 / scale, top, pageHeight);
      const width = Math.max(4, right - x);
      const height = Math.max(5, bottom - top);
      const y = Math.max(0, pageHeight - bottom);
      const confidence = Number.isFinite(row.confidence) ? Number(row.confidence) : 100;
      const cleaned = cleanOcrText(row.text, ocrLanguage, confidence);
      const geometry = cleaned.text ? inferOcrFontStyle(cleaned.text, width, Math.max(4, height * 0.72), 0.12, ocrLanguage) : null;
      const geometryUncertain = Boolean(geometry && geometry.score > 0.42);
      const safeText = cleaned.text;
      const hintedSize = Number.isFinite(row.fontSizeHint) ? Number(row.fontSizeHint) / mapScale / scale : undefined;
      const fontSize = clamp(hintedSize ?? height * 0.68, 5.5, 48);
      return {
        id: `ocr-${resolvedGranularity}-hit-${sourceIndex}-${index}-${Math.round(x)}-${Math.round(y)}`, sourceIndex, text: safeText,
        x, y, width, height, fontSize, fontRef: "ocr", fontFamily: normalizeDetectedFontFamily(row.fontFamilyHint || (ocrLanguage === "eng" ? "Arial" : "Noto Sans")), loadedFontName: "",
        fontMatch: "ocr" as FontMatch, bold: row.boldHint ?? false, italic: row.italicHint ?? false, ascent: 0.78, descent: -0.18, horizontalScale: 1, ocr: true,
        confidence, uncertain: cleaned.uncertain || geometryUncertain,
        ocrFontSizeHint: hintedSize, ocrFontFamilyHint: row.fontFamilyHint, ocrBoldHint: row.boldHint, ocrItalicHint: row.italicHint,
      };
    }).slice(0, 5000);
  }, [ocrLanguage]);

  const cancelOcr = useCallback(() => {
    ocrSessionRef.current += 1;
    ocrRunRef.current = false;
    const worker = ocrWorkerRef.current;
    ocrWorkerRef.current = null;
    if (worker) void terminateOcrWorkerSafely(worker);
    setOcrBusy(false);
    setRestoreRecord(null);
    setHoveredTextHitId(null);
    setStatus("OCR stopped â€” you can retry the current page.");
  }, []);

  const runOcrForSources = useCallback(async (sourceIndexes: number[], automatic = false, granularityOverride?: OcrGranularity) => {
    const pdf = pdfRef.current;
    if (!pdf || ocrRunRef.current) return {} as Record<number, TextHit[]>;
    const requestedSources = [...new Set(sourceIndexes)].filter((sourceIndex) => Number.isInteger(sourceIndex) && sourceIndex >= 0 && sourceIndex < pdf.numPages);
    if (!requestedSources.length) return {} as Record<number, TextHit[]>;
    const requestedGranularity = granularityOverride ?? ocrGranularity;
    const session = ocrSessionRef.current;
    ocrRunRef.current = true;
    const detectedBySource: Record<number, TextHit[]> = {};
    let totalHits = 0;
    let visualFallbackTotal = 0;
    setOcrBusy(true);
    setHoveredTextHitId(null);
    setError("");
    try {
      setStatus("Checking local OCR WebAssembly permissionâ€¦");
      await verifyLocalOcrWasm();
      if (session !== ocrSessionRef.current) return detectedBySource;
      setStatus(automatic ? "Scanned/image page found â€” loading local OCR runtimeâ€¦" : `Loading local OCR runtime for ${requestedGranularity} textâ€¦`);
      const Tesseract = await loadTesseract();
      if (session !== ocrSessionRef.current) return detectedBySource;
      setStatus("Initializing OCR workerâ€¦");
      const ocrBase = `${window.location.origin}${OCR_RUNTIME_BASE}`;
      let lateWorker: Promise<any> | null = null;
      let worker: any = null;
      const logger = (message: any) => {
        if (session !== ocrSessionRef.current) return;
        const stage = String(message?.status ?? "Preparing OCR").replace(/_/g, " ");
        const progress = Number(message?.progress);
        const percent = Number.isFinite(progress) ? ` â€¢ ${Math.max(0, Math.min(100, Math.round(progress * 100)))}%` : "";
        setStatus(`OCR setup â€¢ ${stage}${percent}`);
      };
      const workerPromise = Tesseract.createWorker(ocrLanguage, 1, {
        workerPath: `${ocrBase}/${TESSERACT_WORKER_FILE}`,
        corePath: `${ocrBase}/${TESSERACT_CORE_DIR}`,
        langPath: `${ocrBase}/${TESSERACT_LANG_DIR}`,
        // Use the same-origin worker file directly. This avoids blob bootstrap/CSP edge cases and makes watchdog failures deterministic.
        workerBlobURL: false,
        // Assets are already local; avoiding IndexedDB cache reads/writes prevents stale/corrupt cache stalls.
        cacheMethod: "none",
        gzip: true,
        logger,
        errorHandler: (workerError: unknown) => {
          console.error("AJN PDF OCR worker error", workerError);
        },
      });
      lateWorker = workerPromise;
      try {
        worker = await withOcrTimeout(
          workerPromise,
          45000,
          "Local OCR worker did not initialize within 45 seconds. Refresh the page and retry; AJN PDF stopped the scan instead of leaving it loading forever.",
        );
      } catch (workerError) {
        // If createWorker eventually resolves after the watchdog, terminate that late worker immediately.
        void lateWorker?.then((resolvedWorker) => terminateOcrWorkerSafely(resolvedWorker)).catch(() => undefined);
        throw workerError;
      }
      ocrWorkerRef.current = worker;
      try {
        for (let index = 0; index < requestedSources.length; index += 1) {
          if (session !== ocrSessionRef.current) break;
          const sourceIndex = requestedSources[index];
          setStatus(`Rendering page ${sourceIndex + 1} for OCR â€¢ ${index + 1}/${requestedSources.length}`);
          // Small scanned forms often place tiny text inside a large white page. Render at a higher
          // resolution and run a two-pass local OCR pipeline before giving up on word boxes.
          const raster = await withOcrTimeout(
            renderPageSample(sourceIndex, 2.8),
            25000,
            `Page ${sourceIndex + 1} could not be prepared for OCR within 25 seconds.`,
          );
          const contrastCanvas = prepareOcrCanvas(raster, "contrast");
          const binaryCanvas = prepareOcrCanvas(raster, "binary");
          const contentCrop = buildOcrContentCrop(contrastCanvas, binaryCanvas, raster);
          const recognizePass = async (canvas: HTMLCanvasElement, psm: string, label: string) => {
            if (typeof worker.setParameters === "function") {
              await withOcrTimeout(
                Promise.resolve(worker.setParameters({ tessedit_pageseg_mode: psm, preserve_interword_spaces: "1", user_defined_dpi: "300", hocr_font_info: "1" })),
                12000,
                `OCR ${label} setup did not finish in time.`,
              );
            }
            setStatus(`Recognising page ${sourceIndex + 1} â€¢ ${label} â€¢ ${ocrLanguage.toUpperCase()} â€¢ ${requestedGranularity}`);
            return withOcrTimeout<OcrRecognizeResult>(
              Promise.resolve(worker.recognize(canvas, {}, { text: true, tsv: true, hocr: true, blocks: true })) as Promise<OcrRecognizeResult>,
              90000,
              `OCR page ${sourceIndex + 1} ${label} pass exceeded 90 seconds and was cancelled.`,
            );
          };

          const tableGrid = detectTableGrid(raster, binaryCanvas, contrastCanvas);
          const cropMap = { offsetX: contentCrop.offsetX, offsetY: contentCrop.offsetY, scaleFactor: contentCrop.scaleFactor };
          const hitGroups: TextHit[][] = [];
          let result: OcrRecognizeResult | null = null;

          // Normal document pass remains useful for paragraphs, labels and text outside tables.
          if (requestedGranularity !== "table") {
            result = await recognizePass(contentCrop.canvas, "6", contentCrop.scaleFactor > 1.01 || contentCrop.offsetX > 0 || contentCrop.offsetY > 0 ? "focused document area" : "enhanced document");
            hitGroups.push(collectOcrBoxes(result?.data ?? {}, sourceIndex, raster.width, raster.height, raster.scale, requestedGranularity, cropMap));
          }

          // Table-aware OCR removes long grid rules before recognition and maps each word back to its original cell.
          if (tableGrid && requestedGranularity !== "line") {
            setStatus(`Table detected on page ${sourceIndex + 1} â€¢ recognising cell textâ€¦`);
            const tableResult = await recognizePass(tableGrid.canvas, "6", "table grid removed");
            let tableHits = collectOcrBoxes(tableResult?.data ?? {}, sourceIndex, raster.width, raster.height, raster.scale, "word");
            tableHits = markTableHits(tableHits, tableGrid.cells);
            hitGroups.push(tableHits);
            const tableTextCount = tableHits.filter((hit) => hit.text).length;
            if (requestedGranularity === "table" || tableTextCount < Math.max(4, Math.round(tableGrid.cells.length * 0.45))) {
              const sparseTableResult = await recognizePass(tableGrid.canvas, "11", "table sparse text");
              hitGroups.push(markTableHits(collectOcrBoxes(sparseTableResult?.data ?? {}, sourceIndex, raster.width, raster.height, raster.scale, "word"), tableGrid.cells));
            }
          }

          let hits = mergeOcrHits(hitGroups);
          const readableHits = hits.filter((hit) => Boolean(hit.text));
          const sourceTextLength = String(result?.data?.text ?? "").trim().length;
          const shouldRetrySparse = requestedGranularity !== "table" && (readableHits.length < 4 || (sourceTextLength > 28 && readableHits.length < 7));
          if (shouldRetrySparse) {
            setStatus(`Improving OCR boxes on page ${sourceIndex + 1} with high-contrast sparse-text recognitionâ€¦`);
            const sparseResult = await recognizePass(binaryCanvas, "11", "high-contrast sparse text");
            hitGroups.push(collectOcrBoxes(sparseResult?.data ?? {}, sourceIndex, raster.width, raster.height, raster.scale, requestedGranularity === "line" ? "line" : "word"));
            hits = mergeOcrHits(hitGroups);
          }

          // Keep visual word-like regions for unread table cells and difficult scans. They stay blank until
          // the user types a replacement, so the editor never invents text that OCR did not read.
          const visualRegions = detectVisualTextRegions(raster, sourceIndex);
          const tableVisualRegions = tableGrid ? markTableHits(visualRegions, tableGrid.cells).filter((hit) => hit.tableRow !== undefined) : [];
          if (requestedGranularity === "table" && tableGrid) {
            const recognizedTableHits = hits.filter((hit) => hit.tableRow !== undefined && Boolean(hit.text.trim()));
            const outsideTableHits = hits.filter((hit) => hit.tableRow === undefined);
            const recognizedCellKeys = new Set(recognizedTableHits.map((hit) => `${hit.tableRow}:${hit.tableColumn}`));
            const unreadCellRegions = tableVisualRegions.filter((hit) => !recognizedCellKeys.has(`${hit.tableRow}:${hit.tableColumn}`));
            const tableCells = groupTableHitsByCell([...recognizedTableHits, ...unreadCellRegions]);
            hits = mergeOcrHits([outsideTableHits, tableCells]);
          }
          if (!hits.length) {
            setStatus(`OCR could not read reliable labels â€¢ detecting editable image-text regions on page ${sourceIndex + 1}â€¦`);
            hits = visualRegions;
          }
          visualFallbackTotal += hits.filter((hit) => hit.visualFallback).length;
          detectedBySource[sourceIndex] = hits;
          totalHits += hits.length;
          setTextHits((current) => {
            // Force-OCR must work even when a scanned PDF carries a small/hidden native text layer.
            // Keep genuine native PDF hits and replace only the previous OCR layer.
            const nativeHits = (current[sourceIndex] ?? []).filter((hit) => !hit.ocr);
            return { ...current, [sourceIndex]: [...nativeHits, ...hits] };
          });
          await new Promise((resolve) => window.setTimeout(resolve, 0));
        }
      } finally {
        if (ocrWorkerRef.current === worker) ocrWorkerRef.current = null;
        await terminateOcrWorkerSafely(worker);
      }
      if (session === ocrSessionRef.current) {
        setShowImageHits(false);
        setMode("select");
        if (totalHits > 0) {
          if (visualFallbackTotal > 0) {
            setStatus(`Image-text regions ready â€¢ ${totalHits} editable region${totalHits === 1 ? "" : "s"} â€” OCR could not read every label, so hover a violet region, click once, and type the replacement`);
            setError("");
          } else {
            setStatus(`OCR ready â€¢ ${totalHits} editable ${requestedGranularity === "table" ? "table/word" : requestedGranularity} box${totalHits === 1 ? "" : "es"} â€” hover text, click once, then type`);
          }
        } else {
          setStatus("No editable text regions were detected on this page");
          setError("AJN PDF could not find OCR boxes or safe visual text regions on this scan. Try a clearer source image or use Add text/whiteout.");
        }
      }
      return detectedBySource;
    } catch (caught) {
      if (session !== ocrSessionRef.current) {
        setStatus("OCR stopped â€” you can retry the current page.");
        return detectedBySource;
      }
      setError(`${caught instanceof Error ? caught.message : "OCR could not run."} The PDF itself was not uploaded; manual text/whiteout tools remain available.`);
      setStatus("OCR unavailable");
      return detectedBySource;
    } finally {
      if (session === ocrSessionRef.current) {
        ocrRunRef.current = false;
        setOcrBusy(false);
      }
    }
  }, [buildOcrContentCrop, collectOcrBoxes, detectTableGrid, detectVisualTextRegions, groupTableHitsByCell, markTableHits, mergeOcrHits, ocrGranularity, ocrLanguage, prepareOcrCanvas, renderPageSample]);

  const scanCurrentPage = useCallback(async (granularity: OcrGranularity = ocrGranularity) => {
    if (activeSourceIndex === undefined || ocrBusy) return;
    setOcrGranularity(granularity);
    await runOcrForSources([activeSourceIndex], false, granularity);
  }, [activeSourceIndex, ocrBusy, ocrGranularity, runOcrForSources]);

  const scanAllPages = useCallback(async () => {
    if (!uniqueSourceIndexes.length || ocrBusy) return;
    await runOcrForSources(uniqueSourceIndexes, false, ocrGranularity);
  }, [ocrBusy, ocrGranularity, runOcrForSources, uniqueSourceIndexes]);

  const extractPageModel = useCallback(async (pdf: any) => {
    const hitMap: Record<number, TextHit[]> = {};
    const imageMap: Record<number, ImageHit[]> = {};
    const thumbMap: Record<number, string> = {};
    const ocrCandidatePages: number[] = [];
    const warnings: string[] = [];
    for (let sourceIndex = 0; sourceIndex < pdf.numPages; sourceIndex += 1) {
      if (pdfRef.current !== pdf) return { ocrCandidatePages: [], warnings: [] };
      let page: any = null;
      try {
        page = await pdf.getPage(sourceIndex + 1);
      } catch {
        hitMap[sourceIndex] = [];
        imageMap[sourceIndex] = [];
        ocrCandidatePages.push(sourceIndex);
        warnings.push(`page ${sourceIndex + 1} could not be inspected`);
        continue;
      }

      try {
        const thumbViewport = page.getViewport({ scale: 0.18 });
        const thumbCanvas = document.createElement("canvas");
        thumbCanvas.width = Math.max(1, Math.floor(thumbViewport.width));
        thumbCanvas.height = Math.max(1, Math.floor(thumbViewport.height));
        const thumbCtx = thumbCanvas.getContext("2d");
        if (thumbCtx) {
          await page.render({ canvasContext: thumbCtx, viewport: thumbViewport }).promise;
          if (sourceIndex < 100) thumbMap[sourceIndex] = thumbCanvas.toDataURL("image/jpeg", 0.6);
        }
      } catch {
        warnings.push(`page ${sourceIndex + 1} thumbnail skipped`);
      }

      const hits: TextHit[] = [];
      try {
        const content = await page.getTextContent();
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
          const bold = /(bold|black|heavy|demi|semibold|semi-bold)/.test(fontMeta);
          const italic = /(italic|oblique)/.test(fontMeta);
          const ascent = Number.isFinite(style.ascent) ? Number(style.ascent) : 0.82;
          const descent = Number.isFinite(style.descent) ? Number(style.descent) : -0.2;
          const width = Math.max(3, Number(item.width) || String(item.str).length * fontSize * 0.45);
          const height = Math.max(fontSize * Math.max(0.7, ascent - descent), Number(item.height) || fontSize);
          const familyLower = fontFamily.toLowerCase();
          const loadedAvailable = Boolean(loadedFontName) && Boolean(document.fonts?.check?.(`12px "${safeFontToken(loadedFontName)}"`));
          const refAvailable = Boolean(item.fontName) && Boolean(document.fonts?.check?.(`12px "${safeFontToken(String(item.fontName))}"`));
          const familySpecific = Boolean(fontFamily) && !genericFontFamilies.has(familyLower);
          const familyAvailable = familySpecific && Boolean(document.fonts?.check?.(`12px "${safeFontToken(fontFamily)}"`));
          const fontMatch: FontMatch = loadedAvailable || refAvailable ? "exact" : familyAvailable ? "family" : "fallback";
          const measureCanvas = document.createElement("canvas");
          const measureCtx = measureCanvas.getContext("2d");
          let horizontalScale = 1;
          if (measureCtx) {
            measureCtx.font = `${italic ? "italic" : "normal"} ${bold ? 700 : 400} ${fontSize}px ${cssFontFamily({ loadedFontName, fontFamily, fontRef: String(item.fontName || "") })}`;
            const measured = measureCtx.measureText(String(item.str)).width;
            if (measured > 0.1) horizontalScale = clamp(width / measured, 0.35, 2.5);
          }
          hits.push({
            id: `hit-${sourceIndex}-${index}`, sourceIndex, text: String(item.str), x: Number(transform[4]) || 0, y: Number(transform[5]) || 0,
            width, height, fontSize, fontRef: String(item.fontName || ""), fontFamily, loadedFontName, fontMatch,
            bold, italic, ascent, descent, horizontalScale,
          });
        });
      } catch {
        warnings.push(`page ${sourceIndex + 1} text analysis skipped`);
      }
      hitMap[sourceIndex] = hits;

      let rawImageHits: ImageHit[] = [];
      let hasPageRaster = false;
      try {
        const baseViewport = page.getViewport({ scale: 1, rotation: 0 });
        rawImageHits = await imageHitsFromOperators(page, sourceIndex);
        hasPageRaster = rawImageHits.some((hit) => isPageBackgroundImageHit(hit, baseViewport.width, baseViewport.height, hits.length));
        imageMap[sourceIndex] = rawImageHits.filter((hit) => !isPageBackgroundImageHit(hit, baseViewport.width, baseViewport.height, hits.length));
      } catch {
        imageMap[sourceIndex] = [];
        warnings.push(`page ${sourceIndex + 1} image analysis skipped`);
      }

      // Missing text, a full-page raster, or failed optional analysis should never block preview.
      if (!hits.length || hasPageRaster) ocrCandidatePages.push(sourceIndex);
      if (pdfRef.current !== pdf) return { ocrCandidatePages: [], warnings: [] };
      setTextHits({ ...hitMap });
      setImageHits({ ...imageMap });
      setThumbnails({ ...thumbMap });
      if (sourceIndex % 3 === 0) {
        setStatus(`Preview ready â€¢ analysing page ${sourceIndex + 1} of ${pdf.numPages}â€¦`);
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
    }
    if (pdfRef.current !== pdf) return { ocrCandidatePages: [], warnings: [] };
    return { ocrCandidatePages: [...new Set(ocrCandidatePages)], warnings };
  }, []);

  // Picker, drop, retry and recovery all enter this single document transaction.
  const openFile = useCallback(async (nextFile: File, restore?: RestoreRecord) => {
    const attempt = ++uploadAttemptRef.current;
    ocrSessionRef.current += 1;
    const previousTask = loadingTaskRef.current;
    loadingTaskRef.current = null;
    pdfRef.current = null;
    analysedPdfRef.current = null;
    fileBytesRef.current = null;
    void previousTask?.destroy().catch(() => undefined);
    if (ocrWorkerRef.current) void terminateOcrWorkerSafely(ocrWorkerRef.current);
    ocrWorkerRef.current = null;
    ocrRunRef.current = false;
    setOcrBusy(false);
    openingPdfRef.current = true;
    pendingPdfRef.current = nextFile;
    setWorkspaceMode("editor");
    setFile(nextFile);
    setPendingPdf(nextFile);
    setSelectedPdfName(nextFile.name);
    setLoading(true);
    setPdfEngineReady(false);
    setCanvasPreviewReady(false);
    setPreviewError("");
    setError("");
    setPages([]);
    setObjects([]);
    setTextHits({});
    setImageHits({});
    setThumbnails({});
    setHistory([]);
    setFuture([]);
    clearSelection();
    setUploadStage("reading");
    setStatus(`Opening ${nextFile.name}â€¦`);
    let task: any = null;
    const current = () => attempt === uploadAttemptRef.current;
    try {
      const validation = await withOcrTimeout(validatePdfFile(nextFile, MAX_FILE_MB), 15000, "Reading this PDF timed out. Try a local copy.");
      if (validation) throw new Error(validation);
      if (!current()) return false;
      const bytes = await withOcrTimeout(nextFile.arrayBuffer(), 20000, "Reading this PDF timed out.");
      if (!current()) return false;
      setUploadStage("parsing");
      initPdfWorker();
      task = pdfjsLib.getDocument({ useSystemFonts: false, standardFontDataUrl: "/pdfjs/standard_fonts/", cMapUrl: "/pdfjs/cmaps/", cMapPacked: true, data: new Uint8Array(bytes.slice(0)), isEvalSupported: false });
      loadingTaskRef.current = task;
      const pdf = await withOcrTimeout<any>(task.promise, 45000, "Opening this PDF timed out. Retry or choose another file.");
      if (!current()) { await task.destroy(); return false; }
      if (!pdf.numPages || pdf.numPages > MAX_PAGES) throw new Error(`Choose a PDF with 1â€“${MAX_PAGES} pages.`);
      // Encrypted inputs must be explicitly unlocked, never silently exported with permissions bypassed.
      await PDFDocument.load(bytes.slice(0), { ignoreEncryption: false, updateMetadata: false });
      if (!current()) { await task.destroy(); return false; }
      const restoredPages = restore?.pages?.filter((page) => Number.isInteger(page.sourceIndex) && page.sourceIndex >= 0 && page.sourceIndex < pdf.numPages && typeof page.instanceId === "string");
      const initialPages = restoredPages?.length ? clonePages(restoredPages) : Array.from({ length: pdf.numPages }, (_, sourceIndex) => ({ instanceId: uid("page"), sourceIndex, rotation: 0 }));
      const firstPage = await pdf.getPage(initialPages[0].sourceIndex + 1);
      if (!current()) return false;
      const viewport = firstPage.getViewport({ scale: 1, rotation: 0 });
      fileBytesRef.current = bytes;
      pdfRef.current = pdf;
      setPageSize({ width: viewport.width, height: viewport.height });
      if (restore) {
        const restored = await sanitizeRestoredObjectsForPdf(restore.objects, initialPages, pdf, restore.schemaVersion !== 70);
        if (!current()) return false;
        setObjects(restored);
        setRestoreRecord(null);
      }
      setPages(initialPages);
      setActivePageId(initialPages[0].instanceId);
      setPdfEngineReady(true);
      setUploadStage("ready");
      setStatus(`Rendering page 1 of ${pdf.numPages}â€¦`);
      setPendingPdf(null);
      pendingPdfRef.current = null;
      return true;
    } catch (caught) {
      void task?.destroy().catch(() => undefined);
      if (!current()) return false;
      pdfRef.current = null;
      fileBytesRef.current = null;
      setPdfEngineReady(false);
      setUploadStage("error");
      const message = caught instanceof Error ? caught.message : "This PDF could not be opened.";
      setError(/password|encrypt/i.test(message) ? "This PDF is password protected. Unlock a copy using Unlock PDF, then open it here." : message);
      setStatus("Choose another PDF or retry opening this file.");
      return false;
    } finally {
      if (current()) { openingPdfRef.current = false; setLoading(false); }
    }
  }, [clearSelection]);

  // Optional inspection starts only after a real canvas has rendered successfully.
  useEffect(() => {
    const pdf = pdfRef.current;
    if (!canvasPreviewReady || !pdf || analysedPdfRef.current === pdf) return;
    analysedPdfRef.current = pdf;
    setUploadStage("analysing");
    void extractPageModel(pdf).then(({ ocrCandidatePages, warnings }) => {
      if (pdfRef.current !== pdf) return;
      setUploadStage("ready");
      setStatus(warnings.length ? "Preview ready. Some content could not be detected; you can still add edits." : ocrCandidatePages.length ? "Preview ready. Use Scan page to recognize text in scanned pages." : "Preview ready. Click detected text to edit it.");
    }).catch(() => {
      if (pdfRef.current === pdf) { setUploadStage("ready"); setStatus("Preview ready. Content detection is unavailable; you can still add edits."); }
    });
  }, [canvasPreviewReady, extractPageModel]);

  const retryEditorEngine = useCallback(() => {
    const retryFile = pendingPdfRef.current ?? pendingPdf ?? file;
    if (!retryFile) {
      setError("Choose a PDF first, then retry the editor engine.");
      return;
    }
    if (openingPdfRef.current) {
      setStatus(`Editor engine is still opening ${retryFile.name}â€¦`);
      return;
    }
    void openFile(retryFile);
  }, [file, openFile, pendingPdf]);

  const restoreSession = async () => {
    if (!restoreRecord) return;
    const restoredFile = new File([restoreRecord.fileBlob], restoreRecord.fileName, { type: "application/pdf", lastModified: restoreRecord.fileLastModified });
    await openFile(restoredFile, restoreRecord);
  };

  useEffect(() => {
    if (!activePage || !pdfRef.current) {
      setCanvasPreviewReady(false);
      return;
    }
    let cancelled = false;
    let activeRenderTask: any = null;

    const renderIntoCanvas = async (page: any, viewport: any, canvas: HTMLCanvasElement, ratio: number) => {
      canvas.width = Math.max(1, Math.ceil(viewport.width * ratio));
      canvas.height = Math.max(1, Math.ceil(viewport.height * ratio));
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("PDF preview canvas is unavailable.");
      if (typeof ctx.resetTransform === "function") ctx.resetTransform();
      else ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      activeRenderTask = page.render({
        canvasContext: ctx,
        viewport,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
        background: "rgb(255,255,255)",
      });
      await withOcrTimeout(activeRenderTask.promise, 30000, "PDF preview rendering timed out after 30 seconds.");
    };

    const render = async () => {
      setCanvasPreviewReady(false);
      setPreviewRendering(true);
      setPreviewError("");
      try {
        const page = await withOcrTimeout<any>(pdfRef.current.getPage(activePage.sourceIndex + 1), 15000, "This PDF page could not be loaded for preview.");
        const baseViewport = page.getViewport({ scale: 1, rotation: 0 });
        if (!cancelled) { setPageSize({ width: baseViewport.width, height: baseViewport.height }); setSourceRotation(page.rotate || 0); }
        const viewport = page.getViewport({ scale: zoom, rotation: 0 });
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("PDF preview surface is not mounted yet.");
        const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        try {
          await renderIntoCanvas(page, viewport, canvas, ratio);
        } catch (primaryError) {
          if (cancelled) return;
          // Conservative fallback for browser/GPU/canvas edge cases: render at CSS resolution.
          try { activeRenderTask?.cancel?.(); } catch { /* no-op */ }
          activeRenderTask = null;
          await renderIntoCanvas(page, viewport, canvas, 1);
          if (!cancelled) setStatus("Preview ready â€¢ compatibility canvas mode enabled");
          void primaryError;
        }
        if (!cancelled) {
          setCanvasPreviewReady(true);
          setPdfEngineReady(true);
        }
      } catch (caught) {
        if (!cancelled) {
          const message = caught instanceof Error ? caught.message : "This page could not be rendered.";
          setCanvasPreviewReady(false);
          setPreviewError(message);
          setError(`Page preview failed: ${message}. Retry the preview or choose another PDF.`);
        }
      } finally {
        if (!cancelled) setPreviewRendering(false);
      }
    };
    void render();
    return () => {
      cancelled = true;
      try { activeRenderTask?.cancel?.(); } catch { /* no-op */ }
    };
  }, [activePage, previewRenderNonce, zoom]);

  const screenToPdf = useCallback((clientX: number, clientY: number) => {
    const surface = pageSurfaceRef.current;
    if (!surface) return { x: 0, y: 0 };
    const rect = surface.getBoundingClientRect();
    const dx = (clientX - rect.left) / zoom, dy = (clientY - rect.top) / zoom;
    const [x, top] = viewRotation === 90 ? [dy, pageSize.height - dx] : viewRotation === 180 ? [pageSize.width - dx, pageSize.height - dy] : viewRotation === 270 ? [pageSize.width - dy, dx] : [dx, dy];
    return { x: clamp(x, 0, pageSize.width), y: clamp(pageSize.height - top, 0, pageSize.height) };
  }, [pageSize.height, pageSize.width, viewRotation, zoom]);

  const replaceTextHit = useCallback(async (hit: TextHit, pageInstanceId = activePage?.instanceId, focus = true) => {
    if (!pageInstanceId || convertedSourceIds.has(hit.id)) return;
    setStatus("Matching original text styleâ€¦");
    try {
      const raster = await renderPageSample(hit.sourceIndex, hit.ocr ? 3.2 : 1.45);
      const pair = buildEditablePair(hit, pageInstanceId, raster);
      commitMutation(() => {
        setObjects((current) => [...current, pair.whiteout, pair.text]);
        if (focus) { selectOnly(pair.text.id); setInlineEditingId(pair.text.id); }
        setMode("select");
      });
      setStatus(hit.visualFallback || hit.uncertain ? "Image-text region ready â€” OCR was uncertain, type the replacement" : hit.ocr ? "OCR text converted with matched size/color/font estimate" : "Existing text converted to editable text");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Text could not be made editable.");
    }
  }, [activePage?.instanceId, buildEditablePair, commitMutation, convertedSourceIds, renderPageSample, selectOnly]);

  const activateTextHit = useCallback(async (hit: TextHit, pageInstanceId = activePage?.instanceId) => {
    if (!pageInstanceId || activatingTextHitId || convertedSourceIds.has(hit.id)) return;
    setActivatingTextHitId(hit.id);
    setHoveredTextHitId(hit.id);
    try {
      await replaceTextHit(hit, pageInstanceId, true);
    } finally {
      setActivatingTextHitId(null);
      setHoveredTextHitId(null);
    }
  }, [activePage?.instanceId, activatingTextHitId, convertedSourceIds, replaceTextHit]);

  const rematchSelectedTextStyle = useCallback(async () => {
    const item = selectedObject;
    if (!item || item.type !== "text" || !item.sourceHitId || loading || ocrBusy) return;
    const hit = sourceHitById.get(item.sourceHitId);
    if (!hit) { setStatus("Original text style source is no longer available for this object."); return; }
    setLoading(true);
    setError("");
    setStatus("Re-sampling original font, size and text colourâ€¦");
    try {
      const raster = await renderPageSample(hit.sourceIndex, hit.ocr ? 3.4 : 1.8);
      const matched = buildEditablePair(hit, item.pageInstanceId, raster).text;
      let fontSize = matched.fontSize;
      const horizontalScale = matched.horizontalScale;
      let width = Math.max(hit.width, matched.width);
      let height = Math.max(hit.height, matched.height);
      if (!textMeasureCanvasRef.current) textMeasureCanvasRef.current = document.createElement("canvas");
      const ctx = textMeasureCanvasRef.current.getContext("2d");
      if (ctx && item.text) {
        const probe = { ...item, fontFamily: matched.fontFamily, fontSize: matched.fontSize, bold: matched.bold, italic: matched.italic } as TextObject;
        ctx.font = cssFont(probe, matched.fontSize);
        const lines = item.text.split(/\r?\n/);
        const measured = Math.max(1, ...lines.map((line) => ctx.measureText(line || " ").width)) * horizontalScale;
        const cell = hit.tableCell;
        const maxWidth = cell ? Math.max(MIN_OBJECT_SIZE, cell.x + cell.width - item.x - 1) : Math.max(MIN_OBJECT_SIZE, hit.width * 1.08);
        const maxHeight = cell ? Math.max(MIN_OBJECT_SIZE, cell.y + cell.height - item.y - 1) : Math.max(MIN_OBJECT_SIZE, hit.height * 1.18);
        const fit = Math.min(1, maxWidth / measured, maxHeight / Math.max(1, lines.length * matched.fontSize * matched.lineHeight));
        fontSize = clamp(matched.fontSize * fit, 5, matched.fontSize);
        width = clamp(Math.max(hit.width, Math.min(measured * (fontSize / matched.fontSize) + 2, maxWidth)), MIN_OBJECT_SIZE, maxWidth);
        height = clamp(Math.max(hit.height, lines.length * fontSize * matched.lineHeight + 1), MIN_OBJECT_SIZE, maxHeight);
      }
      updateObject(item.id, {
        fontFamily: matched.fontFamily, loadedFontName: matched.loadedFontName, fontMatch: matched.fontMatch, renderMode: "visual-match",
        fontSize, matchedFontSize: matched.fontSize, color: matched.color, bold: matched.bold, italic: matched.italic,
        horizontalScale, matchedHorizontalScale: horizontalScale, lineHeight: matched.lineHeight, baselineOffset: matched.baselineOffset,
        width, height, autoStyle: true, styleConfidence: matched.styleConfidence,
      } as Partial<EditorObject>, true);
      setStatus(`Original style matched automatically â€¢ ${matched.fontFamily} â€¢ ${matched.fontSize.toFixed(1)} pt â€¢ ${matched.color}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Original text style could not be re-sampled.");
    } finally {
      setLoading(false);
    }
  }, [buildEditablePair, loading, ocrBusy, renderPageSample, selectedObject, sourceHitById, updateObject]);

  const makeDetectedScanTextEditable = useCallback(async (tableOnly = false) => {
    if (!activePage || activeSourceIndex === undefined || loading || ocrBusy) return;
    const hits = (textHits[activeSourceIndex] ?? []).filter((hit) =>
      hit.ocr && !hit.visualFallback && !convertedSourceIds.has(hit.id) && (!tableOnly || hit.tableRow !== undefined));
    if (!hits.length) {
      setStatus(tableOnly ? "No recognized table words are waiting to be converted" : "No recognized scan words are waiting to be converted");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const raster = await renderPageSample(activeSourceIndex, 2.4);
      const additions: EditorObject[] = [];
      const created: string[] = [];
      for (const hit of hits) {
        const pair = buildEditablePair(hit, activePage.instanceId, raster);
        additions.push(pair.whiteout, pair.text);
        created.push(pair.text.id);
      }
      commitMutation(() => {
        setObjects((current) => [...current, ...additions]);
        setSelectedIds(created.length ? [created[0]] : []);
        setMode("select");
      });
      setStatus(`${created.length} ${tableOnly ? "table cell" : "scan word"}${created.length === 1 ? "" : "s"} made editable â€” double-click any ${tableOnly ? "cell" : "word"} to type`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Detected scan text could not be converted safely.");
    } finally {
      setLoading(false);
    }
  }, [activePage, activeSourceIndex, buildEditablePair, commitMutation, convertedSourceIds, loading, ocrBusy, renderPageSample, textHits]);

  const bulkMakeEditable = useCallback(async (scope: "page" | "document") => {
    if (!pages.length) return;
    setLoading(true);
    setError("");
    try {
      const targetPages = scope === "page" && activePage ? [activePage] : pages;
      const newObjects: EditorObject[] = [];
      const createdIds: string[] = [];
      for (let pageIndex = 0; pageIndex < targetPages.length; pageIndex += 1) {
        const page = targetPages[pageIndex];
        const hits = (textHits[page.sourceIndex] ?? []).filter((hit) => !hit.visualFallback && !convertedSourceIds.has(hit.id));
        if (!hits.length) continue;
        setStatus(`Making text editable â€¢ page ${pages.findIndex((value) => value.instanceId === page.instanceId) + 1} â€¢ ${pageIndex + 1}/${targetPages.length}`);
        const raster = await renderPageSample(page.sourceIndex, 1.35);
        for (const hit of hits) {
          const pair = buildEditablePair(hit, page.instanceId, raster);
          newObjects.push(pair.whiteout, pair.text);
          createdIds.push(pair.text.id);
        }
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
      if (!newObjects.length) { setStatus("All detected text in this scope is already editable"); return; }
      commitMutation(() => {
        setObjects((current) => [...current, ...newObjects]);
        setSelectedIds(createdIds.length ? [createdIds[0]] : []);
        setMode("select");
      });
      setStatus(`${createdIds.length} text block${createdIds.length === 1 ? "" : "s"} made editable â€” click any text to select, double-click to type`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bulk text conversion stopped safely.");
    } finally {
      setLoading(false);
    }
  }, [activePage, buildEditablePair, commitMutation, convertedSourceIds, pages, renderPageSample, textHits]);

  const replaceAllMatches = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;
    setLoading(true);
    setError("");
    try {
      const lower = query.toLowerCase();
      const additions: EditorObject[] = [];
      let detectedCount = 0;
      const pageGroups = new Map<number, Array<{ page: PageInstance; hit: TextHit }>>();
      pages.forEach((page) => {
        (textHits[page.sourceIndex] ?? []).forEach((hit) => {
          if (hit.text.toLowerCase().includes(lower) && !convertedSourceIds.has(hit.id)) {
            const group = pageGroups.get(page.sourceIndex) ?? [];
            group.push({ page, hit });
            pageGroups.set(page.sourceIndex, group);
          }
        });
      });
      for (const [sourceIndex, group] of pageGroups) {
        setStatus(`Preparing Find & Replace on page ${sourceIndex + 1}â€¦`);
        const raster = await renderPageSample(sourceIndex, 1.35);
        for (const { page, hit } of group) {
          const pair = buildEditablePair(hit, page.instanceId, raster);
          pair.text.text = pair.text.text.replace(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), replaceValue);
          additions.push(pair.whiteout, pair.text);
          detectedCount += 1;
        }
      }
      let editableCount = 0;
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matcher = new RegExp(escaped, "gi");
      commitMutation(() => {
        setObjects((current) => [
          ...current.map((item) => {
            if (item.type !== "text" || !item.text.toLowerCase().includes(lower)) return item;
            editableCount += 1;
            return { ...item, text: item.text.replace(matcher, replaceValue) };
          }),
          ...additions,
        ]);
        clearSelection();
      });
      setStatus(`Find & Replace complete â€¢ ${detectedCount + editableCount} text block${detectedCount + editableCount === 1 ? "" : "s"} updated`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Find & Replace could not complete.");
    } finally {
      setLoading(false);
    }
  }, [buildEditablePair, clearSelection, commitMutation, convertedSourceIds, pages, renderPageSample, replaceValue, searchQuery, textHits]);

  const replaceImageHit = useCallback(async (hit: ImageHit) => {
    if (!activePage || convertedSourceIds.has(hit.id)) return;
    try {
      setStatus("Preparing existing image for editingâ€¦");
      const raster = await renderPageSample(hit.sourceIndex, 1.8);
      const crop = document.createElement("canvas");
      crop.width = Math.max(1, Math.round(hit.width * raster.scale));
      crop.height = Math.max(1, Math.round(hit.height * raster.scale));
      const ctx = crop.getContext("2d");
      if (!ctx) throw new Error("Image crop canvas is unavailable.");
      const sx = Math.round(hit.x * raster.scale);
      const sy = Math.round((raster.height - hit.y - hit.height) * raster.scale);
      ctx.drawImage(raster.canvas, sx, sy, crop.width, crop.height, 0, 0, crop.width, crop.height);
      const cover: RectObject = {
        id: uid("image-cover"), type: "whiteout", sourceHitId: hit.id, pageInstanceId: activePage.instanceId,
        x: hit.x, y: hit.y, width: hit.width, height: hit.height, rotation: 0, opacity: 1, fill: "#ffffff", stroke: "#ffffff", strokeWidth: 0,
      };
      const image: ImageObject = {
        id: uid("existing-image"), type: "image", sourceHitId: hit.id, pageInstanceId: activePage.instanceId,
        x: hit.x, y: hit.y, width: hit.width, height: hit.height, rotation: 0, opacity: 1, dataUrl: crop.toDataURL("image/png"),
      };
      commitMutation(() => { setObjects((current) => [...current, cover, image]); selectOnly(image.id); });
      setStatus("Existing image is now movable, resizable and replaceable");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Existing image could not be extracted.");
    }
  }, [activePage, commitMutation, convertedSourceIds, renderPageSample, selectOnly]);

  const replaceSelectedImageFile = useCallback(async (picked: File) => {
    if (!selectedObject || selectedObject.type !== "image") return;
    try {
      const normalized = await normalizeImageToPng(picked);
      updateObject(selectedObject.id, { dataUrl: normalized.dataUrl } as Partial<EditorObject>, true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Replacement image could not be loaded.");
    }
  }, [selectedObject, updateObject]);

  const beginSurfaceAction = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activePage || event.button !== 0) return;
    const point = screenToPdf(event.clientX, event.clientY);
    if (mode === "select") {
      const textHit = findTextHitAtPdfPoint(point.x, point.y);
      if (textHit) {
        event.preventDefault();
        event.stopPropagation();
        void activateTextHit(textHit);
        return;
      }
    }
    if (mode === "text") {
      event.preventDefault();
      event.stopPropagation();
      const next: TextObject = {
        id: uid("text"), type: "text", pageInstanceId: activePage.instanceId, x: point.x, y: Math.max(0, point.y - 24), width: 200, height: 34,
        rotation: 0, opacity: 1, text: "Edit text", fontSize: 14, color: "#111827", background: "transparent",
        bold: false, italic: false, underline: false, align: "left", letterSpacing: 0, lineHeight: 1.2, source: "new",
        fontRef: "manual", fontFamily: "Arial", loadedFontName: "", fontMatch: "fallback", renderMode: "vector",
        ascent: 0.82, descent: -0.2, baselineOffset: 3, horizontalScale: 1, autoStyle: false, matchedFontSize: 14, matchedHorizontalScale: 1,
      };
      commitMutation(() => { setObjects((current) => [...current, next]); selectOnly(next.id); setInlineEditingId(next.id); setMode("select"); });
      return;
    }
    if (["whiteout", "highlight", "rect", "ellipse", "redact", "link"].includes(mode)) {
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragDraft({ startX: point.x, startY: point.y, x: point.x, y: point.y });
      return;
    }
    if (mode === "select") clearSelection();
  };

  const moveSurfaceAction = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = screenToPdf(event.clientX, event.clientY);
    if (mode === "select" && !dragDraft && !inlineEditingId) {
      const hit = findTextHitAtPdfPoint(point.x, point.y);
      setHoveredTextHitId((current) => current === hit?.id ? current : (hit?.id ?? null));
    }
    if (!dragDraft) return;
    setDragDraft((current) => current ? { ...current, x: point.x, y: point.y } : null);
  };

  const endSurfaceAction = () => {
    if (!dragDraft || !activePage) return;
    const x = Math.min(dragDraft.startX, dragDraft.x);
    const y = Math.min(dragDraft.startY, dragDraft.y);
    const width = Math.max(MIN_OBJECT_SIZE, Math.abs(dragDraft.x - dragDraft.startX));
    const height = Math.max(MIN_OBJECT_SIZE, Math.abs(dragDraft.y - dragDraft.startY));
    setDragDraft(null);
    if (mode === "link") {
      const item: LinkObject = { id: uid("link"), type: "link", pageInstanceId: activePage.instanceId, x, y, width, height, rotation: 0, opacity: 1, url: "https://" };
      commitMutation(() => { setObjects((current) => [...current, item]); selectOnly(item.id); setMode("select"); });
      return;
    }
    if (!["whiteout", "highlight", "rect", "ellipse", "redact"].includes(mode)) return;
    const type = mode as RectObject["type"];
    const item: RectObject = {
      id: uid(type), type, pageInstanceId: activePage.instanceId, x, y, width, height, rotation: 0,
      opacity: type === "highlight" ? 0.35 : 1,
      fill: type === "redact" ? "#000000" : type === "whiteout" ? "#ffffff" : type === "highlight" ? "#fde047" : "#ffffff",
      stroke: type === "rect" || type === "ellipse" ? "#2563eb" : type === "redact" ? "#000000" : "transparent",
      strokeWidth: type === "rect" || type === "ellipse" ? 1.5 : 0,
    };
    commitMutation(() => { setObjects((current) => [...current, item]); selectOnly(item.id); setMode("select"); });
  };

  const addImage = async (picked: File) => {
    if (!activePage) return;
    setError("");
    try {
      if (picked.size > 15 * 1024 * 1024) throw new Error("Image must be 15 MB or smaller.");
      const normalized = await normalizeImageToPng(picked);
      const width = Math.min(220, pageSize.width * 0.45);
      const height = Math.max(40, width * normalized.height / normalized.width);
      const next: ImageObject = {
        id: uid("image"), type: "image", pageInstanceId: activePage.instanceId,
        x: Math.max(20, (pageSize.width - width) / 2), y: Math.max(20, (pageSize.height - height) / 2),
        width, height, rotation: 0, opacity: 1, dataUrl: normalized.dataUrl,
      };
      commitMutation(() => { setObjects((current) => [...current, next]); selectOnly(next.id); });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Image could not be added.");
    }
  };

  const addSignature = (dataUrl: string) => {
    if (!activePage) return;
    const width = Math.min(210, pageSize.width * 0.4);
    const height = 75;
    const next: ImageObject = {
      id: uid("signature"), type: "signature", pageInstanceId: activePage.instanceId,
      x: Math.max(20, (pageSize.width - width) / 2), y: Math.max(20, pageSize.height * 0.2),
      width, height, rotation: 0, opacity: 1, dataUrl,
    };
    commitMutation(() => { setObjects((current) => [...current, next]); selectOnly(next.id); setSignatureOpen(false); });
  };

  const movePage = (direction: -1 | 1) => {
    if (!activePage) return;
    const index = pages.findIndex((page) => page.instanceId === activePage.instanceId);
    const target = index + direction;
    if (target < 0 || target >= pages.length) return;
    commitMutation(() => setPages((current) => {
      const next = [...current];
      const [picked] = next.splice(index, 1);
      next.splice(target, 0, picked);
      return next;
    }));
  };

  const deletePage = () => {
    if (!activePage || pages.length <= 1) { setError("A PDF must keep at least one page."); return; }
    const index = pages.findIndex((page) => page.instanceId === activePage.instanceId);
    const remaining = pages.filter((page) => page.instanceId !== activePage.instanceId);
    commitMutation(() => {
      setPages(remaining);
      setObjects((current) => current.filter((item) => item.pageInstanceId !== activePage.instanceId));
      setActivePageId(remaining[Math.min(index, remaining.length - 1)]?.instanceId ?? "");
      clearSelection();
    });
  };

  const duplicatePage = () => {
    if (!activePage) return;
    const index = pages.findIndex((page) => page.instanceId === activePage.instanceId);
    const duplicate: PageInstance = { ...activePage, instanceId: uid("page-copy") };
    const clones = objects.filter((item) => item.pageInstanceId === activePage.instanceId).map((item) => ({ ...item, id: uid(item.type), pageInstanceId: duplicate.instanceId, sourceHitId: undefined })) as EditorObject[];
    commitMutation(() => {
      setPages((current) => { const next = [...current]; next.splice(index + 1, 0, duplicate); return next; });
      setObjects((current) => [...current, ...clones]);
      setActivePageId(duplicate.instanceId);
      clearSelection();
    });
  };

  const rotatePage = (delta: number) => {
    if (!activePage) return;
    commitMutation(() => setPages((current) => current.map((page) => page.instanceId === activePage.instanceId ? { ...page, rotation: (page.rotation + delta + 360) % 360 } : page)));
  };

  const drawSpacedText = useCallback(async (page: any, item: TextObject, font: any) => {
    const lines = item.text.replace(/\r/g, "").split("\n");
    const lineHeight = item.fontSize * item.lineHeight;
    const maxLines = Math.max(1, Math.floor(item.height / lineHeight) + 1);
    for (let lineIndex = 0; lineIndex < Math.min(lines.length, maxLines); lineIndex += 1) {
      const line = lines[lineIndex];
      const glyphWidths = [...line].map((char) => font.widthOfTextAtSize(char, item.fontSize));
      const natural = glyphWidths.reduce((sum: number, width: number) => sum + width, 0);
      const spaced = natural + Math.max(0, line.length - 1) * item.letterSpacing;
      let x = item.x;
      if (item.align === "center") x += Math.max(0, (item.width - spaced) / 2);
      if (item.align === "right") x += Math.max(0, item.width - spaced);
      const firstBaseline = item.source !== "new" ? item.y + item.baselineOffset : item.y + item.height - item.fontSize * 0.18;
      const y = firstBaseline - lineIndex * lineHeight;
      // Preserve normal added/replacement text as one searchable PDF text object whenever
      // custom tracking/horizontal scaling is not required. Drawing every glyph separately
      // makes PDF.js expose words as isolated characters after export/reopen.
      const canDrawWholeLine = Math.abs(item.letterSpacing) < 0.001 && Math.abs(item.horizontalScale - 1) < 0.001;
      if (canDrawWholeLine) {
        page.drawText(line, { x, y, size: item.fontSize, font, color: hexToRgb(item.color), opacity: item.opacity });
      } else {
        let cursor = x;
        for (let charIndex = 0; charIndex < line.length; charIndex += 1) {
          const char = line[charIndex];
          page.drawText(char, { x: cursor, y, size: item.fontSize, font, color: hexToRgb(item.color), opacity: item.opacity });
          cursor += glyphWidths[charIndex] + item.letterSpacing;
        }
      }
      if (item.underline) page.drawLine({ start: { x, y: y - 1.5 }, end: { x: x + spaced, y: y - 1.5 }, thickness: Math.max(0.6, item.fontSize / 18), color: hexToRgb(item.color), opacity: item.opacity });
    }
  }, []);

  const renderSecureRedactedPage = useCallback(async (sourceIndex: number, redactions: RectObject[]) => {
    const raster = await renderPageSample(sourceIndex, 2.0);
    const ctx = raster.canvas.getContext("2d");
    if (!ctx) throw new Error("Secure redaction canvas is unavailable.");
    for (const item of redactions) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000000";
      ctx.fillRect(item.x * raster.scale, (raster.height - item.y - item.height) * raster.scale, item.width * raster.scale, item.height * raster.scale);
      ctx.restore();
    }
    return { dataUrl: raster.canvas.toDataURL("image/png"), width: raster.width, height: raster.height };
  }, [renderPageSample]);

  const addLinkAnnotation = useCallback((output: PDFDocument, page: any, item: LinkObject) => {
    const url = item.url.trim();
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) return;
    const annotation = output.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [item.x, item.y, item.x + item.width, item.y + item.height],
      Border: [0, 0, 0],
      A: { S: "URI", URI: PDFString.of(url) },
    });
    const annotationRef = output.context.register(annotation);
    let annots: any = null;
    const existing = page.node.get(PDFName.of("Annots"));
    if (existing) {
      try { annots = output.context.lookup(existing); } catch { annots = null; }
    }
    if (!annots || typeof annots.push !== "function") {
      annots = output.context.obj([]);
      page.node.set(PDFName.of("Annots"), annots);
    }
    annots.push(annotationRef);
  }, []);

  const exportPdf = useCallback(async () => {
    if (!fileBytesRef.current || !pages.length) return;
    setExporting(true);
    setError("");
    setStatus("Preparing edited PDFâ€¦");
    try {
      const source = await PDFDocument.load(fileBytesRef.current.slice(0), { ignoreEncryption: false, updateMetadata: false });
      const output = await PDFDocument.create();
      const fontCache = new Map<string, any>();
      let usedSecureRedaction = false;
      for (let index = 0; index < pages.length; index += 1) {
        const plan = pages[index];
        setStatus(`Building page ${index + 1} of ${pages.length}â€¦`);
        const ops = objects.filter((item) => item.pageInstanceId === plan.instanceId);
        const redactions = ops.filter((item): item is RectObject => item.type === "redact");
        let targetPage: any;
        if (redactions.length) {
          usedSecureRedaction = true;
          const secure = await renderSecureRedactedPage(plan.sourceIndex, redactions);
          targetPage = output.addPage([secure.width, secure.height]);
          const embedded = await output.embedPng(dataUrlToBytes(secure.dataUrl));
          targetPage.drawImage(embedded, { x: 0, y: 0, width: secure.width, height: secure.height });
        } else {
          const [copied] = await output.copyPages(source, [plan.sourceIndex]);
          output.addPage(copied);
          targetPage = copied;
        }
        targetPage.setRotation(degrees(((source.getPage(plan.sourceIndex).getRotation().angle || 0) + plan.rotation) % 360));
        const rectangles = ops.filter((item): item is RectObject => ["whiteout", "highlight", "rect", "ellipse"].includes(item.type));
        const images = ops.filter((item): item is ImageObject => item.type === "image" || item.type === "signature");
        const texts = ops.filter((item): item is TextObject => item.type === "text");
        const links = ops.filter((item): item is LinkObject => item.type === "link");
        for (const item of rectangles) {
          if (item.type === "ellipse") {
            targetPage.drawEllipse({ x: item.x + item.width / 2, y: item.y + item.height / 2, xScale: item.width / 2, yScale: item.height / 2, color: item.fill === "transparent" ? undefined : hexToRgb(item.fill), borderColor: item.stroke === "transparent" ? undefined : hexToRgb(item.stroke), borderWidth: item.strokeWidth, opacity: item.opacity });
          } else {
            targetPage.drawRectangle({ x: item.x, y: item.y, width: item.width, height: item.height, color: item.fill === "transparent" ? undefined : hexToRgb(item.fill), borderColor: item.stroke === "transparent" ? undefined : hexToRgb(item.stroke), borderWidth: item.strokeWidth, opacity: item.opacity });
          }
        }
        for (const item of images) {
          const embedded = await output.embedPng(dataUrlToBytes(item.dataUrl));
          targetPage.drawImage(embedded, { x: item.x, y: item.y, width: item.width, height: item.height, rotate: degrees(item.rotation), opacity: item.opacity });
        }
        for (const item of texts) {
          if (item.background !== "transparent") targetPage.drawRectangle({ x: item.x, y: item.y, width: item.width, height: item.height, color: hexToRgb(item.background), opacity: item.opacity });
          const shouldRaster = /[^\x20-\x7E\r\n\t]/.test(item.text) || item.renderMode === "visual-match" || item.fontMatch === "exact" || item.fontMatch === "family" || item.fontMatch === "ocr";
          if (shouldRaster) {
            const matchedPng = await rasterizeMatchedText(item);
            const embedded = await output.embedPng(dataUrlToBytes(matchedPng));
            targetPage.drawImage(embedded, { x: item.x, y: item.y, width: item.width, height: item.height, rotate: degrees(item.rotation), opacity: item.opacity });
          } else {
            const name = fontNameFor(item);
            let font = fontCache.get(name);
            if (!font) { font = await output.embedFont(name); fontCache.set(name, font); }
            await drawSpacedText(targetPage, item, font);
          }
        }
        for (const item of links) addLinkAnnotation(output, targetPage, item);
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
      output.setProducer("AJN PDF Browser Editor");
      output.setCreator("AJN PDF");
      setStatus("Serializing PDFâ€¦");
      const bytes = await output.save({ useObjectStreams: true, addDefaultPage: false });
      if (bytes.length < 64 || String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-") throw new Error("Output validation failed before download.");
      setStatus("Validating resultâ€¦");
      initPdfWorker();
      const check = await pdfjsLib.getDocument({ useSystemFonts: false, standardFontDataUrl: "/pdfjs/standard_fonts/", cMapUrl: "/pdfjs/cmaps/", cMapPacked: true, data: bytes.slice() }).promise;
      if (check.numPages !== pages.length) throw new Error("Output page-count validation failed.");
      try { await check.getPage(1); } finally { await check.destroy(); }
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${file?.name.replace(/\.pdf$/i, "") || "document"}_edited_AJN.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      setStatus(usedSecureRedaction ? "Edited PDF downloaded with secure raster redaction" : "Edited PDF downloaded");
      await clearRestoreRecord().catch(() => undefined);
      setSavedAt(null);
    } catch (caught) {
      setError(`${caught instanceof Error ? caught.message : "The edited PDF could not be exported."} Your editor session has been kept.`);
      setStatus("Export stopped safely");
    } finally {
      setExporting(false);
    }
  }, [addLinkAnnotation, drawSpacedText, file?.name, objects, pages, renderSecureRedactedPage]);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; }
      if ((event.ctrlKey || event.metaKey) && key === "y") { event.preventDefault(); redo(); return; }
      if ((event.ctrlKey || event.metaKey) && key === "f") { event.preventDefault(); setSearchOpen(true); return; }
      if ((event.ctrlKey || event.metaKey) && key === "s") { event.preventDefault(); if (!exporting) void exportPdf(); return; }
      if (typing) return;
      if ((event.ctrlKey || event.metaKey) && key === "a") {
        event.preventDefault();
        const textIds = pageObjects.filter((item) => item.type === "text").map((item) => item.id);
        if (textIds.length) setSelectedIds(textIds); else void bulkMakeEditable("page");
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === "c") { event.preventDefault(); copySelected(); }
      else if ((event.ctrlKey || event.metaKey) && key === "v") { event.preventDefault(); pasteClipboard(); }
      else if ((event.ctrlKey || event.metaKey) && key === "d") { event.preventDefault(); duplicateSelected(); }
      else if (event.key === "Delete" || event.key === "Backspace") { if (selectedIds.length) { event.preventDefault(); deleteSelected(); } }
      else if (event.key === "Escape") { clearSelection(); setMode("select"); }
      else if (selectedObject && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const amount = event.shiftKey ? 10 : 1;
        const dx = event.key === "ArrowLeft" ? -amount : event.key === "ArrowRight" ? amount : 0;
        const dy = event.key === "ArrowDown" ? -amount : event.key === "ArrowUp" ? amount : 0;
        updateObject(selectedObject.id, {
          x: clamp(selectedObject.x + dx, 0, Math.max(0, pageSize.width - selectedObject.width)),
          y: clamp(selectedObject.y + dy, 0, Math.max(0, pageSize.height - selectedObject.height)),
        }, true);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [bulkMakeEditable, clearSelection, copySelected, deleteSelected, duplicateSelected, exporting, exportPdf, pageObjects, pageSize.height, pageSize.width, pasteClipboard, redo, selectedIds.length, selectedObject, undo, updateObject]);

  const beginObjectDrag = (event: React.PointerEvent<HTMLDivElement>, item: EditorObject) => {
    if (inlineEditingId === item.id) return;
    event.stopPropagation();
    if (event.ctrlKey || event.metaKey || event.shiftKey) toggleSelection(item.id); else if (!selectedIds.includes(item.id)) selectOnly(item.id);
    const start = { clientX: event.clientX, clientY: event.clientY, x: item.x, y: item.y };
    let moved = false;
    let historyBeforeMove: Snapshot | null = null;
    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(pointerId);
    const move = (moveEvent: PointerEvent) => {
      const screenDx = moveEvent.clientX - start.clientX;
      const screenDy = moveEvent.clientY - start.clientY;
      if (!moved && Math.hypot(screenDx, screenDy) < 4) return;
      if (!moved) { moved = true; historyBeforeMove = snapshot(); }
      const [localDx, localDy] = viewRotation === 90 ? [screenDy, -screenDx] : viewRotation === 180 ? [-screenDx, -screenDy] : viewRotation === 270 ? [-screenDy, screenDx] : [screenDx, screenDy];
      const dx = localDx / zoom;
      const dy = -localDy / zoom;
      setObjects((current) => current.map((value) => value.id === item.id ? { ...value, x: clamp(start.x + dx, 0, Math.max(0, pageSize.width - value.width)), y: clamp(start.y + dy, 0, Math.max(0, pageSize.height - value.height)) } as EditorObject : value));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (moved && historyBeforeMove) {
        setHistory((current) => [...current.slice(-59), historyBeforeMove as Snapshot]);
        setFuture([]);
        setStatus(item.type === "text" ? "Text moved â€” click without dragging to edit" : "Object moved");
      } else if (item.type === "text") {
        selectOnly(item.id);
        setInlineEditingId(item.id);
        setStatus(item.source === "ocr" ? "Image text editing â€” type directly; drag the word to move it" : "Text editing â€” type directly; drag to move it");
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  const beginResize = (event: React.PointerEvent<HTMLButtonElement>, item: EditorObject) => {
    event.stopPropagation();
    const before = snapshot();
    const start = { clientX: event.clientX, clientY: event.clientY, width: item.width, height: item.height };
    const move = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - start.clientX, dy = moveEvent.clientY - start.clientY;
      const [localDx, localDy] = viewRotation === 90 ? [dy, -dx] : viewRotation === 180 ? [-dx, -dy] : viewRotation === 270 ? [-dy, dx] : [dx, dy];
      const width = clamp(start.width + localDx / zoom, MIN_OBJECT_SIZE, Math.max(MIN_OBJECT_SIZE, pageSize.width - item.x));
      const height = clamp(start.height + localDy / zoom, MIN_OBJECT_SIZE, Math.max(MIN_OBJECT_SIZE, pageSize.height - item.y));
      setObjects((current) => current.map((value) => value.id === item.id ? { ...value, width, height } as EditorObject : value));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setHistory((current) => [...current.slice(-59), before]);
      setFuture([]);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  const renderObject = (item: EditorObject) => {
    const selected = selectedIds.includes(item.id);
    const internalCover = item.type === "whiteout" && Boolean(item.sourceHitId);
    const layerClass = item.type === "text" ? "z-[80]" : internalCover ? "z-20" : item.type === "image" || item.type === "signature" ? "z-[25]" : "z-30";
    const top = (pageSize.height - item.y - item.height) * zoom;
    const textHorizontalScale = item.type === "text" ? clamp(item.horizontalScale || 1, 0.35, 2.5) : 1;
    const textScaleStyle: React.CSSProperties | undefined = item.type === "text" ? {
      transform: `scaleX(${textHorizontalScale})`, transformOrigin: "left top", width: `${100 / textHorizontalScale}%`,
    } : undefined;
    const commonStyle: React.CSSProperties = {
      left: item.x * zoom,
      top,
      width: item.width * zoom,
      height: item.height * zoom,
      opacity: item.opacity,
      transform: `rotate(${-item.rotation}deg)`,
      transformOrigin: "center center",
    };
    return (
      <div key={item.id} data-editor-object={item.type}
        data-ajn-selected={String(selected)}
        data-ajn-source-hit-id={item.sourceHitId ?? undefined}
        data-ajn-auto-style={item.type === "text" ? String(Boolean(item.sourceHitId) && item.autoStyle !== false) : undefined}
        data-ajn-font-family={item.type === "text" ? item.fontFamily : undefined}
        data-ajn-font-size={item.type === "text" ? item.fontSize.toFixed(2) : undefined}
        data-ajn-text-color={item.type === "text" ? item.color : undefined}
        data-ajn-font-weight={item.type === "text" ? (item.bold ? "700" : "400") : undefined}
        data-ajn-font-style={item.type === "text" ? (item.italic ? "italic" : "normal") : undefined}
        data-ajn-horizontal-scale={item.type === "text" ? item.horizontalScale.toFixed(4) : undefined}
        data-ajn-style-confidence={item.type === "text" && item.styleConfidence !== undefined ? item.styleConfidence.toFixed(3) : undefined}
        onPointerDown={(event) => beginObjectDrag(event, item)} onDoubleClick={(event) => { event.stopPropagation(); selectOnly(item.id); if (item.type === "text") setInlineEditingId(item.id); }}
        className={`absolute ${layerClass} ${internalCover ? "pointer-events-none" : `touch-none select-none ${item.type === "text" ? "cursor-text" : "cursor-move"}`} ${selected ? "ring-2 ring-blue-500 ring-offset-1" : ""}`} style={commonStyle}>
        {item.type === "text" && (inlineEditingId === item.id ? (
          <textarea autoFocus value={item.text} placeholder={item.source === "ocr" && !item.text ? "Type replacementâ€¦" : undefined} onFocus={() => rememberTextEditStart(item)} onInput={(event) => updateTextValue(item, event.currentTarget.value)} onBlur={() => finishTextEdit(item.id)} onPointerDown={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); finishTextEdit(item.id); } }}
            aria-label={item.source === "ocr" ? "Edit OCR image text" : "Edit PDF text"} className="h-full w-full resize-none overflow-hidden border-0 bg-white/95 p-0 outline-none ring-2 ring-violet-500/70" style={{ ...textScaleStyle, fontFamily: cssFontFamily(item), fontSize: item.fontSize * zoom, lineHeight: item.lineHeight, fontWeight: item.bold ? 700 : 400, fontStyle: item.italic ? "italic" : "normal", textDecoration: item.underline ? "underline" : "none", color: item.color, backgroundColor: "transparent", textAlign: item.align, letterSpacing: item.letterSpacing * zoom }} />
        ) : (
          <div className="pointer-events-none h-full w-full overflow-hidden whitespace-pre-wrap" style={{ ...textScaleStyle, fontFamily: cssFontFamily(item), fontSize: item.fontSize * zoom, lineHeight: item.lineHeight, fontWeight: item.bold ? 700 : 400, fontStyle: item.italic ? "italic" : "normal", textDecoration: item.underline ? "underline" : "none", color: item.color, background: item.background === "transparent" ? "transparent" : item.background, textAlign: item.align, letterSpacing: item.letterSpacing * zoom }}>{item.text}</div>
        ))}
        {(item.type === "image" || item.type === "signature") && <img src={item.dataUrl} alt="" draggable={false} className="pointer-events-none h-full w-full object-fill" />}
        {(item.type === "whiteout" || item.type === "highlight" || item.type === "rect" || item.type === "redact") && <div className="pointer-events-none h-full w-full" style={{ background: item.fill === "transparent" ? "transparent" : item.fill, border: item.stroke === "transparent" ? undefined : `${Math.max(1, item.strokeWidth * zoom)}px solid ${item.stroke}` }} />}
        {item.type === "ellipse" && <div className="pointer-events-none h-full w-full rounded-[50%]" style={{ background: item.fill === "transparent" ? "transparent" : item.fill, border: item.stroke === "transparent" ? undefined : `${Math.max(1, item.strokeWidth * zoom)}px solid ${item.stroke}` }} />}
        {item.type === "link" && <div className="pointer-events-none grid h-full w-full place-items-center border-2 border-dashed border-cyan-500 bg-cyan-100/20 text-[10px] font-black text-cyan-700"><Link2 className="h-4 w-4" /></div>}
        {selected && !internalCover && <button type="button" aria-label="Resize selected object" onPointerDown={(event) => beginResize(event, item)} className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow" />}
      </div>
    );
  };

  const draftRect = useMemo(() => {
    if (!dragDraft) return null;
    const x = Math.min(dragDraft.startX, dragDraft.x);
    const y = Math.max(dragDraft.startY, dragDraft.y);
    const width = Math.abs(dragDraft.x - dragDraft.startX);
    const height = Math.abs(dragDraft.y - dragDraft.startY);
    return { left: x * zoom, top: (pageSize.height - y) * zoom, width: width * zoom, height: height * zoom } as React.CSSProperties;
  }, [dragDraft, pageSize.height, zoom]);

  const resetEditor = useCallback(async () => {
    uploadAttemptRef.current += 1;
    ocrSessionRef.current += 1;
    void loadingTaskRef.current?.destroy().catch(() => undefined);
    loadingTaskRef.current = null;
    if (ocrWorkerRef.current) void terminateOcrWorkerSafely(ocrWorkerRef.current);
    ocrWorkerRef.current = null;
    ocrRunRef.current = false;
    pdfRef.current = null;
    fileBytesRef.current = null;
    setLoading(false);
    setPdfEngineReady(false);
    setCanvasPreviewReady(false);
    setWorkspaceMode("upload");
    setFile(null);
    setSelectedPdfName("");
    setPendingPdf(null);
    pendingPdfRef.current = null;
    setUploadStage("idle");
    setPreviewRendering(false);
    setPreviewError("");
    setPreviewRenderNonce(0);
    openingPdfRef.current = false;
    if (pdfPickerInputRef.current) pdfPickerInputRef.current.value = "";
    setPages([]);
    setObjects([]);
    setTextHits({});
    setImageHits({});
    setThumbnails({});
    clearSelection();
    setHistory([]);
    setFuture([]);
    setStatus("");
    setError("");
    setOcrBusy(false);
    setRestoreRecord(null);
    setHoveredTextHitId(null);
    setActivatingTextHitId(null);
    await clearRestoreRecord().catch(() => undefined);
  }, [clearSelection]);


  // V7.2: screen routing is explicit. `file` is document data, not a UI router.
  // This prevents async parser/validation state from keeping or returning the UI to Upload.
  if (workspaceMode === "upload") {
    const pickPdf = (picked?: File | null) => {
      if (!picked) return;
      setDropActive(false);
      // Detach the selected Blob from the native input immediately.
      const stableFile = new File([picked], picked.name || "document.pdf", {
        type: picked.type || "application/pdf",
        lastModified: picked.lastModified || Date.now(),
      });
      void openFile(stableFile);
    };
    const handlePdfInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const picked = input.files?.item(0) ?? null;
      // Clear immediately after synchronously capturing File so selecting the same PDF again always fires change.
      input.value = "";
      if (!picked) {
        setError("");
        return;
      }
      pickPdf(picked);
    };
    const retryPendingPdf = () => {
      const retryFile = pendingPdfRef.current ?? pendingPdf;
      if (!retryFile) {
        setError("Choose a PDF first, then use Retry open if it does not open automatically.");
        return;
      }
      if (openingPdfRef.current) {
        setStatus(`Selected: ${retryFile.name} â€¢ PDF loader is still workingâ€¦`);
        return;
      }
      void openFile(retryFile);
    };
    return (
      <main id="edit-pdf-upload" className="min-h-[calc(100vh-66px)] scroll-mt-24 bg-[radial-gradient(circle_at_top_left,_#eef2ff_0,_#f8fafc_42%,_#f8fafc_100%)] px-4 pb-14 pt-24 text-slate-950" data-ajn-edit-pdf-upload="true" data-ajn-drag-drop-upload="true">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-[34px] border border-slate-200/90 bg-white shadow-[0_28px_90px_rgba(15,23,42,.10)]">
            <div className="grid gap-0 lg:grid-cols-[1.02fr_.98fr]">
              <section className="p-7 md:p-10 lg:p-12">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700"><ShieldCheck className="h-4 w-4" /> AJN PDF Editor â€¢ Local processing</div>
                <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-[-.04em] text-slate-950 md:text-5xl">Edit text, scanned image text, images and pages in one workspace</h1>
                <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-600 md:text-base">Choose or drag a PDF below. Click detected text to make visual replacements, or recognize text in scanned pages. Your Edit PDF document bytes are not sent to the AJN PDF processing backend.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black text-slate-950">Native + scanned text</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">Click detected text, replace words, edit scanned forms and table cells, add new text, move objects and preserve layout as closely as possible.</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black text-slate-950">Safe output workflow</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">The original file is not overwritten. Export creates a new PDF and reopens it with PDF.js for validation.</p></div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-black text-slate-600"><span className="rounded-xl bg-blue-50 px-3 py-2 text-blue-700">Edit detected text</span><span className="rounded-xl bg-violet-50 px-3 py-2 text-violet-700">OCR image text</span><span className="rounded-xl bg-slate-100 px-3 py-2">Find & Replace</span><span className="rounded-xl bg-slate-100 px-3 py-2">Images + signatures</span><span className="rounded-xl bg-slate-100 px-3 py-2">Secure redaction</span></div>
              </section>

              <section className="border-t border-slate-200 bg-slate-50/70 p-6 md:p-9 lg:border-l lg:border-t-0 lg:p-10">
                <div
                  id="ajn-edit-pdf-native-upload-trigger"
                  role="group"
                  aria-label="Drag and drop a PDF here or choose a PDF file"
                  aria-busy={loading}
                  data-ajn-native-drop-zone="true"
                  onDragEnter={(event) => { event.preventDefault(); event.stopPropagation(); if (!loading) setDropActive(true); }}
                  onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); if (!loading) { event.dataTransfer.dropEffect = "copy"; setDropActive(true); } }}
                  onDragLeave={(event) => { event.preventDefault(); event.stopPropagation(); if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropActive(false); }}
                  onDrop={(event) => { event.preventDefault(); event.stopPropagation(); setDropActive(false); const dropped = event.dataTransfer.files?.item(0) ?? null; if (dropped) pickPdf(dropped); }}
                  className={`group relative flex min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-[28px] border-2 border-dashed p-7 text-center outline-none transition ${dropActive ? "scale-[1.01] border-blue-500 bg-blue-50 shadow-[0_18px_55px_rgba(37,99,235,.14)]" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/45"}`}
                >
                  <input
                    ref={pdfPickerInputRef}
                    id="ajn-edit-pdf-native-file-input"
                    type="file"
                    accept="application/pdf,.pdf"
                    aria-label="Choose a PDF file"
                    data-ajn-direct-native-file-input="true"
                    disabled={loading}
                    onChange={handlePdfInputChange}
                    className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  />
                  <div className={`grid h-20 w-20 place-items-center rounded-3xl transition ${dropActive ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"}`}>
                    {loading ? <Loader2 className="h-9 w-9 animate-spin" /> : <UploadCloud className="h-9 w-9" />}
                  </div>
                  <h2 className="mt-6 text-xl font-black tracking-tight text-slate-950">{loading ? "Opening your PDFâ€¦" : dropActive ? "Drop PDF to open" : "Drag & drop your PDF here"}</h2>
                  <p className="mt-2 max-w-sm text-xs font-semibold leading-6 text-slate-500">Or choose a file from your device. Only PDF files are accepted.</p>
                  <span aria-disabled={loading} data-ajn-upload-cta="true" className={`relative mt-6 inline-flex min-w-[190px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,.22)] transition ${loading ? "cursor-not-allowed opacity-50" : "cursor-pointer group-hover:bg-blue-700"}`}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />} Upload PDF
                  </span>
                  <p className="mt-3 text-[10px] font-black leading-5 text-blue-500">Your PDF opens here. No account needed.</p>
                  {selectedPdfName && <p data-ajn-selected-pdf-name="true" className="mt-2 max-w-full truncate rounded-lg bg-blue-50 px-3 py-1.5 text-[10px] font-black text-blue-700">Selected: {selectedPdfName} â€¢ {uploadStage}</p>}
                  {pendingPdf && !loading && uploadStage === "error" && <button type="button" data-ajn-retry-pdf-open="true" onClick={retryPendingPdf} className="relative z-30 mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-black text-amber-800 hover:bg-amber-100">Retry open selected PDF</button>}
                  <p className="mt-2 text-[10px] font-black leading-5 text-slate-400">Maximum {MAX_FILE_MB} MB â€¢ Maximum {MAX_PAGES} pages</p>
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left">
                  <p className="text-[11px] font-black text-emerald-900">Local Edit PDF workflow</p>
                  <p className="mt-1 text-[10px] font-semibold leading-5 text-emerald-800">PDF bytes remain in this browser for editing/export. Download a new copy when your edits are ready.</p>
                </div>
              </section>
            </div>

            {status && <div className="border-t border-slate-100 bg-white px-7 py-4 text-xs font-bold text-slate-600 md:px-10">{status}</div>}
            {restoreRecord && <div className="border-t border-amber-200 bg-amber-50 px-7 py-4 md:px-10"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-black text-amber-950">Recover unsaved local session</p><p className="mt-1 text-xs font-semibold text-amber-800">{restoreRecord.fileName}</p></div><button type="button" onClick={() => void restoreSession()} className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white">Restore</button></div></div>}
            {error && <div role="alert" className="border-t border-red-200 bg-red-50 px-7 py-4 text-sm font-bold text-red-700 md:px-10">{error}</div>}
          </div>

          <div className="mt-5 grid gap-3 text-[11px] font-semibold text-slate-500 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4"><span className="font-black text-slate-800">1. Upload</span><br />Choose or drag a PDF into the workspace.</div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4"><span className="font-black text-slate-800">2. Edit</span><br />Use native text or OCR image-text editing tools.</div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4"><span className="font-black text-slate-800">3. Export</span><br />Download a newly validated PDF copy.</div>
          </div>
        </div>
      </main>
    );
  }

  const committedEditorFile = file ?? pendingPdf ?? pendingPdfRef.current;
  const committedEditorFileName = committedEditorFile?.name || selectedPdfName || "Selected PDF";

  return (
    <main data-ajn-editor-shell="true" data-ajn-preview-ready={canvasPreviewReady} data-ajn-page-rotation={viewRotation} data-ajn-workspace-mode={workspaceMode} data-ajn-editor-stage={uploadStage} className="min-h-screen bg-[#e5e7eb] text-slate-950">
      {signatureOpen && <SignaturePad onClose={() => setSignatureOpen(false)} onInsert={addSignature} />}
      <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const picked = event.target.files?.[0]; if (picked) { if (selectedObject?.type === "image") void replaceSelectedImageFile(picked); else void addImage(picked); } event.currentTarget.value = ""; }} />

      <header className="sticky top-0 z-[100] border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="flex min-h-16 flex-wrap items-center gap-2 px-3 py-2 md:px-5">
          <div className="mr-2 flex items-center gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><FileText className="h-5 w-5" /></div><div className="hidden sm:block"><p className="text-sm font-black">AJN PDF Editor</p><div className="flex items-center gap-2"><p className="max-w-[180px] truncate text-[10px] font-bold text-slate-400">{committedEditorFileName}</p><span data-ajn-document-stage="true" className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-blue-700">{uploadStage}</span></div></div></div>
          {!pdfEngineReady && <button type="button" data-ajn-retry-editor-engine="true" onClick={retryEditorEngine} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 text-[10px] font-black text-amber-800 hover:bg-amber-100 disabled:opacity-50">{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />} Retry opening PDF</button>}
          <button type="button" onClick={() => void resetEditor()} className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600 hover:bg-slate-50">Choose another PDF</button>
          <div className="flex flex-wrap items-center gap-1">
            <ToolbarButton title="Select" active={mode === "select"} onClick={() => setMode("select")}><MousePointer2 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Add text" active={mode === "text"} onClick={() => setMode("text")}><Type className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Whiteout visual cover" active={mode === "whiteout"} onClick={() => setMode("whiteout")}><Eraser className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Secure redact area" active={mode === "redact"} onClick={() => setMode("redact")}><ShieldCheck className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Highlight" active={mode === "highlight"} onClick={() => setMode("highlight")}><Highlighter className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Rectangle" active={mode === "rect"} onClick={() => setMode("rect")}><Square className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Ellipse" active={mode === "ellipse"} onClick={() => setMode("ellipse")}><Circle className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Add link area" active={mode === "link"} onClick={() => setMode("link")}><Link2 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title={selectedObject?.type === "image" ? "Replace selected image" : "Insert image"} onClick={() => imageInputRef.current?.click()}><ImagePlus className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Draw signature" onClick={() => setSignatureOpen(true)}><PenTool className="h-4 w-4" /></ToolbarButton>
          </div>
          <div className="mx-1 hidden h-8 w-px bg-slate-200 md:block" />
          <div className="flex items-center gap-1">
            <ToolbarButton title="Edit all text on this page" disabled={loading || ocrBusy} onClick={() => void bulkMakeEditable("page")}><Type className="h-4 w-4" /><span className="hidden xl:inline">Page text</span></ToolbarButton>
            <ToolbarButton title="Edit all detected text in document" disabled={loading || ocrBusy} onClick={() => void bulkMakeEditable("document")}><Layers3 className="h-4 w-4" /><span className="hidden xl:inline">All text</span></ToolbarButton>
            {ocrBusy ? <ToolbarButton title="Stop OCR" onClick={cancelOcr}><X className="h-4 w-4" /></ToolbarButton> : <ToolbarButton title={`Scan current page for editable ${ocrGranularity} text`} disabled={activeSourceIndex === undefined} onClick={() => void scanCurrentPage()}><ScanText className="h-4 w-4" /></ToolbarButton>}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ToolbarButton title="Undo (Ctrl+Z)" disabled={!history.length} onClick={undo}><Undo2 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Redo (Ctrl+Y)" disabled={!future.length} onClick={redo}><Redo2 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Copy selected" disabled={!selectedObject} onClick={copySelected}><Copy className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Delete selected" disabled={!selectedIds.length} onClick={deleteSelected}><Trash2 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Find and replace (Ctrl+F)" onClick={() => setSearchOpen((current) => !current)}><Search className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Zoom out" onClick={() => setZoom((current) => Math.max(0.45, current - 0.1))}><ZoomOut className="h-4 w-4" /></ToolbarButton>
            <span className="min-w-12 text-center text-[11px] font-black text-slate-600">{Math.round(zoom * 100)}%</span>
            <ToolbarButton title="Zoom in" onClick={() => setZoom((current) => Math.min(2.2, current + 0.1))}><ZoomIn className="h-4 w-4" /></ToolbarButton>
            <button type="button" aria-label="Download PDF" disabled={exporting || loading || !canvasPreviewReady || !pdfEngineReady} onClick={() => void exportPdf()} className="ml-1 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}<span className="hidden sm:inline">Download PDF</span></button>
          </div>
        </div>
        {searchOpen && <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2"><Search className="h-4 w-4 text-slate-400" /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Find text in PDFâ€¦" className="h-9 min-w-[180px] flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-400" /><input value={replaceValue} onChange={(event) => setReplaceValue(event.target.value)} placeholder="Replace withâ€¦" className="h-9 min-w-[180px] flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-400" /><span className="text-xs font-black text-slate-500">{searchResults.length} detected matches</span><button type="button" disabled={!searchQuery.trim() || loading} onClick={() => void replaceAllMatches()} className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-black text-white disabled:opacity-40">Replace all</button></div>
          <div className="mt-2 flex max-w-full gap-1 overflow-x-auto">{searchResults.slice(0, 20).map(({ pageId, hit }, index) => <button key={`${pageId}-${hit.id}`} type="button" onClick={() => { setActivePageId(pageId); window.setTimeout(() => void replaceTextHit(hit, pageId), 0); }} className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-600 hover:border-blue-300 hover:text-blue-700">{index + 1}. {hit.text.slice(0, 26)}</button>)}</div>
        </div>}
      </header>

      <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[190px_minmax(0,1fr)_310px]">
        <aside className="hidden border-r border-slate-200 bg-white p-3 lg:block">
          <div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Pages</p><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black">{pages.length}</span></div>
          <div className="mt-3 max-h-[calc(100vh-150px)] space-y-2 overflow-y-auto pr-1">{pages.map((page, index) => <button key={page.instanceId} type="button" onClick={() => { setActivePageId(page.instanceId); clearSelection(); }} className={`w-full rounded-2xl border p-2 text-left transition ${activePage?.instanceId === page.instanceId ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200"}`}><div className="aspect-[.72] overflow-hidden rounded-lg bg-slate-100">{thumbnails[page.sourceIndex] ? <img src={thumbnails[page.sourceIndex]} alt="" className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center text-[10px] font-black text-slate-400">Page</div>}</div><div className="mt-2 flex items-center justify-between"><span className="text-[10px] font-black">Page {index + 1}</span>{!(textHits[page.sourceIndex] ?? []).length ? <span className="rounded bg-amber-100 px-1 text-[8px] font-black text-amber-700">SCAN</span> : (textHits[page.sourceIndex] ?? []).some((hit) => hit.ocr) ? <span className="rounded bg-violet-100 px-1 text-[8px] font-black text-violet-700">OCR</span> : null}</div></button>)}</div>
        </aside>

        <section className="min-w-0 overflow-auto p-4 md:p-7">
          <div className="mx-auto w-max">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex items-center gap-1"><ToolbarButton title="Move page earlier" onClick={() => movePage(-1)}><ChevronUp className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Move page later" onClick={() => movePage(1)}><ChevronDown className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Duplicate page" onClick={duplicatePage}><Plus className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Rotate page left" onClick={() => rotatePage(-90)}><RotateCcw className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Rotate page right" onClick={() => rotatePage(90)}><RotateCw className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Delete page" disabled={pages.length <= 1} onClick={deletePage}><Trash2 className="h-4 w-4" /></ToolbarButton></div>
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-500"><label className="flex items-center gap-1"><input type="checkbox" checked={showImageHits} onChange={(event) => setShowImageHits(event.target.checked)} /> Show detected images</label><span>{activePage ? `Page ${pages.findIndex((page) => page.instanceId === activePage.instanceId) + 1} / ${pages.length}` : ""}{savedAt ? " â€¢ Saved locally" : ""}</span></div>
            </div>

            <div data-ajn-page-frame style={{ position: "relative", width: (viewRotation % 180 ? pageSize.height : pageSize.width) * zoom, height: (viewRotation % 180 ? pageSize.width : pageSize.height) * zoom }}>
            <div ref={pageSurfaceRef} onPointerDown={beginSurfaceAction} onPointerMove={moveSurfaceAction} onPointerLeave={() => { if (!dragDraft) setHoveredTextHitId(null); }} onPointerUp={endSurfaceAction} onPointerCancel={() => setDragDraft(null)} className={`relative overflow-hidden bg-white shadow-[0_25px_70px_rgba(15,23,42,.22)] ${mode === "text" ? "cursor-text" : mode === "select" ? "cursor-default" : "cursor-crosshair"}`} style={{ width: pageSize.width * zoom, height: pageSize.height * zoom, transformOrigin: "0 0", transform: viewRotation === 90 ? `translateX(${pageSize.height * zoom}px) rotate(90deg)` : viewRotation === 180 ? `translate(${pageSize.width * zoom}px, ${pageSize.height * zoom}px) rotate(180deg)` : viewRotation === 270 ? `translateY(${pageSize.width * zoom}px) rotate(270deg)` : undefined }}>
              <canvas ref={canvasRef} data-ajn-pdf-preview-canvas="true" className={`absolute inset-0 z-[2] h-full w-full transition-opacity ${canvasPreviewReady ? "opacity-100" : "pointer-events-none opacity-0"}`} />
              {previewRendering && <div data-ajn-preview-loading="true" className="pointer-events-none absolute left-1/2 top-3 z-[95] -translate-x-1/2"><div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white/95 px-4 py-2 text-center shadow-lg backdrop-blur"><Loader2 className="h-4 w-4 animate-spin text-blue-600" /><p className="text-[10px] font-black text-slate-700">Rendering pageâ€¦</p></div></div>}
              {previewError && !previewRendering && <div data-ajn-preview-error="true" className="absolute left-1/2 top-14 z-[96] w-[min(92%,460px)] -translate-x-1/2"><div className="rounded-2xl border border-red-200 bg-red-50/95 p-4 text-center shadow-lg backdrop-blur"><p className="text-xs font-black text-red-800">This page could not be displayed</p><p className="mt-1 text-[10px] font-semibold leading-4 text-red-700">{previewError}</p><button type="button" onClick={(event) => { event.stopPropagation(); setError(""); setPreviewError(""); setPreviewRenderNonce((value) => value + 1); }} className="pointer-events-auto mt-3 rounded-xl bg-red-700 px-4 py-2 text-[10px] font-black text-white hover:bg-red-800">Retry editable preview</button></div></div>}
              {mode === "select" && showTableGuides && currentTableCells.map((cell) => <div key={`table-cell-${cell.row}-${cell.column}`} data-ajn-table-cell="true" data-table-row={cell.row + 1} data-table-column={cell.column + 1} className="pointer-events-none absolute z-[60] rounded-[2px] border border-dashed border-cyan-400/70 bg-cyan-100/5" style={{ left: cell.x * zoom, top: (pageSize.height - cell.y - cell.height) * zoom, width: cell.width * zoom, height: cell.height * zoom }}><span className="absolute left-0 top-0 rounded-br bg-cyan-600/85 px-1 py-0.5 text-[7px] font-black text-white">R{cell.row + 1} C{cell.column + 1}</span></div>)}
              {mode === "select" && interactiveTextHits.map((hit) => {
                const hovered = hoveredTextHitId === hit.id;
                const activating = activatingTextHitId === hit.id;
                return <button key={hit.id} type="button" data-source-text-hit={hit.ocr ? "ocr" : "pdf"} data-table-cell={hit.tableRow !== undefined ? "true" : undefined} data-table-row={hit.tableRow !== undefined ? hit.tableRow + 1 : undefined} data-table-column={hit.tableColumn !== undefined ? hit.tableColumn + 1 : undefined} title={hit.visualFallback ? "Image text region â€” click to replace" : `${hit.tableRow !== undefined ? `Table R${hit.tableRow + 1} C${(hit.tableColumn ?? 0) + 1}` : hit.ocr ? "Image/OCR" : "PDF"} text â€” click to edit: ${hit.text}`} aria-label={hit.visualFallback ? "Replace detected image text region" : `Edit ${hit.tableRow !== undefined ? `table row ${hit.tableRow + 1} column ${(hit.tableColumn ?? 0) + 1}` : hit.ocr ? "image OCR" : "PDF"} text ${hit.text}`} onPointerEnter={() => setHoveredTextHitId(hit.id)} onPointerLeave={() => setHoveredTextHitId((current) => current === hit.id ? null : current)} onPointerDown={(event) => { event.stopPropagation(); }} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void activateTextHit(hit); }} className={`absolute z-[75] cursor-text rounded-[2px] border transition-all duration-75 ${hovered || activating ? "border-violet-600 bg-violet-300/20 shadow-[0_0_0_2px_rgba(124,58,237,0.16)]" : hit.ocr ? "border-violet-300/55 bg-violet-200/5 hover:border-violet-500 hover:bg-violet-300/15" : "border-transparent hover:border-blue-500 hover:bg-blue-300/10"}`} style={{ left: hit.x * zoom, top: (pageSize.height - hit.y - hit.height) * zoom, width: Math.max(5, hit.width * zoom), height: Math.max(8, hit.height * zoom) }}>
                  {hovered && <span className="pointer-events-none absolute -top-6 left-0 z-[90] max-w-56 truncate rounded-md bg-violet-700 px-2 py-1 text-[9px] font-black text-white shadow">{hit.visualFallback ? "IMAGE TEXT REGION â€¢ CLICK TO REPLACE" : `${hit.tableRow !== undefined ? `TABLE R${hit.tableRow + 1} C${(hit.tableColumn ?? 0) + 1}` : hit.ocr ? "IMAGE TEXT" : "PDF TEXT"} â€¢ ${hit.text}`}</span>}
                  {activating && <span className="pointer-events-none absolute inset-0 grid place-items-center bg-white/60"><Loader2 className="h-3 w-3 animate-spin text-violet-700" /></span>}
                </button>;
              })}
              {mode === "select" && showImageHits && currentImageHits.filter((hit) => !convertedSourceIds.has(hit.id)).map((hit) => <button key={hit.id} type="button" title="Edit existing image" aria-label="Edit existing image" onClick={(event) => { event.stopPropagation(); void replaceImageHit(hit); }} className="absolute z-[11] border border-dashed border-emerald-500 bg-emerald-300/5 hover:bg-emerald-300/15" style={{ left: hit.x * zoom, top: (pageSize.height - hit.y - hit.height) * zoom, width: hit.width * zoom, height: hit.height * zoom }} />)}
              {pageObjects.map(renderObject)}
              {draftRect && <div className={`pointer-events-none absolute z-50 border-2 border-dashed ${mode === "redact" ? "border-red-600 bg-black/20" : mode === "link" ? "border-cyan-500 bg-cyan-100/20" : "border-blue-500 bg-blue-100/20"}`} style={draftRect} />}
            </div>
            </div>
            <div className="mt-3 flex max-w-[900px] flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-slate-500"><span>Blue = native text â€¢ violet = OCR/image-text â€¢ cyan dashed = detected table cells â€¢ optional green dashed = embedded image. Full-page scan backgrounds never block text.</span><span>Ctrl+A selects editable text on this page. If none exists, it creates editable page text.</span></div>
          </div>
        </section>

        <aside className="border-l border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Properties</p><p className="mt-1 text-[10px] font-bold text-slate-400">{selectedIds.length > 1 ? `${selectedIds.length} objects selected` : selectedObject ? selectedObject.type : "Nothing selected"}</p></div>{selectedIds.length > 0 && <button type="button" onClick={clearSelection} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-4 w-4" /></button>}</div>

          {!selectedObject && <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="text-sm font-black text-blue-950">Full text editing</p><p className="mt-2 text-xs font-medium leading-5 text-blue-800">Scanned page backgrounds stay fixed so they cannot block text interaction. OCR runs automatically for scan-like pages and can always be forced with <b>Scan current page</b>. If OCR confidence is weak, AJN PDF leaves the replacement blank instead of showing garbage characters. Click the violet region and type the replacement. OCR replacements sample the original ink/background color and estimate the closest browser font and size. Use <b>Page text</b>/<b>All text</b> only for recognized/native text. Use Add text to place new words anywhere on the scan.</p></div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><div className="flex items-center justify-between gap-2"><div><p className="text-sm font-black text-violet-950">OCR image text</p><p className="mt-0.5 max-w-[190px] text-[10px] font-black leading-4 text-violet-600">{ocrBusy ? status || "Preparing OCRâ€¦" : currentOcrHits.length ? `${currentOcrHits.length} editable OCR box${currentOcrHits.length === 1 ? "" : "es"} ready` : "Not scanned yet"}</p></div><select value={ocrLanguage} disabled={ocrBusy} onChange={(event) => setOcrLanguage(event.target.value as OcrLanguage)} className="rounded-lg border border-violet-200 bg-white px-2 py-1 text-[10px] font-black">{OCR_LANGUAGES.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}</select></div>{ocrBusy ? <button type="button" onClick={cancelOcr} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2.5 text-[11px] font-black text-white shadow-sm"><X className="h-4 w-4" /> Stop OCR</button> : <button type="button" disabled={activeSourceIndex === undefined} onClick={() => void scanCurrentPage()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-3 py-2.5 text-[11px] font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"><ScanText className="h-4 w-4" /> Scan current page for editable text</button>}<div className="mt-2 grid grid-cols-3 gap-2"><button type="button" disabled={ocrBusy} onClick={() => void scanCurrentPage("word")} className={`rounded-xl border px-2 py-2 text-[10px] font-black disabled:opacity-50 ${ocrGranularity === "word" ? "border-violet-500 bg-violet-600 text-white" : "border-violet-200 bg-white text-violet-800"}`}>Scan + Word editing</button><button type="button" disabled={ocrBusy} onClick={() => void scanCurrentPage("line")} className={`rounded-xl border px-2 py-2 text-[10px] font-black disabled:opacity-50 ${ocrGranularity === "line" ? "border-violet-500 bg-violet-600 text-white" : "border-violet-200 bg-white text-violet-800"}`}>Scan + Line editing</button><button type="button" disabled={ocrBusy} onClick={() => void scanCurrentPage("table")} className={`rounded-xl border px-2 py-2 text-[10px] font-black disabled:opacity-50 ${ocrGranularity === "table" ? "border-cyan-600 bg-cyan-600 text-white" : "border-cyan-200 bg-white text-cyan-800"}`}><span className="inline-flex items-center gap-1"><Table2 className="h-3.5 w-3.5" /> Scan + Table editing</span></button></div><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" disabled={ocrBusy || loading || !currentOcrHits.some((hit) => hit.text && !hit.visualFallback && !convertedSourceIds.has(hit.id))} onClick={() => void makeDetectedScanTextEditable(false)} className="rounded-xl border border-violet-200 bg-white px-2 py-2 text-[10px] font-black text-violet-800 disabled:opacity-40">Make scan text editable</button><button type="button" disabled={ocrBusy || loading || !currentTableHits.some((hit) => hit.text && !hit.visualFallback && !convertedSourceIds.has(hit.id))} onClick={() => void makeDetectedScanTextEditable(true)} className="rounded-xl border border-cyan-200 bg-cyan-50 px-2 py-2 text-[10px] font-black text-cyan-800 disabled:opacity-40">Make table text editable</button></div><button type="button" disabled={ocrBusy || !uniqueSourceIndexes.length} onClick={() => void scanAllPages()} className="mt-2 w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-[10px] font-black text-violet-800 disabled:opacity-50">Scan all pages</button>{currentTableCells.length > 0 && <label className="mt-2 flex items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-[10px] font-black text-cyan-800"><input type="checkbox" checked={showTableGuides} onChange={(event) => setShowTableGuides(event.target.checked)} /> Show {currentTableCells.length} detected table cell{currentTableCells.length === 1 ? "" : "s"}</label>}<p className="mt-2 text-xs font-medium leading-5 text-violet-800">Word mode edits individual OCR words. Table mode detects long grid rules, removes only those rules for recognition, groups recognized words into editable cells, and keeps unread cell regions available for manual replacement. Use Make scan/table text editable to convert recognized content in one batch. OCR script loading has a 12-second watchdog, worker startup has a 45-second watchdog, recognition has a 90-second watchdog, and Stop OCR remains available.</p></div>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><p className="text-sm font-black text-red-950">Secure redaction</p><p className="mt-2 text-xs font-medium leading-5 text-red-800">Redact rasterizes only affected pages during export and burns the black regions into the page image. This removes recoverable underlying text from those page objects, but that page loses searchable/vector content.</p></div>
          </div>}

          {selectedObject?.type === "text" && <div className="mt-5 space-y-4">
            <div className={`rounded-2xl border p-3 ${selectedObject.fontMatch === "exact" ? "border-emerald-200 bg-emerald-50" : selectedObject.fontMatch === "ocr" ? "border-violet-200 bg-violet-50" : selectedObject.fontMatch === "family" ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}`}><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Text source</span><span className="rounded-lg bg-slate-900 px-2 py-1 text-[9px] font-black uppercase text-white">{selectedObject.source === "ocr" ? "OCR" : selectedObject.source === "replacement" ? selectedObject.fontMatch : "New"}</span></div><p className="mt-2 break-all text-xs font-black text-slate-900">{selectedObject.loadedFontName || selectedObject.fontFamily || selectedObject.fontRef}</p><p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">For scanned OCR text, AJN PDF samples the original ink/background and estimates the closest available browser font/size. Exact font recovery from pixels is not technically guaranteed; low-confidence OCR is intentionally left blank instead of showing decoded garbage.</p></div>
            {selectedObject.sourceHitId && <div data-ajn-style-match-panel="true" className={`rounded-2xl border p-3 ${selectedObject.autoStyle !== false ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><div className="flex items-center justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-600">Original style match</p><p className="mt-1 text-[10px] font-semibold text-slate-600">{selectedObject.autoStyle !== false ? "Automatic matching is ON while you type." : "Manual style override is active."}</p></div><span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase ${selectedObject.autoStyle !== false ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}`}>{selectedObject.autoStyle !== false ? "AUTO" : "MANUAL"}</span></div><div className="mt-3 grid grid-cols-[32px_1fr] items-center gap-2"><span className="h-8 w-8 rounded-lg border border-black/10 shadow-inner" style={{ backgroundColor: selectedObject.color }} aria-label={`Matched text color ${selectedObject.color}`} /><div className="min-w-0"><p className="truncate text-xs font-black text-slate-900">{selectedObject.fontFamily} â€¢ {selectedObject.fontSize.toFixed(1)} pt</p><p className="text-[9px] font-bold text-slate-500">{selectedObject.bold ? "Bold" : "Regular"}{selectedObject.italic ? " â€¢ Italic" : ""} â€¢ width {(selectedObject.horizontalScale * 100).toFixed(0)}%{selectedObject.styleConfidence !== undefined ? ` â€¢ confidence ${Math.round(selectedObject.styleConfidence * 100)}%` : ""}</p></div></div><button type="button" disabled={loading || ocrBusy} onClick={() => void rematchSelectedTextStyle()} className="mt-3 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-[10px] font-black text-emerald-700 hover:bg-emerald-50 disabled:opacity-40">Re-match font + size + color from original</button></div>}
            <label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Text</span><textarea value={selectedObject.text} onFocus={() => rememberTextEditStart(selectedObject)} onChange={(event) => updateTextValue(selectedObject, event.target.value)} onBlur={() => finishTextEdit(selectedObject.id)} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-blue-400" /></label>
            <label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Font family</span><input value={selectedObject.fontFamily} onChange={(event) => updateObject(selectedObject.id, { fontFamily: event.target.value, loadedFontName: "", renderMode: "visual-match", autoStyle: false } as Partial<EditorObject>)} placeholder="Arial, Times New Romanâ€¦" className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold" /></label>
            <div className="grid grid-cols-2 gap-3"><label><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Font size</span><input type="number" min={5} max={200} step={0.5} value={selectedObject.fontSize} onChange={(event) => updateObject(selectedObject.id, { fontSize: clamp(Number(event.target.value) || 12, 5, 200), matchedFontSize: clamp(Number(event.target.value) || 12, 5, 200), autoStyle: false } as Partial<EditorObject>)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold" /></label><label><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Line spacing</span><input type="number" min={0.7} max={3} step={0.05} value={selectedObject.lineHeight} onChange={(event) => updateObject(selectedObject.id, { lineHeight: clamp(Number(event.target.value) || 1.2, 0.7, 3), autoStyle: false } as Partial<EditorObject>)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold" /></label></div>
            <div className="grid grid-cols-2 gap-3"><label><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Letter spacing</span><input type="number" min={-5} max={20} step={0.25} value={selectedObject.letterSpacing} onChange={(event) => updateObject(selectedObject.id, { letterSpacing: clamp(Number(event.target.value) || 0, -5, 20), autoStyle: false } as Partial<EditorObject>)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold" /></label><label><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Rotation</span><input type="number" min={-360} max={360} value={selectedObject.rotation} onChange={(event) => updateObject(selectedObject.id, { rotation: Number(event.target.value) || 0 } as Partial<EditorObject>)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold" /></label></div>
            <div className="grid grid-cols-2 gap-3"><label><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Text color</span><input type="color" value={selectedObject.color} onChange={(event) => updateObject(selectedObject.id, { color: event.target.value, autoStyle: false } as Partial<EditorObject>)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white p-1" /></label><label><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Background</span><div className="mt-2 flex gap-1"><input type="color" value={selectedObject.background === "transparent" ? "#ffffff" : selectedObject.background} onChange={(event) => updateObject(selectedObject.id, { background: event.target.value } as Partial<EditorObject>)} className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-1" /><button type="button" onClick={() => updateObject(selectedObject.id, { background: "transparent" } as Partial<EditorObject>)} className="rounded-xl border border-slate-200 px-2 text-[9px] font-black">None</button></div></label></div>
            <div className="flex flex-wrap gap-1"><ToolbarButton title="Bold" active={selectedObject.bold} onClick={() => updateObject(selectedObject.id, { bold: !selectedObject.bold, autoStyle: false } as Partial<EditorObject>, true)}><Bold className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Italic" active={selectedObject.italic} onClick={() => updateObject(selectedObject.id, { italic: !selectedObject.italic, autoStyle: false } as Partial<EditorObject>, true)}><Italic className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Underline" active={selectedObject.underline} onClick={() => updateObject(selectedObject.id, { underline: !selectedObject.underline } as Partial<EditorObject>, true)}><Underline className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Align left" active={selectedObject.align === "left"} onClick={() => updateObject(selectedObject.id, { align: "left" } as Partial<EditorObject>, true)}><AlignLeft className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Align center" active={selectedObject.align === "center"} onClick={() => updateObject(selectedObject.id, { align: "center" } as Partial<EditorObject>, true)}><AlignCenter className="h-4 w-4" /></ToolbarButton><ToolbarButton title="Align right" active={selectedObject.align === "right"} onClick={() => updateObject(selectedObject.id, { align: "right" } as Partial<EditorObject>, true)}><AlignRight className="h-4 w-4" /></ToolbarButton></div>
            <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setInlineEditingId(selectedObject.id)} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">Edit / replace</button><button type="button" onClick={addTextNearSelected} className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">Add text nearby</button>{selectedObject.sourceHitId && <><button type="button" onClick={removeSelectedSourceText} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700">Remove original text</button><button type="button" onClick={restoreOriginalSelected} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">Restore original</button></>}</div>{selectedObject.sourceHitId && currentTextHits.find((hit) => hit.id === selectedObject.sourceHitId)?.tableRow !== undefined && (() => { const sourceHit = currentTextHits.find((hit) => hit.id === selectedObject.sourceHitId)!; return <p className="rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-[10px] font-black text-cyan-800">Table cell â€¢ Row {(sourceHit.tableRow ?? 0) + 1} â€¢ Column {(sourceHit.tableColumn ?? 0) + 1}</p>; })()}<p className="rounded-xl bg-slate-50 p-3 text-[10px] font-semibold leading-5 text-slate-600">For OCR/image text, Remove keeps the sampled background cover so the old word stays erased. Restore original removes both the replacement and its cover.</p>
          </div>}

          {selectedObject?.type === "link" && <div className="mt-5 space-y-4"><label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Link URL</span><input value={selectedObject.url} onChange={(event) => updateObject(selectedObject.id, { url: event.target.value } as Partial<EditorObject>)} placeholder="https://example.com or mailto:name@example.com" className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold" /></label><p className="rounded-xl bg-cyan-50 p-3 text-[10px] font-semibold leading-5 text-cyan-800">The dashed cyan box is only an editor guide. Export creates a clickable PDF link annotation.</p></div>}

          {(selectedObject?.type === "image" || selectedObject?.type === "signature") && <div className="mt-5 space-y-4"><button type="button" onClick={() => imageInputRef.current?.click()} className="w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">{selectedObject.type === "image" ? "Replace image" : "Use another image"}</button><label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Rotation</span><input type="number" min={-360} max={360} value={selectedObject.rotation} onChange={(event) => updateObject(selectedObject.id, { rotation: Number(event.target.value) || 0 } as Partial<EditorObject>)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold" /></label></div>}

          {selectedObject && ["whiteout", "highlight", "rect", "ellipse", "redact"].includes(selectedObject.type) && <div className="mt-5 space-y-4">{selectedObject.type !== "redact" && <><label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Fill</span><input type="color" value={(selectedObject as RectObject).fill === "transparent" ? "#ffffff" : (selectedObject as RectObject).fill} onChange={(event) => updateObject(selectedObject.id, { fill: event.target.value } as Partial<EditorObject>)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white p-1" /></label><label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Border</span><input type="color" value={(selectedObject as RectObject).stroke === "transparent" ? "#2563eb" : (selectedObject as RectObject).stroke} onChange={(event) => updateObject(selectedObject.id, { stroke: event.target.value } as Partial<EditorObject>)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white p-1" /></label></>} {selectedObject.type === "redact" && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[10px] font-semibold leading-5 text-red-800">Secure redaction is fixed black and fully opaque. On export, the affected original page is rasterized and the redaction is burned into the pixels.</div>}</div>}

          {selectedObject && <div className="mt-5 space-y-4 border-t border-slate-100 pt-5"><label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Opacity {Math.round(selectedObject.opacity * 100)}%</span><input type="range" min={selectedObject.type === "redact" ? 100 : 10} max={100} value={selectedObject.type === "redact" ? 100 : Math.round(selectedObject.opacity * 100)} onChange={(event) => updateObject(selectedObject.id, { opacity: Number(event.target.value) / 100 } as Partial<EditorObject>)} className="mt-2 w-full" /></label><div className="grid grid-cols-1 gap-2"><button type="button" onClick={duplicateSelected} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Duplicate</button><button type="button" onClick={deleteSelected} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700">Remove selected</button></div></div>}

          <div className="mt-6 border-t border-slate-100 pt-5"><div className="rounded-2xl bg-emerald-50 p-4"><div className="flex items-center gap-2 text-xs font-black text-emerald-900"><ShieldCheck className="h-4 w-4" /> Local processing workflow</div><p className="mt-2 text-[11px] font-medium leading-5 text-emerald-800">PDF bytes stay in this browser for editing/export. OCR uses same-origin static assets under /ajn-ocr with no runtime CDN dependency. Local recovery uses IndexedDB.</p></div><button type="button" onClick={() => void resetEditor()} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Close local document</button></div>
        </aside>
      </div>

      {(status || error) && <div role={error ? "alert" : "status"} aria-live="polite" className="fixed bottom-4 left-1/2 z-[150] w-[min(92vw,680px)] -translate-x-1/2"><div className={`rounded-2xl border px-4 py-3 text-sm font-bold shadow-xl ${error ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700"}`}><div className="flex items-center gap-2">{exporting || loading || ocrBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : error ? <X className="h-4 w-4" /> : <Save className="h-4 w-4 text-emerald-600" />}<span>{error || status}</span>{error && <button type="button" onClick={() => setError("")} className="ml-auto rounded-lg p-1 hover:bg-red-100"><X className="h-4 w-4" /></button>}</div></div></div>}
    </main>
  );
}
