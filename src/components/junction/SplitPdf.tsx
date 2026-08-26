"use client";

import React, { useState } from "react";
import { ToolWorkspace, Drop, Btn, Done, Err, F, IS, Pills, ToolFile, dl, Info, withProcessingActivity } from "./_shared";
import { filesToZip, getPdfPageCount, parseRangeGroups, splitPdfAdvanced } from "./_pdfUtils";
import { validateFiles } from "@/lib/file-validation";

type Mode = "all" | "ranges" | "fixed";

export default function SplitPdf() {
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [mode, setMode] = useState<Mode>("all");
  const [ranges, setRanges] = useState("1-3,4-6");
  const [fixedSize, setFixedSize] = useState(1);
  const [prefix, setPrefix] = useState("split");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string; count: number } | null>(null);
  const [error, setError] = useState("");

  const process = async () => {
    const validation = validateFiles(files.map(item => item.file), { extensions: [".pdf"], minFiles: 1, maxFiles: 1, maxSizeMb: 50 });
    if (validation) { setError(validation); return; }
    setError(""); setLoading(true);
    try {
      const nextResult = await withProcessingActivity("Split PDF", async () => {
        const file = files[0].file;
        const total = await getPdfPageCount(file);
        let groups: number[][];
        if (mode === "all") groups = Array.from({ length: total }, (_, index) => [index]);
        else if (mode === "fixed") {
          const size = Math.max(1, Math.min(total, fixedSize));
          groups = [];
          for (let start = 0; start < total; start += size) groups.push(Array.from({ length: Math.min(size, total - start) }, (_, offset) => start + offset));
        } else groups = parseRangeGroups(ranges, total);
        const parts = await splitPdfAdvanced(file, groups, prefix.trim() || "split");
        const blob = parts.length === 1 ? parts[0].blob : await filesToZip(parts);
        return { blob, name: parts.length === 1 ? parts[0].name : `${prefix.trim() || "split"}_files.zip`, count: parts.length };
      });
      setResult(nextResult);
    } catch (e: any) { setError(e.message || "The PDF could not be split."); }
    finally { setLoading(false); }
  };

  return (
    <ToolWorkspace title="Split PDF" description="Extract pages, custom ranges, or fixed-size groups" accent="#8B5CF6">
      {result ? (
        <Done msg={`${result.count} file${result.count === 1 ? "" : "s"} created`} dlLabel={result.count === 1 ? "Download PDF" : "Download ZIP"} onDownload={() => dl(result.blob, result.name)} shareFile={{ blob: result.blob, name: result.name }} onReset={() => { setResult(null); setFiles([]); setError(""); }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Drop files={files} onChange={setFiles} accept=".pdf,application/pdf" label="Select one PDF" sub="Maximum 50 MB" />
          <F label="Split mode"><Pills opts={[{ label: "Every page", value: "all" }, { label: "Custom ranges", value: "ranges" }, { label: "Every N pages", value: "fixed" }]} val={mode} onChange={value => setMode(value as Mode)} /></F>
          {mode === "ranges" && <F label="Page groups" hint="Each comma-separated group becomes a separate PDF. Example: 1-3,4-6,8"><input style={IS} value={ranges} onChange={event => setRanges(event.target.value)} /></F>}
          {mode === "fixed" && <F label="Pages per output"><input style={IS} type="number" min={1} max={500} value={fixedSize} onChange={event => setFixedSize(Math.max(1, Number(event.target.value) || 1))} /></F>}
          <F label="Output prefix"><input style={IS} value={prefix} onChange={event => setPrefix(event.target.value)} placeholder="split" /></F>
          <Info>Custom ranges are validated against the real PDF page count before processing.</Info>
          <Err msg={error} />
          <Btn onClick={process} loading={loading} disabled={!files.length} full style={{ background: "#8B5CF6" }}>Split PDF</Btn>
        </div>
      )}
    </ToolWorkspace>
  );
}
