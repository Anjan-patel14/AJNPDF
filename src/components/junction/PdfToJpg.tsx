"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ToolWorkspace, Drop, Btn, Done, Range, F, Pills, Info, Err, ToolFile, dl, IS, G2, withProcessingActivity } from "./_shared";
import { filesToZip, getPdfPageCount, parsePageSet, pdfToImagesAdvanced } from "./_pdfUtils";
import { validateFiles } from "@/lib/file-validation";

export default function PdfToJpg() {
  const pathname = usePathname();
  const pngRoute = pathname.includes("pdf-to-png");
  const title = pngRoute ? "PDF to PNG" : "PDF to JPG";
  const description = pngRoute ? "Export selected PDF pages as high-quality PNG images in your browser." : "Export selected PDF pages as JPG images in your browser.";
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState(85);
  const [format, setFormat] = useState<"jpeg" | "png">(pngRoute ? "png" : "jpeg");
  const [pageRange, setPageRange] = useState("all");
  const [prefix, setPrefix] = useState(pngRoute ? "png-page" : "jpg-page");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string; pages: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setFormat(pngRoute ? "png" : "jpeg");
    setPrefix(pngRoute ? "png-page" : "jpg-page");
    setResult(null);
    setError("");
  }, [pngRoute]);

  const run = async () => {
    const validation = validateFiles(files.map(item => item.file), { extensions: [".pdf"], minFiles: 1, maxFiles: 1, maxSizeMb: 50 });
    if (validation) { setError(validation); return; }
    setError(""); setLoading(true);
    try {
      const nextResult = await withProcessingActivity(title, async () => {
        const total = await getPdfPageCount(files[0].file);
        const set = parsePageSet(pageRange, total);
        const pages = set.size ? [...set].sort((a, b) => a - b) : Array.from({ length: total }, (_, i) => i + 1);
        const images = await pdfToImagesAdvanced(files[0].file, { dpi, quality, format, pages, prefix: prefix.trim() || "page" });
        const blob = images.length === 1 ? images[0].blob : await filesToZip(images);
        return { blob, pages: images.length, name: images.length === 1 ? images[0].name : `${prefix.trim() || "pdf_images"}.zip` };
      });
      setResult(nextResult);
    } catch (e: any) { setError(e.message || "The PDF could not be rendered."); }
    finally { setLoading(false); }
  };

  return (
    <ToolWorkspace title={title} description={description} accent="#467AF2">
      {result ? (
        <Done msg={`${result.pages} page${result.pages === 1 ? "" : "s"} converted`} dlLabel={result.pages === 1 ? "Download Image" : "Download ZIP"} onDownload={() => dl(result.blob, result.name)} shareFile={{ blob: result.blob, name: result.name }} onReset={() => { setResult(null); setFiles([]); setError(""); }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Drop files={files} onChange={setFiles} accept=".pdf,application/pdf" label="Select one PDF" sub="Maximum 50 MB" />
          <G2><F label="Output format"><Pills opts={[{ label: "JPG", value: "jpeg" }, { label: "PNG", value: "png" }]} val={format} onChange={setFormat} /></F><F label="Resolution"><Pills opts={[{ label: "Standard", value: 72 }, { label: "High", value: 150 }, { label: "Print", value: 300 }]} val={dpi} onChange={setDpi} /></F></G2>
          {format === "jpeg" && <Range label="JPG quality" value={quality} min={40} max={100} step={5} onChange={setQuality} fmt={value => `${value}%`} />}
          <G2><F label="Pages" hint="Use all or ranges such as 1-3,5"><input style={IS} value={pageRange} onChange={event => setPageRange(event.target.value)} /></F><F label="Filename prefix"><input style={IS} value={prefix} onChange={event => setPrefix(event.target.value)} /></F></G2>
          <Info>Rendering happens in the browser. Multiple exported pages are bundled into one ZIP file.</Info>
          <Err msg={error} />
          <Btn onClick={run} loading={loading} disabled={!files.length} full>Convert PDF Pages</Btn>
        </div>
      )}
    </ToolWorkspace>
  );
}
