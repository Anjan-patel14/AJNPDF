/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import {
  Camera, CheckCircle2, ChevronDown, ChevronUp, Download, FileImage, FilePlus2,
  Loader2, Maximize2, RotateCw, ScanLine, Search, Trash2, X,
} from "lucide-react";
import {
  Btn, ToolWorkspace, beginToolProcessing, completeToolProcessing, dl,
  failToolProcessing, safeOutputName, updateToolProcessing,
} from "./_shared";

type Point = { x: number; y: number };
type ScanMode = "original" | "color" | "grayscale" | "document";
type PageSizeMode = "auto" | "a4" | "letter";
type OcrLanguage = "eng" | "hin" | "tel" | "tam" | "kan" | "mal";

type OcrLine = {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  confidence: number;
};

type OcrRecognizeResult = {
  data?: {
    tsv?: string;
  };
};

type ScanPage = {
  id: string;
  name: string;
  sourceBlob: Blob;
  sourceUrl: string;
  processedBlob?: Blob;
  processedUrl?: string;
  width: number;
  height: number;
  processedWidth?: number;
  processedHeight?: number;
  corners: Point[];
  confidence: number;
  rotation: 0 | 90 | 180 | 270;
  mode: ScanMode;
  brightness: number;
  contrast: number;
  sharpness: number;
  ocrLanguage?: OcrLanguage;
  ocrText?: string;
  ocrLines?: OcrLine[];
};

type WorkerResponse = {
  id: number;
  ok: boolean;
  type?: string;
  message?: string;
  corners?: Point[];
  confidence?: number;
  width?: number;
  height?: number;
  buffer?: ArrayBuffer;
};

declare global {
  interface Window {
    Tesseract?: {
      createWorker: (language: string, oem?: number, options?: Record<string, unknown>) => Promise<any>;
    };
  }
}

const MAX_PAGES = 30;
const MAX_FILE_BYTES = 18 * 1024 * 1024;
const MAX_TOTAL_BYTES = 120 * 1024 * 1024;
const MAX_SOURCE_SIDE = 3200;
const MAX_SOURCE_PIXELS = 16_000_000;
const CAMERA_DETECT_SIDE = 760;
const OCR_RUNTIME_BASE = "/ajn-ocr";
const TESSERACT_LOCAL_SCRIPT = `${OCR_RUNTIME_BASE}/tesseract.min.js`;
const OCR_LANGUAGES: Array<{ value: OcrLanguage; label: string }> = [
  { value: "eng", label: "English" },
  { value: "hin", label: "Hindi" },
  { value: "tel", label: "Telugu" },
  { value: "tam", label: "Tamil" },
  { value: "kan", label: "Kannada" },
  { value: "mal", label: "Malayalam" },
];

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto)
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const DEFAULT_CORNERS: Point[] = [
  { x: 0.04, y: 0.04 }, { x: 0.96, y: 0.04 },
  { x: 0.96, y: 0.96 }, { x: 0.04, y: 0.96 },
];

function extensionOf(name: string) {
  const m = /\.[^.]+$/.exec(name.toLowerCase());
  return m?.[0] || "";
}

function isHeic(file: File) {
  const ext = extensionOf(file.name);
  return ext === ".heic" || ext === ".heif" || /image\/hei[cf]/i.test(file.type);
}

async function decodeInputFile(file: File): Promise<Blob> {
  if (!isHeic(file)) return file;
  try {
    const mod = await import("heic2any");
    const result = await mod.default({ blob: file, toType: "image/jpeg", quality: 0.94 });
    return Array.isArray(result) ? result[0] : result;
  } catch {
    throw new Error("This HEIC/HEIF image could not be decoded reliably in this browser. Use JPG, PNG or WebP for this scan.");
  }
}

function canvasBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.94) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("The browser could not encode the scanned page.")),
      type,
      quality,
    );
  });
}

async function blobToImageData(blob: Blob, maxSide = MAX_SOURCE_SIDE, maxPixels = MAX_SOURCE_PIXELS) {
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(
      1,
      maxSide / Math.max(bitmap.width, bitmap.height),
      Math.sqrt(maxPixels / Math.max(1, bitmap.width * bitmap.height)),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas image processing is unavailable.");
    ctx.drawImage(bitmap, 0, 0, width, height);
    return { imageData: ctx.getImageData(0, 0, width, height), width, height };
  } finally {
    bitmap.close();
  }
}

async function rgbaToBlob(buffer: ArrayBuffer, width: number, height: number, type = "image/jpeg", quality = 0.94) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas output is unavailable.");
  const copy = new Uint8ClampedArray(buffer.slice(0));
  ctx.putImageData(new ImageData(copy, width, height), 0, 0);
  return canvasBlob(canvas, type, quality);
}

