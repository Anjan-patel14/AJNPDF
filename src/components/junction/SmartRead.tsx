"use client";

import React, { useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";
import { ToolWorkspace, Drop, Btn, Err, Info, ToolFile, dl, T, withProcessingActivity, shareResult } from "./_shared";
import { extractText } from "./_pdfUtils";

export default function SmartRead() {
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const run = async () => {
    if (!files.length) return;
    setError(""); setLoading(true);
    try {
      const out = await withProcessingActivity("Extract PDF text", () => extractText(files[0].file));
      setText(out.trim() || "No selectable text was found in this PDF.");
    } catch (e: any) {
      setError(e.message || "Text could not be extracted from this PDF.");
    } finally { setLoading(false); }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  const resultBlob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const reset = () => { setFiles([]); setText(""); setError(""); };
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return <ToolWorkspace title="PDF to Text" description="Extract selectable text from your PDF" accent={T.purple}>
    {text ? <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-black text-slate-950">Extracted text</p><p className="mt-1 text-xs font-medium text-slate-500">{wordCount.toLocaleString()} words</p></div><div className="flex flex-wrap gap-2"><Btn variant="secondary" onClick={() => void copy()}><Copy size={15}/>{copied ? "Copied" : "Copy text"}</Btn><Btn variant="secondary" onClick={() => void shareResult(resultBlob, "extracted-text.txt")}><Share2 size={15}/>Share file</Btn></div></div>
        <textarea readOnly value={text} aria-label="Extracted PDF text" className="min-h-[320px] w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-800 outline-none focus:border-blue-300" />
      </div>
      <div className="flex flex-wrap gap-2"><Btn onClick={() => dl(resultBlob, "extracted-text.txt")}><Download size={16}/>Download TXT</Btn><Btn variant="secondary" onClick={reset}>Process another file</Btn></div>
    </div> : <div className="space-y-4">
      <Drop files={files} onChange={setFiles} accept=".pdf,application/pdf" label="Choose a PDF" sub="Select one PDF with a text layer" />
      {files.length > 0 && <Info>AJN PDF will extract the selectable text already present in the document. Image-only pages are not supported by this text extractor.</Info>}
      <Err msg={error}/>
      <Btn onClick={run} loading={loading} disabled={!files.length} full style={{background:T.purple}}>Extract text</Btn>
    </div>}
  </ToolWorkspace>;
}
