"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PDFDocument } from "pdf-lib";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  FileDown,
  ImagePlus,
  RotateCw,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { RuntimeImage } from "@/components/ui/runtime-image";
import {
  Btn,
  ToolWorkspace,
  beginToolProcessing,
  completeToolProcessing,
  dl,
  failToolProcessing,
  fmtBytes,
  safeOutputName,
  shareResult,
  updateToolProcessing,
} from "./_shared";

type PageMode = "fit" | "a4" | "letter";
type Orientation = "auto" | "portrait" | "landscape";

type ImageItem = {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
};

type ToolConfig = {
  title: string;
  description: string;
  accept: string;
  extensions: string[];
  mime: string[];
  defaultName: string;
};

const MAX_FILES = 30;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_TOTAL_BYTES = 40 * 1024 * 1024;
const MAX_SOURCE_PIXELS = 40_000_000;
const MAX_SOURCE_SIDE = 16_000;
const MAX_RASTER_PIXELS = 14_000_000;
const MAX_RASTER_SIDE = 4096;
const MM_TO_PT = 72 / 25.4;

const TOOL_CONFIG: Record<string, ToolConfig> = {
  "image-to-pdf": {
    title: "Image to PDF",
    description: "Combine JPG, JPEG, PNG and WebP images into one PDF directly in your browser.",
    accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    mime: ["image/jpeg", "image/png", "image/webp"],
    defaultName: "images-to-pdf",
  },
  "jpg-to-pdf": {
    title: "JPG to PDF",
    description: "Turn one or more JPG photos into a PDF without uploading them to a server.",
    accept: ".jpg,.jpeg,image/jpeg",
    extensions: [".jpg", ".jpeg"],
    mime: ["image/jpeg"],
    defaultName: "jpg-to-pdf",
  },
  "jpeg-to-pdf": {
    title: "JPEG to PDF",
    description: "Turn one or more JPEG images into a PDF directly on this device.",
    accept: ".jpg,.jpeg,image/jpeg",
    extensions: [".jpg", ".jpeg"],
    mime: ["image/jpeg"],
    defaultName: "jpeg-to-pdf",
  },
  "png-to-pdf": {
    title: "PNG to PDF",
    description: "Convert PNG graphics and transparent images to PDF directly in your browser.",
    accept: ".png,image/png",
    extensions: [".png"],
    mime: ["image/png"],
    defaultName: "png-to-pdf",
  },
  "webp-to-pdf": {
    title: "WebP to PDF",
    description: "Convert WebP images to a shareable PDF using on-device browser processing.",
    accept: ".webp,image/webp",
    extensions: [".webp"],
    mime: ["image/webp"],
    defaultName: "webp-to-pdf",
  },
};

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function extensionOf(name: string) {
  const match = /\.[^.]+$/.exec(name.toLowerCase());
  return match?.[0] || "";
}

function acceptsFile(file: File, config: ToolConfig) {
  const ext = extensionOf(file.name);
  return config.mime.includes(file.type.toLowerCase()) || config.extensions.includes(ext);
}

async function inspectImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      const timer = window.setTimeout(() => {
        image.src = "";
        reject(new Error(`${file.name} took too long to decode.`));
      }, 20_000);
      image.onload = () => {
        window.clearTimeout(timer);
        if (!image.naturalWidth || !image.naturalHeight) {
          reject(new Error(`${file.name} has invalid image dimensions.`));
          return;
        }
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      };
      image.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error(`${file.name} could not be decoded by this browser.`));
      };
      image.src = url;
    });
    return { ...dimensions, url };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

async function loadPreviewImage(url: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const timer = window.setTimeout(() => {
      image.src = "";
      reject(new Error("An image took too long to prepare."));
    }, 20_000);
    image.onload = () => {
      window.clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("An image could not be prepared for PDF output."));
    };
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg", quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The browser could not encode an image page."))),
      type,
      quality,
    );
  });
}

function normalizedRotation(value: number): 0 | 90 | 180 | 270 {
  const normalized = ((value % 360) + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) return normalized;
  return 0;
}