function pagePdfSize(mode: PageSizeMode, imageWidth: number, imageHeight: number) {
  const landscape = imageWidth > imageHeight;
  if (mode === "auto") {
    const max = 842;
    const aspect = imageWidth / Math.max(1, imageHeight);
    const w = aspect >= 1 ? max : max * aspect;
    const h = aspect >= 1 ? max / aspect : max;
    return [Math.max(144, w), Math.max(144, h)] as const;
  }
  const base = mode === "letter" ? [612, 792] : [595.28, 841.89];
  return landscape
    ? [Math.max(...base), Math.min(...base)] as const
    : [Math.min(...base), Math.max(...base)] as const;
}

function fitInside(pageWidth: number, pageHeight: number, imageWidth: number, imageHeight: number) {
  const scale = Math.min(pageWidth / imageWidth, pageHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height };
}

function parseTsv(tsv: string, imageWidth: number, imageHeight: number): { text: string; lines: OcrLine[] } {
  const rows = tsv.split(/\r?\n/).slice(1);
  const groups = new Map<string, Array<{ text: string; left: number; top: number; width: number; height: number; conf: number }>>();
  for (const row of rows) {
    if (!row.trim()) continue;
    const cols = row.split("\t");
    if (cols.length < 12) continue;
    const level = Number(cols[0]);
    if (level !== 5) continue;
    const text = cols.slice(11).join("\t").normalize("NFC").replace(/\s+/g, " ").trim();
    const conf = Number(cols[10]);
    if (!text || !Number.isFinite(conf) || conf < 30) continue;
    const left = Number(cols[6]), top = Number(cols[7]), width = Number(cols[8]), height = Number(cols[9]);
    if (![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0) continue;
    const key = `${cols[1]}:${cols[2]}:${cols[3]}:${cols[4]}`;
    const list = groups.get(key) || [];
    list.push({ text, left, top, width, height, conf });
    groups.set(key, list);
  }

  const lines: OcrLine[] = [];
  for (const words of groups.values()) {
    words.sort((a, b) => a.left - b.left);
    const left = Math.min(...words.map((w) => w.left));
    const top = Math.min(...words.map((w) => w.top));
    const right = Math.max(...words.map((w) => w.left + w.width));
    const bottom = Math.max(...words.map((w) => w.top + w.height));
    lines.push({
      text: words.map((w) => w.text).join(" "),
      left: left / imageWidth,
      top: top / imageHeight,
      width: (right - left) / imageWidth,
      height: (bottom - top) / imageHeight,
      confidence: words.reduce((sum, w) => sum + w.conf, 0) / words.length,
    });
  }
  lines.sort((a, b) => a.top - b.top || a.left - b.left);
  return { text: lines.map((line) => line.text).join("\n"), lines };
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer = 0;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    window.clearTimeout(timer);
  }
}

