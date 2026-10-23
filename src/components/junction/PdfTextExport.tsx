"use client";

import React, { useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { Download, FileText, RefreshCcw, ShieldCheck } from "lucide-react";
import { Button } from "../ui/button";
import { ToolWorkspace, beginToolProcessing, completeToolProcessing, dl, failToolProcessing, getFilesFromEvent } from "./_shared";
import { initPdfWorker } from "@/lib/pdfjs-worker";
import { validatePdfFile } from "@/lib/file-validation";

type ExportFormat = "txt" | "md" | "json" | "html";
type PageRecord = { page: number; width: number; height: number; text: string; items: Array<{ text: string; x: number; y: number; width: number; height: number }> };

const FORMAT_LABELS: Record<ExportFormat, string> = { txt: "Plain text", md: "Markdown", json: "Structured JSON", html: "HTML document" };

function safeName(name: string) { return (name || "document").replace(/\.pdf$/i, "").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "document"; }
function escapeHtml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"); }

export default function PdfTextExport({ toolId }: { toolId?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ExportFormat>(toolId === "pdf-to-markdown" ? "md" : toolId === "pdf-to-json" ? "json" : toolId === "pdf-to-html" ? "html" : "txt");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");

  const chooseFile = async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>) => {
    const selected = getFilesFromEvent(event)?.[0];
    if (!selected) return;
    const error = await validatePdfFile(selected);
    if (error) { setStatus(error); setFile(null); return; }
    setFile(selected); setPreview(""); setStatus(`${selected.name} ready. Text-based PDFs work best; scanned pages may contain no extractable text.`);
  };

  const convert = async () => {
    if (!file || busy) return;
    setBusy(true); setStatus("Reading PDF pages in this browserâ€¦"); beginToolProcessing(`PdfTextExport:${format}`);
    try {
      await initPdfWorker();
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes), useWorkerFetch: false, isEvalSupported: false }).promise;
      const pages: PageRecord[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();
        const items = (content.items as any[]).filter(item => typeof item.str === "string").map(item => {
          const transform = item.transform || [1, 0, 0, 1, 0, 0];
          return { text: item.str, x: Number(transform[4] || 0), y: Number(transform[5] || 0), width: Number(item.width || 0), height: Number(item.height || 0) };
        });
        pages.push({ page: pageNumber, width: viewport.width, height: viewport.height, text: items.map(item => item.text).join(" ").trim(), items });
      }
      if (!pages.some(page => page.text.trim())) throw new Error("No selectable text was found. This may be a scanned PDF; OCR is not included in this tool.");
      const text = pages.map(page => `--- Page ${page.page} ---\n${page.text}`).join("\n\n");
      let output = text; let mime = "text/plain;charset=utf-8"; const ext = format;
      if (format === "md") { output = pages.map(page => `## Page ${page.page}\n\n${page.text}`).join("\n\n---\n\n"); mime = "text/markdown;charset=utf-8"; }
      if (format === "json") { output = JSON.stringify({ source: file.name, pageCount: pages.length, extraction: "selectable-text-only", pages }, null, 2); mime = "application/json;charset=utf-8"; }
      if (format === "html") { output = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(file.name.replace(/\.pdf$/i, ""))}</title><style>body{font:16px/1.65 system-ui,sans-serif;max-width:850px;margin:40px auto;padding:0 20px;color:#172033}section{border-bottom:1px solid #ddd;padding:16px 0;white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body><h1>${escapeHtml(file.name.replace(/\.pdf$/i, ""))}</h1>${pages.map(page => `<section><h2>Page ${page.page}</h2><p>${escapeHtml(page.text)}</p></section>`).join("")}</body></html>`; mime = "text/html;charset=utf-8"; }
      setPreview(output.slice(0, 5000));
      dl(new Blob([output], { type: mime }), `${safeName(file.name)}.${ext}`);
      setStatus(`Created ${FORMAT_LABELS[format]} from ${pages.length} page(s). Download started. Complex layouts and tables are exported as extracted text, not reconstructed exactly.`); completeToolProcessing();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not read this PDF.";
      setStatus(message); failToolProcessing();
    } finally { setBusy(false); }
  };

  const title = format === "md" ? "PDF to Markdown" : format === "json" ? "PDF to JSON" : format === "html" ? "PDF to HTML" : "PDF to Text";
  return <ToolWorkspace title={title} description="Extract selectable PDF text locally in your browser. No PDF-processing server or paid API is used." accent="#2563EB">
    <div className="mx-auto w-full max-w-4xl space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-700"><FileText className="h-5 w-5" /></span><div><h2 className="font-bold text-slate-900">Export selectable text</h2><p className="mt-1 text-sm text-slate-600">PDF text is extracted in page order. This is not OCR and does not promise exact layout reconstruction.</p></div></div>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={chooseFile} className="block w-full rounded-xl border border-slate-200 p-3 text-sm" aria-label="Choose PDF file" />
      {file && <p className="text-sm text-slate-600">Selected: {file.name} Â· {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
      <label className="block text-sm font-semibold text-slate-700">Output format<select value={format} onChange={event => setFormat(event.target.value as ExportFormat)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3">{Object.entries(FORMAT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <div className="flex flex-wrap gap-3"><Button onClick={convert} disabled={!file || busy}>{busy ? "Convertingâ€¦" : <><Download className="mr-2 h-4 w-4"/>Extract and download</>}</Button><Button variant="outline" onClick={() => { setFile(null); setPreview(""); setStatus(""); if (inputRef.current) inputRef.current.value = ""; }}><RefreshCcw className="mr-2 h-4 w-4"/>Reset</Button></div>
      {status && <p role="status" aria-live="polite" className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{status}</p>}
      <p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 shrink-0"/>The file is processed locally in this browser by this tool. Text extraction may not preserve columns, reading order, tables, or scanned text.</p>
      {preview && <div><h3 className="mb-2 font-semibold text-slate-800">Output preview (first 5,000 characters)</h3><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-xs">{preview}</pre></div>}
    </div>
  </ToolWorkspace>;
}

