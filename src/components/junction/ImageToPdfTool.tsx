"use client";

import React, { useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { ToolWorkspace, Drop, Btn, Done, Err, F, G2, IS, Pills, Range, ToolFile, dl, fmtBytes, Info, withProcessingActivity } from "./_shared";
import { imagesToPdfWithOptions, type ImageFit, type ImagePageSize } from "./_pdfUtils";
import { safeOutputName, validateFiles } from "@/lib/file-validation";

interface Props {
  title: string;
  description: string;
  accept: string;
  extensions: string[];
  accent: string;
  badge?: string;
}

export default function ImageToPdfTool({ title, description, accept, extensions, accent }: Props) {
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [pageSize, setPageSize] = useState<ImagePageSize>("a4");
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [fit, setFit] = useState<ImageFit>("contain");
  const [margin, setMargin] = useState(24);
  const [background, setBackground] = useState("#ffffff");
  const [outputName, setOutputName] = useState("images.pdf");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState("");

  const move = (index: number, direction: -1 | 1) => {
    const next = [...files];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFiles(next);
  };

  const run = async () => {
    const validation = validateFiles(files.map(item => item.file), { extensions, minFiles: 1, maxFiles: 30, maxSizeMb: 25 });
    if (validation) { setError(validation); return; }
    setError(""); setLoading(true);
    try {
      setResult(await withProcessingActivity(title, () => imagesToPdfWithOptions(files.map(item => item.file), { pageSize, orientation, fit, margin, background })));
    } catch (e: any) { setError(e.message || "The images could not be converted."); }
    finally { setLoading(false); }
  };

  return (
    <ToolWorkspace title={title} description={description} accent={accent}>
      {result ? (
        <Done msg="PDF created successfully" onDownload={() => dl(result, safeOutputName(outputName, "images", ".pdf"))} shareFile={{ blob: result, name: safeOutputName(outputName, "images", ".pdf") }} onReset={() => { setResult(null); setFiles([]); setError(""); }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Drop files={files} onChange={setFiles} accept={accept} multiple label="Select images" sub="Up to 30 images · 25 MB each" />
          {files.length > 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {files.map((item, index) => (
                <div key={`${item.name}-${index}`} className="jn-file-pill">
                  <div style={{ minWidth: 0, flex: 1 }}><p title={item.name} style={{ margin: 0, fontSize: 11, fontWeight: 850, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{index + 1}. {item.name}</p><p style={{ margin: 0, fontSize: 9, color: "var(--jn-text-muted)" }}>{fmtBytes(item.size)}</p></div>
                  <button aria-label="Move image up" disabled={index === 0} onClick={() => move(index, -1)} className="h-8 w-8 rounded-lg bg-black/5 disabled:opacity-30 grid place-items-center"><ArrowUp size={13} /></button>
                  <button aria-label="Move image down" disabled={index === files.length - 1} onClick={() => move(index, 1)} className="h-8 w-8 rounded-lg bg-black/5 disabled:opacity-30 grid place-items-center"><ArrowDown size={13} /></button>
                  <button aria-label="Remove image" onClick={() => setFiles(files.filter((_, i) => i !== index))} className="h-8 w-8 rounded-lg bg-red-500/10 text-red-600 grid place-items-center"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
          <G2>
            <F label="Page size"><Pills opts={[{ label: "Auto", value: "auto" }, { label: "A4", value: "a4" }, { label: "Letter", value: "letter" }]} val={pageSize} onChange={setPageSize} /></F>
            <F label="Orientation"><Pills opts={[{ label: "Auto", value: "auto" }, { label: "Portrait", value: "portrait" }, { label: "Landscape", value: "landscape" }]} val={orientation} onChange={setOrientation} /></F>
          </G2>
          <F label="Image fit"><Pills opts={[{ label: "Contain", value: "contain" }, { label: "Cover", value: "cover" }, { label: "Original", value: "original" }]} val={fit} onChange={setFit} /></F>
          <Range label="Page margin" value={margin} min={0} max={72} step={6} onChange={setMargin} fmt={value => `${value} pt`} />
          <G2><F label="Background"><input style={{ ...IS, height: 44 }} type="color" value={background} onChange={event => setBackground(event.target.value)} /></F><F label="Output filename"><input style={IS} value={outputName} onChange={event => setOutputName(event.target.value)} /></F></G2>
          <Info>Each image becomes one PDF page in the exact order shown.</Info>
          <Err msg={error} />
          <Btn onClick={run} loading={loading} disabled={!files.length} full style={{ background: accent }}>Create PDF</Btn>
        </div>
      )}
    </ToolWorkspace>
  );
}