function pageDimensions(
  mode: PageMode,
  orientation: Orientation,
  width: number,
  height: number,
) {
  const aspect = width / Math.max(1, height);
  const wantsLandscape = orientation === "landscape" || (orientation === "auto" && aspect > 1);

  if (mode === "fit") {
    const maxSide = 842;
    let pageWidth = aspect >= 1 ? maxSide : maxSide * aspect;
    let pageHeight = aspect >= 1 ? maxSide / aspect : maxSide;
    const minSide = 144;
    if (Math.min(pageWidth, pageHeight) < minSide) {
      const factor = minSide / Math.min(pageWidth, pageHeight);
      pageWidth *= factor;
      pageHeight *= factor;
    }
    return [pageWidth, pageHeight] as const;
  }

  const base = mode === "letter" ? [612, 792] : [595.28, 841.89];
  return wantsLandscape
    ? [Math.max(...base), Math.min(...base)] as const
    : [Math.min(...base), Math.max(...base)] as const;
}

async function rasterize(item: ImageItem, quality: number) {
  const image = await loadPreviewImage(item.url);
  const sourcePixels = item.width * item.height;
  const safeScale = Math.min(
    1,
    MAX_RASTER_SIDE / Math.max(item.width, item.height),
    Math.sqrt(MAX_RASTER_PIXELS / Math.max(1, sourcePixels)),
  );
  const drawWidth = Math.max(1, Math.round(item.width * safeScale));
  const drawHeight = Math.max(1, Math.round(item.height * safeScale));
  const quarterTurn = item.rotation === 90 || item.rotation === 270;
  const canvas = document.createElement("canvas");
  canvas.width = quarterTurn ? drawHeight : drawWidth;
  canvas.height = quarterTurn ? drawWidth : drawHeight;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas processing is unavailable in this browser.");

  const pngOutput = item.file.type.toLowerCase() === "image/png" || extensionOf(item.file.name) === ".png";
  if (!pngOutput) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((item.rotation * Math.PI) / 180);
  ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();

  const type: "image/png" | "image/jpeg" = pngOutput ? "image/png" : "image/jpeg";
  const blob = await canvasBlob(canvas, type, Math.max(0.55, Math.min(1, quality / 100)));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return { bytes, type, width: canvas.width, height: canvas.height };
}

