"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { ToolWorkspace, Btn, Done, Err, F, IS, type ToolFile, dl, fmtBytes, T, beginToolProcessing, completeToolProcessing, failToolProcessing, updateToolProcessing } from "./_shared";
import { MERGE_PDF_LIMITS } from "@/lib/tool-limit-constants";
import { hasPdfHeader, mergePdfFiles, normalizeMergeOutputName, validateMergeSelection } from "@/lib/merge-pdf-browser";

export default function MergePdf() {
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);
  const [outputName, setOutputName] = useState("merged.pdf");
  const [error, setError] = useState("");
  const [stage, setStage] = useState("Add two or more PDF files to begin.");
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);
  const totalBytes = useMemo(() => files.reduce((sum, item) => sum + item.size, 0), [files]);

  const addFiles = async (list: FileList | null) => {
    if (!list || loading) return;
    const incoming = Array.from(list);
    const nextFiles = [...files.map((item) => item.file), ...incoming];
    if (nextFiles.length > MERGE_PDF_LIMITS.maxFiles) { setError(`You can merge up to ${MERGE_PDF_LIMITS.maxFiles} PDFs in one browser job.`); return; }
    for (const file of incoming) {
      if (!file.name.toLowerCase().endsWith(".pdf") || !(await hasPdfHeader(file))) { setError(`${file.name} is not a readable PDF file.`); return; }
    }
    const selectionError = nextFiles.length >= 2 ? validateMergeSelection(nextFiles) : null;
    if (selectionError && !selectionError.startsWith("Add at least")) { setError(selectionError); return; }
    setError(""); setResult(null);
    setFiles(nextFiles.map((file) => ({ file, name: file.name, size: file.size })));
    setStage("Arrange the PDFs in the order you want, then merge.");
  };

  const move = (index: number, direction: -1 | 1) => {
    setFiles((current) => { const next = [...current]; const target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; });
    setResult(null);
  };
  const remove = (index: number) => { setFiles((current) => current.filter((_, i) => i !== index)); setResult(null); setProgress(null); };
  const reset = () => { cancelled.current = false; setResult(null); setFiles([]); setError(""); setOutputName("merged.pdf"); setProgress(null); setStage("Add two or more PDF files to begin."); };
  const cancel = () => { if (!loading) return; cancelled.current = true; setStage("Cancelling…"); };

  const process = async () => {
    const selected = files.map((item) => item.file);
    const validation = validateMergeSelection(selected);
    if (validation) { setError(validation); return; }
    setError(""); setResult(null); setLoading(true); setProgress(0); cancelled.current = false; beginToolProcessing("Merge PDF");
    try {
      const bytes = await mergePdfFiles(selected, {
        isCancelled: () => cancelled.current,
        onProgress: (pct, message) => { setProgress(pct); setStage(message); updateToolProcessing(pct, message); },
      });
      const buffer = new ArrayBuffer(bytes.byteLength); new Uint8Array(buffer).set(bytes);
      setResult(new Blob([buffer], { type: "application/pdf" })); completeToolProcessing();
    } catch (caught) {
      failToolProcessing();
      if (caught instanceof DOMException && caught.name === "AbortError") { setError(""); setStage("Merge cancelled."); }
      else { const message = caught instanceof Error ? caught.message : "The PDFs could not be merged."; setError(message.toLowerCase().includes("encrypted") ? "One of the PDFs is password-protected. Unlock it first, then merge again." : message); setStage("Merge could not be completed."); }
      setProgress(null);
    } finally { setLoading(false); cancelled.current = false; }
  };

  return (
    <ToolWorkspace title="Merge PDF" description="Combine PDF files in your chosen order." accent={T.blue}>
      {result ? (
        <Done msg="PDFs merged successfully" onDownload={() => dl(result, normalizeMergeOutputName(outputName))} shareFile={{ blob: result, name: normalizeMergeOutputName(outputName) }} onReset={reset} />
      ) : (
        <div className="space-y-4">
          <div className="jn-drop" role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inputRef.current?.click(); } }}>
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" multiple hidden onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }} />
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm"><Plus size={20} /></div>
            <p className="m-0 text-sm font-black text-slate-950">{files.length ? "Add more PDFs" : "Choose PDF files"}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Drag-and-drop supported · order can be changed before merging</p>
          </div>

          {files.length > 0 && <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs font-extrabold text-slate-600"><span>{files.length} PDF{files.length === 1 ? "" : "s"} · {fmtBytes(totalBytes)}</span><button type="button" disabled={loading} onClick={reset} className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100">Clear all</button></div>
            {files.map((item, index) => <div key={`${item.name}-${item.size}-${index}`} className="jn-file-pill">
              <div className="min-w-0 flex-1"><p title={item.name} className="m-0 truncate text-xs font-extrabold text-slate-900">{index + 1}. {item.name}</p><p className="m-0 text-[10px] font-semibold text-slate-500">{fmtBytes(item.size)}</p></div>
              <div className="flex gap-1">
                <button type="button" aria-label={`Move ${item.name} up`} disabled={loading || index === 0} onClick={() => move(index, -1)} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 disabled:opacity-30"><ArrowUp size={14} /></button>
                <button type="button" aria-label={`Move ${item.name} down`} disabled={loading || index === files.length - 1} onClick={() => move(index, 1)} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 disabled:opacity-30"><ArrowDown size={14} /></button>
                <button type="button" aria-label={`Remove ${item.name}`} disabled={loading} onClick={() => remove(index)} className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600 disabled:opacity-30"><Trash2 size={14} /></button>
              </div>
            </div>)}
          </div>}

          <F label="Output filename"><input style={IS} value={outputName} onChange={(event) => setOutputName(event.target.value)} disabled={loading} placeholder="merged.pdf" /></F>
          <Err msg={error} />
          {progress !== null && <div role="status" aria-live="polite" className="rounded-xl border border-blue-100 bg-blue-50/70 p-3"><div className="flex justify-between gap-3 text-xs font-bold text-slate-700"><span>{stage}</span><span>{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-blue-600 transition-[width] duration-200" style={{ width: `${progress}%` }} /></div></div>}
          <div className="flex flex-col gap-2 sm:flex-row"><Btn onClick={process} loading={loading} disabled={files.length < 2} full>Merge {files.length >= 2 ? `${files.length} PDFs` : "PDFs"}</Btn>{loading && <Btn onClick={cancel} variant="secondary">Cancel</Btn>}</div>
        </div>
      )}
    </ToolWorkspace>
  );
}