async function loadTesseract() {
  if (window.Tesseract?.createWorker) return window.Tesseract;
  const stale = document.querySelector<HTMLScriptElement>('script[data-ajn-tesseract="true"]');
  if (stale && !window.Tesseract?.createWorker) stale.remove();
  await withTimeout(new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${TESSERACT_LOCAL_SCRIPT}?v=5.7.0`;
    script.async = true;
    script.dataset.ajnTesseract = "true";
    script.onload = () => window.Tesseract?.createWorker
      ? resolve()
      : reject(new Error("Local OCR loaded but did not initialize."));
    script.onerror = () => reject(new Error("The same-origin AJN OCR runtime could not be loaded."));
    document.head.appendChild(script);
  }), 15_000, "Local OCR did not initialize within 15 seconds.");
  if (!window.Tesseract?.createWorker) throw new Error("Local OCR is unavailable.");
  return window.Tesseract;
}

class ScanWorkerClient {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<number, { resolve: (value: WorkerResponse) => void; reject: (error: Error) => void }>();
  ready: Promise<void>;

  constructor() {
    this.worker = new Worker("/ajn-scan/opencv-worker.js", { name: "ajn-scan-opencv" });
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.type === "runtime-ready") return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (!message.ok) pending.reject(new Error(message.message || "Scanner worker failed."));
      else pending.resolve(message);
    };
    this.worker.onerror = (event) => {
      const error = new Error(event.message || "Scanner worker crashed.");
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    };
    this.ready = this.request("ping", undefined, [], 30_000).then(() => undefined);
  }

  request(type: string, payload?: Record<string, unknown>, transfer: Transferable[] = [], timeoutMs = 45_000) {
    const id = this.nextId++;
    const promise = new Promise<WorkerResponse>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, ...(payload || {}) }, transfer);
    });
    return withTimeout(promise, timeoutMs, `${type} timed out.`).finally(() => this.pending.delete(id));
  }

  terminate() {
    this.worker.terminate();
    for (const p of this.pending.values()) p.reject(new Error("Scanner worker stopped."));
    this.pending.clear();
  }
}

export default function ScanToPdf() {
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [liveCorners, setLiveCorners] = useState<Point[]>(DEFAULT_CORNERS);
  const [liveConfidence, setLiveConfidence] = useState(0);
  const [ocrLanguage, setOcrLanguage] = useState<OcrLanguage>("eng");
  const [pageSizeMode, setPageSizeMode] = useState<PageSizeMode>("auto");
  const [outputName, setOutputName] = useState("scanned-document.pdf");
  const [ocrEnabled, setOcrEnabled] = useState(true);
  const [cameraBusy, setCameraBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraTimerRef = useRef<number | null>(null);
  const cameraDetectBusyRef = useRef(false);
  const workerRef = useRef<ScanWorkerClient | null>(null);
  const ocrWorkerRef = useRef<any>(null);
  const ocrWorkerLanguageRef = useRef<OcrLanguage | null>(null);
  const pagesRef = useRef<ScanPage[]>([]);

  const activePage = useMemo(() => pages.find((page) => page.id === activeId) || pages[0] || null, [pages, activeId]);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  const ensureWorker = useCallback(async () => {
    if (!workerRef.current) workerRef.current = new ScanWorkerClient();
    await workerRef.current.ready;
    return workerRef.current;
  }, []);

  const releasePage = useCallback((page: ScanPage) => {
    URL.revokeObjectURL(page.sourceUrl);
    if (page.processedUrl) URL.revokeObjectURL(page.processedUrl);
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraTimerRef.current !== null) {
      window.clearInterval(cameraTimerRef.current);
      cameraTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
    setLiveConfidence(0);
    setLiveCorners(DEFAULT_CORNERS);
  }, []);

  useEffect(() => () => {
    stopCamera();
    workerRef.current?.terminate();
    workerRef.current = null;
    void Promise.resolve(ocrWorkerRef.current?.terminate?.()).catch(() => undefined);
    for (const page of pagesRef.current) releasePage(page);
  }, [releasePage, stopCamera]);

  const runDetect = useCallback(async (blob: Blob, maxSide = 1100) => {
    const { imageData, width, height } = await blobToImageData(blob, maxSide, Math.min(MAX_SOURCE_PIXELS, maxSide * maxSide * 2));
    const buffer = imageData.data.buffer.slice(0) as ArrayBuffer;
    const worker = await ensureWorker();
    const result = await worker.request("detect", { width, height, buffer }, [buffer], 30_000);
    return {
      corners: result.corners?.length === 4 ? result.corners : DEFAULT_CORNERS,
      confidence: result.confidence || 0,
    };
  }, [ensureWorker]);

  const processPage = useCallback(async (page: ScanPage, changes?: Partial<ScanPage>) => {
    const draft = { ...page, ...(changes || {}) };
    const { imageData, width, height } = await blobToImageData(draft.sourceBlob);
    const buffer = imageData.data.buffer.slice(0) as ArrayBuffer;
    const worker = await ensureWorker();
    const result = await worker.request("process", {
      width, height, buffer,
      corners: draft.corners,
      mode: draft.mode,
      brightness: draft.brightness,
      contrast: draft.contrast,
      sharpness: draft.sharpness,
      rotation: draft.rotation,
    }, [buffer], 60_000);
    if (!result.buffer || !result.width || !result.height) throw new Error("Scanner returned an incomplete page.");
    const processedBlob = await rgbaToBlob(result.buffer, result.width, result.height, "image/jpeg", 0.94);
    const processedUrl = URL.createObjectURL(processedBlob);
    if (page.processedUrl) URL.revokeObjectURL(page.processedUrl);
    const updated: ScanPage = {
      ...draft,
      processedBlob,
      processedUrl,
      processedWidth: result.width,
      processedHeight: result.height,
      ocrText: changes ? undefined : draft.ocrText,
      ocrLines: changes ? undefined : draft.ocrLines,
      ocrLanguage: changes ? undefined : draft.ocrLanguage,
    };
    pagesRef.current = pagesRef.current.map((item) => item.id === page.id ? updated : item);
    setPages(pagesRef.current);
    return updated;
  }, [ensureWorker]);

  const prepareFile = useCallback(async (file: File) => {
    if (file.size <= 0) throw new Error(`${file.name} is empty.`);
    if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} exceeds the 18 MB per-image limit.`);
    const decoded = await decodeInputFile(file);
    const { imageData, width, height } = await blobToImageData(decoded);
    const normalizedCanvas = document.createElement("canvas");
    normalizedCanvas.width = width;
    normalizedCanvas.height = height;
    const normalizedCtx = normalizedCanvas.getContext("2d");
    if (!normalizedCtx) throw new Error("Image normalization canvas is unavailable.");
    normalizedCtx.putImageData(imageData, 0, 0);
    const sourceBlob = await canvasBlob(normalizedCanvas, "image/jpeg", 0.95);
    const detection = await runDetect(sourceBlob);
    const sourceUrl = URL.createObjectURL(sourceBlob);
    const page: ScanPage = {
      id: uid(),
      name: file.name,
      sourceBlob,
      sourceUrl,
      width,
      height,
      corners: detection.corners,
      confidence: detection.confidence,
      rotation: 0,
      mode: "color",
      brightness: 0,
      contrast: 1.04,
      sharpness: 0.3,
    };
    return processPage(page);
  }, [processPage, runDetect]);

  const addFiles = useCallback(async (raw: File[]) => {
    setError("");
    const supported = raw.filter((file) =>
      /image\/(jpeg|png|webp|heic|heif)/i.test(file.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name),
    );
    if (!supported.length) {
      setError("Choose JPG, JPEG, PNG, WebP or a HEIC/HEIF file supported by this browser.");
      return;
    }
    const existingBytes = pagesRef.current.reduce((sum, page) => sum + page.sourceBlob.size, 0);
    const incomingBytes = supported.reduce((sum, file) => sum + file.size, 0);
    if (pagesRef.current.length + supported.length > MAX_PAGES) {
      setError(`A scan can contain up to ${MAX_PAGES} pages.`);
      return;
    }
    if (existingBytes + incomingBytes > MAX_TOTAL_BYTES) {
      setError("The selected scan is too large for safe in-browser processing. Keep the source images under 120 MB combined.");
      return;
    }

    setBusy(true);
    beginToolProcessing("Preparing document scan");
    try {
      for (let index = 0; index < supported.length; index += 1) {
        setStatus(`Preparing page ${index + 1} of ${supported.length}`);
        updateToolProcessing(undefined, `Detecting page ${index + 1}`);
        const page = await prepareFile(supported[index]);
        pagesRef.current = [...pagesRef.current, page];
        setPages(pagesRef.current);
        setActiveId((current) => current || page.id);
      }
      setStatus("Pages ready");
      completeToolProcessing();
    } catch (e) {
      failToolProcessing();
      setError(e instanceof Error ? e.message : "A page could not be prepared.");
    } finally {
      setBusy(false);
    }
  }, [prepareFile]);

  const startCamera = useCallback(async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera capture is not available in this browser. Upload an image instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      cameraTimerRef.current = window.setInterval(async () => {
        if (cameraDetectBusyRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
        cameraDetectBusyRef.current = true;
        try {
          const video = videoRef.current;
          const scale = Math.min(1, CAMERA_DETECT_SIDE / Math.max(video.videoWidth, video.videoHeight));
          const width = Math.max(1, Math.round(video.videoWidth * scale));
          const height = Math.max(1, Math.round(video.videoHeight * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const buffer = imageData.data.buffer.slice(0) as ArrayBuffer;
          const worker = await ensureWorker();
          const result = await worker.request("detect", { width, height, buffer }, [buffer], 7_000);
          if (result.corners?.length === 4) setLiveCorners(result.corners);
          setLiveConfidence(result.confidence || 0);
        } catch {
          // Real-time detection is advisory; capture remains available with manual corners.
        } finally {
          cameraDetectBusyRef.current = false;
        }
      }, 300);
    } catch (e) {
      stopCamera();
      setError(e instanceof Error ? e.message : "Camera access was not granted.");
    }
  }, [ensureWorker, stopCamera]);

  const captureCamera = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    setCameraBusy(true);
    try {
      const scale = Math.min(1, MAX_SOURCE_SIDE / Math.max(video.videoWidth, video.videoHeight));
      const width = Math.max(1, Math.round(video.videoWidth * scale));
      const height = Math.max(1, Math.round(video.videoHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Camera canvas is unavailable.");
      ctx.drawImage(video, 0, 0, width, height);
      const blob = await canvasBlob(canvas, "image/jpeg", 0.95);
      const file = new File([blob], `scan-${pagesRef.current.length + 1}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
      await addFiles([file]);
    } finally {
      setCameraBusy(false);
    }
  }, [addFiles]);

  const movePage = (id: string, direction: -1 | 1) => {
    const current = pagesRef.current;
    const index = current.findIndex((page) => page.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    pagesRef.current = next;
    setPages(next);
  };

  const deletePage = (id: string) => {
    const target = pagesRef.current.find((page) => page.id === id);
    if (target) releasePage(target);
    const next = pagesRef.current.filter((page) => page.id !== id);
    pagesRef.current = next;
    setPages(next);
    if (activeId === id) setActiveId(next[0]?.id || null);
  };

  const updateActive = useCallback(async (changes: Partial<ScanPage>, reprocess = true) => {
    if (!activePage) return;
    const draft = { ...activePage, ...changes };
    setPages((current) => current.map((page) => page.id === activePage.id ? draft : page));
    if (!reprocess) return;
    setBusy(true);
    try {
      setStatus("Applying scan adjustments");
      await processPage(activePage, changes);
      setStatus("Page updated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The page could not be updated.");
    } finally {
      setBusy(false);
    }
  }, [activePage, processPage]);

  const dragCorner = useCallback((index: number, event: React.PointerEvent<HTMLButtonElement>) => {
    if (!activePage) return;
    const overlay = event.currentTarget.parentElement;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (pointer: PointerEvent) => {
      const x = clamp((pointer.clientX - rect.left) / rect.width, 0.005, 0.995);
      const y = clamp((pointer.clientY - rect.top) / rect.height, 0.005, 0.995);
      const next = pagesRef.current.map((page) => {
        if (page.id !== activePage.id) return page;
        const corners = page.corners.map((point) => ({ ...point }));
        corners[index] = { x, y };
        return { ...page, corners, confidence: 1 };
      });
      pagesRef.current = next;
      setPages(next);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  }, [activePage]);

  const applyManualCorners = useCallback(async () => {
    const latest = pagesRef.current.find((page) => page.id === activePage?.id);
    if (!latest) return;
    setBusy(true);
    try {
      setStatus("Applying perspective correction");
      await processPage(latest, { corners: latest.corners, confidence: 1 });
      setStatus("Perspective corrected");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Perspective correction failed.");
    } finally {
      setBusy(false);
    }
  }, [activePage?.id, processPage]);

  const resetDetection = useCallback(async () => {
    if (!activePage) return;
    setBusy(true);
    try {
      const detection = await runDetect(activePage.sourceBlob);
      setPages((current) => current.map((page) => page.id === activePage.id ? { ...page, ...detection } : page));
      const latest = { ...activePage, ...detection };
      await processPage(latest, detection);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Automatic edge detection failed.");
    } finally {
      setBusy(false);
    }
  }, [activePage, processPage, runDetect]);

  const ensureOcrWorker = useCallback(async (language: OcrLanguage) => {
    if (ocrWorkerRef.current && ocrWorkerLanguageRef.current === language) return ocrWorkerRef.current;
    if (ocrWorkerRef.current) {
      await Promise.resolve(ocrWorkerRef.current.terminate()).catch(() => undefined);
      ocrWorkerRef.current = null;
    }
    if (typeof WebAssembly === "undefined") throw new Error("WebAssembly is required for local OCR.");
    const tesseract = await loadTesseract();
    const worker = await withTimeout(tesseract.createWorker(language, 1, {
      workerPath: `${OCR_RUNTIME_BASE}/worker.min.js`,
      corePath: `${OCR_RUNTIME_BASE}/core`,
      langPath: `${OCR_RUNTIME_BASE}/lang`,
      gzip: true,
      logger: (message: { status?: string; progress?: number }) => {
        if (message.status) {
          const pct = Number.isFinite(message.progress) ? Math.round((message.progress || 0) * 100) : undefined;
          setStatus(`${message.status}${pct !== undefined ? ` ${pct}%` : ""}`);
        }
      },
    }), 90_000, "Local OCR engine took too long to initialize.");
    await worker.setParameters?.({ preserve_interword_spaces: "1" });
    ocrWorkerRef.current = worker;
    ocrWorkerLanguageRef.current = language;
    return worker;
  }, []);

  const recognizePage = useCallback(async (page: ScanPage, language: OcrLanguage) => {
    if (!page.processedBlob || !page.processedWidth || !page.processedHeight) throw new Error("Process the page before OCR.");
    const { imageData, width, height } = await blobToImageData(page.processedBlob, 2600, 10_000_000);
    const buffer = imageData.data.buffer.slice(0) as ArrayBuffer;
    const scanWorker = await ensureWorker();
    const pre = await scanWorker.request("ocr-preprocess", { width, height, buffer }, [buffer], 45_000);
    if (!pre.buffer || !pre.width || !pre.height) throw new Error("OCR preprocessing failed.");
    const ocrBlob = await rgbaToBlob(pre.buffer, pre.width, pre.height, "image/png", 1);
    const worker = await ensureOcrWorker(language);
    const result = await withTimeout<OcrRecognizeResult>(
      worker.recognize(ocrBlob, {}, { tsv: true }) as Promise<OcrRecognizeResult>,
      120_000,
      "OCR timed out on this page.",
    );
    const parsed = parseTsv(String(result.data?.tsv || ""), pre.width, pre.height);
    const updated = { ...page, ocrLanguage: language, ocrText: parsed.text, ocrLines: parsed.lines };
    pagesRef.current = pagesRef.current.map((item) => item.id === page.id ? updated : item);
    setPages(pagesRef.current);
    return updated;
  }, [ensureOcrWorker, ensureWorker]);

  const runOcrAll = useCallback(async () => {
    if (!pagesRef.current.length) return;
    setError("");
    setBusy(true);
    beginToolProcessing("Recognizing scanned text locally");
    try {
      for (let i = 0; i < pagesRef.current.length; i += 1) {
        const page = pagesRef.current[i];
        setStatus(`OCR page ${i + 1} of ${pagesRef.current.length}`);
        updateToolProcessing(undefined, `OCR page ${i + 1}`);
        await recognizePage(page, ocrLanguage);
      }
      setStatus("Searchable text ready");
      completeToolProcessing();
    } catch (e) {
      failToolProcessing();
      setError(e instanceof Error ? e.message : "OCR failed.");
    } finally {
      setBusy(false);
    }
  }, [ocrLanguage, recognizePage]);

  const exportPdf = useCallback(async () => {
    if (!pagesRef.current.length) return;
    setError("");
    setBusy(true);
    beginToolProcessing("Creating scanned PDF");
    try {
      let workingPages = pagesRef.current;
      if (ocrEnabled) {
        for (let i = 0; i < workingPages.length; i += 1) {
          const page = workingPages[i];
          if (!page.ocrLines?.length || page.ocrLanguage !== ocrLanguage) {
            setStatus(`OCR page ${i + 1} of ${workingPages.length}`);
            updateToolProcessing(undefined, `OCR page ${i + 1}`);
            await recognizePage(page, ocrLanguage);
          }
        }
        workingPages = pagesRef.current;
      }

      let pdf: jsPDF | null = null;
      for (let i = 0; i < workingPages.length; i += 1) {
        const page = workingPages[i];
        if (!page.processedBlob || !page.processedWidth || !page.processedHeight) continue;
        setStatus(`Building PDF page ${i + 1} of ${workingPages.length}`);
        const [pw, ph] = pagePdfSize(pageSizeMode, page.processedWidth, page.processedHeight);
        if (!pdf) {
          pdf = new jsPDF({ unit: "pt", format: [pw, ph], orientation: pw > ph ? "landscape" : "portrait", compress: true });
        } else {
          pdf.addPage([pw, ph], pw > ph ? "landscape" : "portrait");
        }
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Could not read a processed page."));
          reader.readAsDataURL(page.processedBlob!);
        });
        const fit = fitInside(pw, ph, page.processedWidth, page.processedHeight);
        pdf.addImage(imageDataUrl, "JPEG", fit.x, fit.y, fit.width, fit.height, undefined, "FAST");

        if (ocrEnabled && page.ocrLines?.length) {
          pdf.setFont("helvetica", "normal");
          for (const line of page.ocrLines) {
            const x = fit.x + line.left * fit.width;
            const y = fit.y + line.top * fit.height;
            const maxWidth = Math.max(2, line.width * fit.width);
            const fontSize = Math.max(4, Math.min(48, line.height * fit.height * 0.88));
            pdf.setFontSize(fontSize);
            pdf.text(line.text, x, y + fontSize, {
              renderingMode: "invisible",
              maxWidth,
              baseline: "alphabetic",
            } as any);
          }
        }
      }
      if (!pdf) throw new Error("No processed pages are ready for PDF export.");
      const blob = pdf.output("blob");
      const name = safeOutputName(outputName || "scanned-document.pdf", "scanned-document", ".pdf");
      dl(blob, name);
      setStatus(`Downloaded ${name}`);
      completeToolProcessing();
    } catch (e) {
      failToolProcessing();
      setError(e instanceof Error ? e.message : "PDF export failed.");
    } finally {
      setBusy(false);
    }
  }, [ocrEnabled, ocrLanguage, outputName, pageSizeMode, recognizePage]);

  return (
    <ToolWorkspace
      title="Scan to PDF"
      description="Capture or upload document photos, correct perspective, enhance pages and optionally add searchable OCR text — all in this browser session."
      accent="#2563EB"
    >
      <div data-testid="scan-to-pdf-workspace" className="space-y-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="font-black">Private browser processing</p>
          <p className="mt-1 font-medium leading-6">
            Document detection, perspective correction, enhancement, OCR and PDF creation run in this browser session.
            This workflow does not send your document to AJN PDF&apos;s processing server. OCR works best with clear,
            well-lit printed documents and may make recognition mistakes.
          </p>
        </div>

        {error ? (
          <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error"><X className="h-4 w-4" /></button>
          </div>
        ) : null}

        {cameraOpen ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-3">
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} playsInline muted className="block max-h-[64vh] w-full object-contain" />
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
                <polygon
                  points={liveCorners.map((p) => `${p.x * 1000},${p.y * 1000}`).join(" ")}
                  fill="rgba(37,99,235,.10)" stroke={liveConfidence > 0.45 ? "#34d399" : "#60a5fa"} strokeWidth="6"
                />
              </svg>
              <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-black text-white">
                Edge confidence {Math.round(liveConfidence * 100)}%
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Btn onClick={captureCamera} loading={cameraBusy || busy}><Camera className="h-4 w-4" /> Capture page</Btn>
              <Btn onClick={stopCamera} variant="secondary">Close camera</Btn>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={startCamera}
              className="min-h-28 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-left transition hover:border-blue-300 hover:bg-blue-100"
            >
              <Camera className="h-6 w-6 text-blue-700" />
              <p className="mt-3 font-black text-slate-950">Use camera</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">Rear camera when available, with real-time document edge guidance.</p>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50"
            >
              <FilePlus2 className="h-6 w-6 text-blue-700" />
              <p className="mt-3 font-black text-slate-950">Upload document photos</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">JPG, PNG, WebP; HEIC/HEIF only when your browser decoder succeeds.</p>
            </button>
            <input
              data-testid="scan-file-input"
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                event.target.value = "";
                void addFiles(files);
              }}
            />
          </div>
        )}

        {pages.length ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div>
                <p className="text-sm font-black text-slate-950">{pages.length} page{pages.length === 1 ? "" : "s"}</p>
                <p className="text-xs font-semibold text-slate-500">{status}</p>
              </div>
              <Btn onClick={() => fileInputRef.current?.click()} variant="secondary"><FilePlus2 className="h-4 w-4" /> Add pages</Btn>
            </div>

            <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="max-h-[680px] space-y-2 overflow-y-auto pr-1">
                {pages.map((page, index) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setActiveId(page.id)}
                    className={`w-full rounded-xl border p-2 text-left ${activePage?.id === page.id ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}
                  >
                    <div className="flex gap-2">
                      <img src={page.processedUrl || page.sourceUrl} alt="" className="h-20 w-16 rounded-lg border bg-white object-contain" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900">Page {index + 1}</p>
                        <p className="mt-1 truncate text-[10px] font-semibold text-slate-500">{page.name}</p>
                        <p className="mt-1 text-[10px] font-bold text-emerald-700">
                          {page.ocrLines?.length ? `${page.ocrLines.length} OCR lines` : `${Math.round(page.confidence * 100)}% edge`}
                        </p>
                        <div className="mt-2 flex gap-1">
                          <span onClick={(e) => { e.stopPropagation(); movePage(page.id, -1); }} className="rounded border p-1"><ChevronUp className="h-3 w-3" /></span>
                          <span onClick={(e) => { e.stopPropagation(); movePage(page.id, 1); }} className="rounded border p-1"><ChevronDown className="h-3 w-3" /></span>
                          <span onClick={(e) => { e.stopPropagation(); deletePage(page.id); }} className="rounded border p-1 text-red-600"><Trash2 className="h-3 w-3" /></span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {activePage ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-100 p-3">
                    <div className="relative mx-auto max-w-3xl overflow-hidden rounded-xl bg-white shadow-sm">
                      <img src={activePage.sourceUrl} alt={`Source ${activePage.name}`} className="block max-h-[62vh] w-full object-contain" />
                      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
                        <polygon points={activePage.corners.map((p) => `${p.x * 1000},${p.y * 1000}`).join(" ")} fill="rgba(37,99,235,.08)" stroke="#2563eb" strokeWidth="5" />
                      </svg>
                      <div className="absolute inset-0">
                        {activePage.corners.map((point, index) => (
                          <button
                            key={index}
                            type="button"
                            aria-label={`Move document corner ${index + 1}`}
                            onPointerDown={(event) => dragCorner(index, event)}
                            className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-4 border-white bg-blue-600 shadow-lg"
                            style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Btn onClick={applyManualCorners} disabled={busy}><Maximize2 className="h-4 w-4" /> Apply corners</Btn>
                      <Btn onClick={resetDetection} variant="secondary" disabled={busy}><ScanLine className="h-4 w-4" /> Auto detect again</Btn>
                      <Btn
                        onClick={() => updateActive({ rotation: (((activePage.rotation + 90) % 360) as 0 | 90 | 180 | 270) })}
                        variant="secondary"
                        disabled={busy}
                      ><RotateCw className="h-4 w-4" /> Rotate</Btn>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="rounded-xl border border-slate-200 bg-white p-3">
                      <span className="text-xs font-black text-slate-700">Scan appearance</span>
                      <select
                        value={activePage.mode}
                        onChange={(e) => void updateActive({ mode: e.target.value as ScanMode })}
                        className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold"
                      >
                        <option value="original">Original</option>
                        <option value="color">Color enhanced</option>
                        <option value="grayscale">Grayscale</option>
                        <option value="document">Document B&amp;W</option>
                      </select>
                    </label>
                    <label className="rounded-xl border border-slate-200 bg-white p-3">
                      <span className="text-xs font-black text-slate-700">Brightness {activePage.brightness > 0 ? "+" : ""}{activePage.brightness}</span>
                      <input className="mt-3 w-full" type="range" min="-40" max="40" step="2" value={activePage.brightness}
                        onChange={(e) => setPages((current) => current.map((p) => p.id === activePage.id ? { ...p, brightness: Number(e.target.value) } : p))}
                        onPointerUp={() => void updateActive({ brightness: pagesRef.current.find((p) => p.id === activePage.id)?.brightness || 0 })}
                      />
                    </label>
                    <label className="rounded-xl border border-slate-200 bg-white p-3">
                      <span className="text-xs font-black text-slate-700">Contrast {activePage.contrast.toFixed(2)}</span>
                      <input className="mt-3 w-full" type="range" min="0.7" max="1.5" step="0.05" value={activePage.contrast}
                        onChange={(e) => setPages((current) => current.map((p) => p.id === activePage.id ? { ...p, contrast: Number(e.target.value) } : p))}
                        onPointerUp={() => void updateActive({ contrast: pagesRef.current.find((p) => p.id === activePage.id)?.contrast || 1 })}
                      />
                    </label>
                    <label className="rounded-xl border border-slate-200 bg-white p-3">
                      <span className="text-xs font-black text-slate-700">Sharpness {activePage.sharpness.toFixed(1)}</span>
                      <input className="mt-3 w-full" type="range" min="0" max="1" step="0.1" value={activePage.sharpness}
                        onChange={(e) => setPages((current) => current.map((p) => p.id === activePage.id ? { ...p, sharpness: Number(e.target.value) } : p))}
                        onPointerUp={() => void updateActive({ sharpness: pagesRef.current.find((p) => p.id === activePage.id)?.sharpness || 0 })}
                      />
                    </label>
                  </div>

                  {activePage.processedUrl ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Corrected preview</p>
                      <img src={activePage.processedUrl} alt="Corrected scan preview" className="mt-3 max-h-[48vh] w-full rounded-xl bg-slate-50 object-contain" />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label>
                  <span className="text-xs font-black text-slate-700">OCR language</span>
                  <select value={ocrLanguage} onChange={(e) => setOcrLanguage(e.target.value as OcrLanguage)}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold">
                    {OCR_LANGUAGES.map((lang) => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-xs font-black text-slate-700">PDF page size</span>
                  <select value={pageSizeMode} onChange={(e) => setPageSizeMode(e.target.value as PageSizeMode)}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold">
                    <option value="auto">Auto / fit scan</option>
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                  </select>
                </label>
                <label>
                  <span className="text-xs font-black text-slate-700">Output filename</span>
                  <input value={outputName} onChange={(e) => setOutputName(e.target.value)}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold" />
                </label>
              </div>
              <label className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <input type="checkbox" checked={ocrEnabled} onChange={(e) => setOcrEnabled(e.target.checked)} className="mt-1 h-4 w-4" />
                <span>
                  <span className="block text-sm font-black text-blue-950">Create searchable PDF</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-blue-800">
                    Local OCR adds an invisible positioned text layer for search and copy/paste. This does not by itself make a fully tagged accessible PDF.
                  </span>
                </span>
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <Btn onClick={runOcrAll} disabled={busy || !pages.length} variant="secondary">
                  <Search className="h-4 w-4" /> Run local OCR now
                </Btn>
                <Btn onClick={exportPdf} disabled={busy || !pages.length} loading={busy} full={false}>
                  <Download className="h-4 w-4" /> {ocrEnabled ? "Create searchable PDF" : "Create PDF"}
                </Btn>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-950">
              <p className="font-black">Recognition limits</p>
              <p className="mt-1">
                OCR is strongest on clean, well-lit printed text. Handwriting, low resolution, motion blur, shadows, unusual fonts and complex multi-column layouts can reduce accuracy.
                Keep the original photos until you confirm the downloaded PDF.
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <FileImage className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 text-sm font-black text-slate-800">No scanned pages yet</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Capture a page or upload document photos to start.</p>
          </div>
        )}

        {busy ? (
          <div role="status" className="flex items-center gap-2 text-xs font-bold text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" /> {status}
          </div>
        ) : pages.length ? (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> {status}
          </div>
        ) : null}
      </div>
    </ToolWorkspace>
  );
}