export default function ImagesToPdf() {
  const pathname = usePathname();
  const toolId = pathname.split("/").filter(Boolean).at(-1) || "image-to-pdf";
  const config = TOOL_CONFIG[toolId] || TOOL_CONFIG["image-to-pdf"];

  const [items, setItems] = useState<ImageItem[]>([]);
  const itemsRef = useRef<ImageItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  const [dragging, setDragging] = useState(false);
  const [pageMode, setPageMode] = useState<PageMode>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [marginMm, setMarginMm] = useState(10);
  const [quality, setQuality] = useState(92);
  const [outputName, setOutputName] = useState(config.defaultName);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("Choose images to begin.");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    setOutputName(config.defaultName);
    setError("");
    setResult(null);
  }, [config.defaultName]);

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) URL.revokeObjectURL(item.url);
    };
  }, []);

  const totalBytes = useMemo(() => items.reduce((sum, item) => sum + item.file.size, 0), [items]);

  const addFiles = async (incoming: File[]) => {
    if (processing || !incoming.length) return;
    setError("");
    setResult(null);

    if (items.length + incoming.length > MAX_FILES) {
      setError(`Choose no more than ${MAX_FILES} images per PDF.`);
      return;
    }
    if (totalBytes + incoming.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) {
      setError("Selected images exceed the 40 MB browser-job limit.");
      return;
    }

    const accepted: ImageItem[] = [];
    const failures: string[] = [];
    for (const file of incoming) {
      try {
        if (!file.size) throw new Error(`${file.name} is empty.`);
        if (!acceptsFile(file, config)) {
          throw new Error(`${file.name} is not supported by ${config.title}.`);
        }
        if (file.size > MAX_FILE_BYTES) {
          throw new Error(`${file.name} exceeds the 15 MB per-image limit.`);
        }

        const inspected = await inspectImage(file);
        const pixels = inspected.width * inspected.height;
        if (
          inspected.width > MAX_SOURCE_SIDE ||
          inspected.height > MAX_SOURCE_SIDE ||
          pixels > MAX_SOURCE_PIXELS
        ) {
          URL.revokeObjectURL(inspected.url);
          throw new Error(`${file.name} is too large to decode safely on this device.`);
        }

        accepted.push({
          id: uid(),
          file,
          url: inspected.url,
          width: inspected.width,
          height: inspected.height,
          rotation: 0,
        });
      } catch (caught) {
        failures.push(caught instanceof Error ? caught.message : `${file.name} could not be added.`);
      }
    }

    if (accepted.length) {
      setItems((current) => [...current, ...accepted]);
      setStage(`${items.length + accepted.length} image${items.length + accepted.length === 1 ? "" : "s"} ready.`);
    }
    if (failures.length) setError(failures.slice(0, 3).join(" "));
  };

  const removeItem = (id: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((item) => item.id !== id);
    });
    setResult(null);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setItems((current) => {
      const next = [...current];
      const destination = index + direction;
      if (destination < 0 || destination >= next.length) return current;
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
    setResult(null);
  };

  const rotateItem = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, rotation: normalizedRotation(item.rotation + 90) }
          : item,
      ),
    );
    setResult(null);
  };

  const clearAll = () => {
    for (const item of itemsRef.current) URL.revokeObjectURL(item.url);
    setItems([]);
    setResult(null);
    setError("");
    setProgress(0);
    setStage("Choose images to begin.");
    setShareStatus("");
  };

  const createPdf = async () => {
    if (!items.length || processing) return;
    setError("");
    setResult(null);
    setProcessing(true);
    setProgress(0);
    setShareStatus("");
    cancelRef.current = false;
    beginToolProcessing(config.title);

    try {
      const pdf = await PDFDocument.create();
      pdf.setCreator("AJN PDF");
      pdf.setProducer("AJN PDF");
      pdf.setTitle(config.title);

      for (let index = 0; index < items.length; index += 1) {
        if (cancelRef.current) throw new DOMException("Cancelled", "AbortError");

        const item = items[index];
        const pageNumber = index + 1;
        setStage(`Preparing image ${pageNumber} of ${items.length}: ${item.file.name}`);
        updateToolProcessing(
          Math.round((index / items.length) * 100),
          `Preparing image ${pageNumber} of ${items.length}`,
        );

        const raster = await rasterize(item, quality);
        const embedded =
          raster.type === "image/png"
            ? await pdf.embedPng(raster.bytes)
            : await pdf.embedJpg(raster.bytes);

        const [pageWidth, pageHeight] = pageDimensions(
          pageMode,
          orientation,
          raster.width,
          raster.height,
        );
        const margin = Math.min(marginMm * MM_TO_PT, Math.min(pageWidth, pageHeight) / 3);
        const availableWidth = Math.max(24, pageWidth - margin * 2);
        const availableHeight = Math.max(24, pageHeight - margin * 2);
        const scale = Math.min(
          availableWidth / embedded.width,
          availableHeight / embedded.height,
        );
        const drawWidth = embedded.width * scale;
        const drawHeight = embedded.height * scale;
        const page = pdf.addPage([pageWidth, pageHeight]);

        page.drawImage(embedded, {
          x: (pageWidth - drawWidth) / 2,
          y: (pageHeight - drawHeight) / 2,
          width: drawWidth,
          height: drawHeight,
        });

        const pct = Math.round((pageNumber / items.length) * 96);
        setProgress(pct);
        updateToolProcessing(pct, `Added page ${pageNumber} of ${items.length}`);
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      }

      if (cancelRef.current) throw new DOMException("Cancelled", "AbortError");

      setStage("Writing PDF...");
      updateToolProcessing(98, "Writing PDF");
      const bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 40 });
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const blob = new Blob([copy.buffer as ArrayBuffer], { type: "application/pdf" });
      if (blob.size < 5) throw new Error("The generated PDF is empty.");

      setResult(blob);
      setProgress(100);
      setStage(`PDF ready · ${items.length} page${items.length === 1 ? "" : "s"} · ${fmtBytes(blob.size)}`);
      updateToolProcessing(100, "PDF ready");
      completeToolProcessing();
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        setStage("Conversion cancelled.");
        setError("");
      } else {
        setStage("The PDF could not be created.");
        setError(
          caught instanceof Error
            ? caught.message
            : "The browser could not finish this image-to-PDF job.",
        );
      }
      failToolProcessing();
    } finally {
      setProcessing(false);
      cancelRef.current = false;
    }
  };

  const previewResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) setError("Your browser blocked the PDF preview. Allow pop-ups or download the PDF.");
    window.setTimeout(() => URL.revokeObjectURL(url), 300_000);
  };

  const share = async () => {
    if (!result) return;
    const name = safeOutputName(outputName, config.defaultName, ".pdf");
    const status = await shareResult(result, name);
    setShareStatus(
      status === "shared"
        ? "Shared."
        : status === "copied-link"
          ? "Tool link copied."
          : status === "cancelled"
            ? ""
            : "Sharing is not available in this browser.",
    );
  };

  return (
    <ToolWorkspace title={config.title} description={config.description} accent="#2563EB">
      <div className="space-y-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-950">
          <div className="text-xs font-black uppercase tracking-[.12em]">On-device processing</div>
          <p className="mt-1 text-xs font-semibold leading-5 text-emerald-900/75">
            Images stay in this browser session. No Cloud Run or upload server is required for this conversion.
          </p>
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-label={`Choose images for ${config.title}`}
          className={`jn-drop ${dragging ? "active" : ""}`}
          onClick={() => !processing && inputRef.current?.click()}
          onKeyDown={(event) => {
            if (!processing && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!processing) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!processing) void addFiles(Array.from(event.dataTransfer.files));
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={config.accept}
            multiple
            hidden
            onChange={(event) => {
              void addFiles(Array.from(event.target.files || []));
              event.currentTarget.value = "";
            }}
          />
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
            <ImagePlus className="h-6 w-6" />
          </div>
          <p className="m-0 text-sm font-black text-slate-950">
            {dragging ? "Drop images now" : "Choose or drop images"}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Up to {MAX_FILES} images · 15 MB each · 40 MB total
          </p>
        </div>

        {items.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">
                  {items.length} image{items.length === 1 ? "" : "s"}
                </p>
                <p className="text-xs font-semibold text-slate-500">{fmtBytes(totalBytes)} selected</p>
              </div>
              <button
                type="button"
                disabled={processing}
                onClick={clearAll}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((item, index) => {
                const rotated = item.rotation === 90 || item.rotation === 270;
                const width = rotated ? item.height : item.width;
                const height = rotated ? item.width : item.height;
                return (
                  <div key={item.id} className="flex min-h-[88px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <RuntimeImage
                        src={item.url}
                        alt=""
                        className="h-full w-full object-contain"
                        style={{ transform: `rotate(${item.rotation}deg)` }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-slate-900" title={item.file.name}>
                        {index + 1}. {item.file.name}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-500">
                        {width}×{height} · {fmtBytes(item.file.size)}
                      </p>
                      <div className="mt-2 flex gap-1">
                        <button type="button" aria-label={`Move ${item.file.name} up`} disabled={processing || index === 0} onClick={() => moveItem(index, -1)} className="grid h-8 w-8 place-items-center rounded-lg bg-white text-slate-600 shadow-sm disabled:opacity-25"><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button type="button" aria-label={`Move ${item.file.name} down`} disabled={processing || index === items.length - 1} onClick={() => moveItem(index, 1)} className="grid h-8 w-8 place-items-center rounded-lg bg-white text-slate-600 shadow-sm disabled:opacity-25"><ArrowDown className="h-3.5 w-3.5" /></button>
                        <button type="button" aria-label={`Rotate ${item.file.name}`} disabled={processing} onClick={() => rotateItem(item.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-white text-blue-600 shadow-sm disabled:opacity-25"><RotateCw className="h-3.5 w-3.5" /></button>
                        <button type="button" aria-label={`Remove ${item.file.name}`} disabled={processing} onClick={() => removeItem(item.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-600 disabled:opacity-25"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-black text-slate-700">
            Page size
            <select value={pageMode} disabled={processing} onChange={(event) => setPageMode(event.target.value as PageMode)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold">
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
              <option value="fit">Fit to image</option>
            </select>
          </label>

          <label className="space-y-1.5 text-xs font-black text-slate-700">
            Orientation
            <select value={orientation} disabled={processing || pageMode === "fit"} onChange={(event) => setOrientation(event.target.value as Orientation)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold">
              <option value="auto">Auto</option>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </label>

          <label className="space-y-2 text-xs font-black text-slate-700">
            <span className="flex justify-between gap-3"><span>Margin</span><span>{marginMm} mm</span></span>
            <input type="range" min={0} max={30} step={1} value={marginMm} disabled={processing} onChange={(event) => setMarginMm(Number(event.target.value))} className="jn-range" />
          </label>

          <label className="space-y-2 text-xs font-black text-slate-700">
            <span className="flex justify-between gap-3"><span>Image quality</span><span>{quality}%</span></span>
            <input type="range" min={55} max={100} step={5} value={quality} disabled={processing} onChange={(event) => setQuality(Number(event.target.value))} className="jn-range" />
          </label>

          <label className="space-y-1.5 text-xs font-black text-slate-700 sm:col-span-2">
            Output filename
            <input
              value={outputName}
              disabled={processing}
              onChange={(event) => setOutputName(event.target.value)}
              maxLength={120}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold"
              placeholder={`${config.defaultName}.pdf`}
            />
          </label>

          <p className="text-[11px] font-semibold leading-5 text-slate-500 sm:col-span-2">
            Large images are downsampled only when needed to protect browser memory. PNG transparency is preserved; the quality control applies to JPG/JPEG/WebP raster pages.
          </p>
        </div>

        {processing && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4" role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-3 text-xs font-black text-slate-700">
              <span className="truncate">{stage}</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-blue-600 transition-[width] duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold leading-5 text-red-900">
            {error}
          </div>
        )}

        {!processing && stage && !error && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-600" role="status" aria-live="polite">
            {stage}
          </div>
        )}

        {result ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center">
            <FileDown className="mx-auto h-8 w-8 text-emerald-700" />
            <h3 className="mt-2 text-lg font-black text-slate-950">PDF ready</h3>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              {items.length} page{items.length === 1 ? "" : "s"} · {fmtBytes(result.size)}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Btn onClick={() => dl(result, safeOutputName(outputName, config.defaultName, ".pdf"))}>
                <Download className="h-4 w-4" /> Download PDF
              </Btn>
              <Btn variant="secondary" onClick={previewResult}>
                <Eye className="h-4 w-4" /> Preview
              </Btn>
              <Btn variant="secondary" onClick={() => void share()}>
                <Share2 className="h-4 w-4" /> Share
              </Btn>
              <Btn variant="ghost" onClick={() => { setResult(null); setStage(`${items.length} image${items.length === 1 ? "" : "s"} ready.`); }}>
                Edit again
              </Btn>
            </div>
            {shareStatus && <p className="mt-3 text-[11px] font-bold text-slate-500">{shareStatus}</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Btn full onClick={() => void createPdf()} disabled={!items.length} loading={processing}>
              <FileDown className="h-4 w-4" />
              Create PDF on this device
            </Btn>
            {processing && (
              <Btn
                variant="secondary"
                onClick={() => {
                  cancelRef.current = true;
                  setStage("Cancelling...");
                }}
              >
                <X className="h-4 w-4" /> Cancel
              </Btn>
            )}
          </div>
        )}
      </div>
    </ToolWorkspace>
  );
}
