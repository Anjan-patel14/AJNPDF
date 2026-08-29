"use client";
import React, { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, Download, Eye, FileCheck2, Loader2, RefreshCcw, Share2, UploadCloud, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { sendAjnAnalytics } from "../analytics/site-analytics";
import { useLanguage } from "@/lib/i18n/language-context";
import { ToolArtwork } from "@/components/ajn/tool-artwork";
import { toolIdFromPathname } from "@/lib/tool-routes";
import { getToolLimitProfile } from "@/lib/tool-limits";
import { usePdfBackendStatus } from "./backend-status";
import { CloudImportActions, GoogleDriveExportAction } from "./CloudFileActions";
import { PrivacyBadge } from "@/components/workspace/PrivacyBadge";
import { RecoveryError } from "@/components/workspace/RecoveryError";

export interface ToolFile { file: File; name: string; size: number; }

export function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export function getFilesFromEvent(event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>): FileList | null {
  if ("dataTransfer" in event) return event.dataTransfer?.files ?? null;
  return event.target.files;
}

export function safeOutputName(value: string | undefined, fallbackBase: string, extension: string) {
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  const raw = (value || fallbackBase).trim().replace(new RegExp(`${ext.replace('.', '\\.')}$`, "i"), "");
  const clean = raw.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").replace(/[. ]+$/g, "").slice(0, 120) || fallbackBase;
  return `${clean}${ext}`;
}

export function dl(blob: Blob, name: string) {
  if (typeof window === "undefined") return;
  const u = URL.createObjectURL(blob);
  const a = document.body.appendChild(document.createElement("a"));
  a.style.display = "none";
  a.href = u;
  a.download = name;
  a.click();
  const toolId = toolIdFromPathname(window.location.pathname);
  sendAjnAnalytics({ event_name: "download", path: window.location.pathname, tool_id: toolId });
  setTimeout(() => {
    if (document.body.contains(a)) document.body.removeChild(a);
    URL.revokeObjectURL(u);
    window.dispatchEvent(new CustomEvent("ajn-tool-completed"));
  }, 1500);
}

export function beginToolProcessing(label: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ajn:processing-start", { detail: { label } }));
  window.dispatchEvent(new CustomEvent("ajn:processing-progress", { detail: {} }));
}
export function completeToolProcessing() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ajn:processing-finish"));
}
export function failToolProcessing() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ajn:processing-error"));
}

export function updateToolProcessing(pct?: number, stage?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ajn:processing-progress", { detail: { pct, stage } }));
}

export async function withProcessingActivity<T>(label: string, work: () => Promise<T>): Promise<T> {
  beginToolProcessing(label);
  try {
    const result = await work();
    completeToolProcessing();
    return result;
  } catch (error) {
    failToolProcessing();
    throw error;
  }
}

export async function shareResult(blob: Blob, name: string) {
  if (typeof window === "undefined") return "unavailable" as const;
  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
  const file = new File([blob], name, { type: blob.type || "application/octet-stream", lastModified: Date.now() });
  try {
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ title: "AJN PDF result", text: "Processed with AJN PDF", files: [file] });
      return "shared" as const;
    }
    await navigator.clipboard.writeText(window.location.href);
    return "copied-link" as const;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled" as const;
    try { await navigator.clipboard.writeText(window.location.href); return "copied-link" as const; } catch { return "unavailable" as const; }
  }
}

export const T = {
  red: "#EF233C", redL: "#FF5C72", gray: "var(--jn-text-muted)",
  border: "var(--jn-border)", bg: "transparent", green: "#10B981", blue: "#2563EB",
  purple: "#7C3AED", amber: "#D97706", cyan: "#06B6D4", pink: "#EC4899", teal: "#0891B2",
};

export const IS: React.CSSProperties = {
  width: "100%", border: "1px solid var(--jn-border)", borderRadius: 14, padding: "11px 13px",
  fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  background: "var(--jn-input-bg)", color: "var(--jn-text-primary)", fontWeight: 650,
};
export const SS: React.CSSProperties = { ...IS, cursor: "pointer" };

let _stylesInjected = false;
function injectStyles(accent = T.red) {
  if (typeof window === "undefined" || _stylesInjected) return;
  _stylesInjected = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes jn-spin{to{transform:rotate(360deg)}}
    @keyframes jn-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .jn-card{animation:jn-up .32s cubic-bezier(.16,1,.3,1)}
    .jn-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    @media(max-width:640px){.jn-grid2{grid-template-columns:1fr!important}}
    .jn-range{-webkit-appearance:none;width:100%;height:6px;border-radius:999px;background:var(--jn-soft-bg);outline:none;cursor:pointer}
    .jn-range::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:var(--jn-accent,${accent});cursor:pointer;box-shadow:0 4px 14px color-mix(in srgb,var(--jn-accent,${accent}) 28%,transparent);border:3px solid white}
    .jn-range::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:var(--jn-accent,${accent});border:3px solid white;cursor:pointer}
    input[type=checkbox]{accent-color:var(--jn-accent,${accent});cursor:pointer}
    .jn-file-pill{display:flex;align-items:center;justify-content:space-between;background:var(--jn-pill-bg);border-radius:14px;padding:10px 12px;gap:10px;border:1px solid var(--jn-border)}
    .jn-btn-base{min-height:46px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 20px;border-radius:13px;font-size:14px;font-weight:800;cursor:pointer;border:none;transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease,background-color .14s ease,color .14s ease;font-family:inherit}
    .jn-btn-base:hover:not(:disabled){transform:translateY(-1px)}
    .jn-btn-base:active:not(:disabled){transform:scale(.98)}
    .jn-btn-base:disabled{opacity:.5;cursor:not-allowed}
    .jn-btn-base:focus-visible,.jn-drop:focus-visible{outline:3px solid color-mix(in srgb,var(--jn-accent,${accent}) 30%,transparent);outline-offset:3px}
    .jn-drop{border:1.5px dashed color-mix(in srgb,var(--jn-accent,${accent}) 30%,var(--jn-border));border-radius:22px;padding:clamp(1.35rem,4vw,2.4rem) 1rem;text-align:center;cursor:pointer;background:var(--jn-drop-bg);transition:all .2s ease}
    .jn-drop:hover,.jn-drop.active{border-color:var(--jn-accent,${accent});background:var(--jn-drop-hover);transform:translateY(-1px);box-shadow:0 12px 30px rgba(35,70,145,.08)}
    .jn-inline-loader{display:inline-flex;align-items:center;gap:2px;height:14px}.jn-inline-loader i{display:block;width:3px;height:8px;border-radius:2px;background:currentColor;animation:jn-bar .75s ease-in-out infinite}.jn-inline-loader i:nth-child(2){animation-delay:.12s}.jn-inline-loader i:nth-child(3){animation-delay:.24s}@keyframes jn-bar{0%,100%{transform:scaleY(.55);opacity:.55}50%{transform:scaleY(1);opacity:1}}
    @media(prefers-reduced-motion:reduce){.jn-card{animation:none}.jn-btn-base,.jn-drop{transition:none}.jn-inline-loader i{animation:none}}
  `;
  document.head.appendChild(s);
}

export function ToolWorkspace({ title, description, accent = T.blue, children }: WorkspaceProps) {
  const pathname = usePathname();
  const { tool: localizeTool } = useLanguage();
  React.useEffect(() => { injectStyles(accent); }, [accent]);
  const toolId = toolIdFromPathname(pathname) || "";
  const localized = localizeTool(toolId, title, description, []);
  const limitProfile = getToolLimitProfile(toolId);
  const serverMode = limitProfile.executionMode === "server";
  const { checking, online, refresh } = usePdfBackendStatus(serverMode ? 30000 : 0, serverMode);
  const serviceBlocked = serverMode && (checking || !online);

  return (
    <div className="jn-workspace relative min-h-screen overflow-hidden" style={{ "--jn-accent": accent, background: "transparent", WebkitFontSmoothing: "antialiased" } as React.CSSProperties}>
      <main className="relative z-10 mx-auto w-full max-w-4xl px-3 pb-12 pt-24 sm:px-5 sm:pt-28">
        <div className="mx-auto mb-5 flex max-w-3xl items-center gap-3.5 text-left sm:mb-7 sm:gap-5">
          <ToolArtwork toolId={toolId} toolName={localized.name} priority className="h-[52px] w-[52px] sm:h-14 sm:w-14" />
          <div className="min-w-0 flex-1">
            <h1 className="text-balance text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl">{localized.name}</h1>
            <p className="mt-1.5 max-w-2xl text-sm font-medium leading-6 text-[#475569] dark:text-[#b6c0d0] sm:text-[15px]">{localized.desc}</p>
            <PrivacyBadge toolId={toolId} className="mt-2" />
          </div>
        </div>
        <section className="jn-card ajn-product-canvas rounded-[1.25rem] border border-[#e3e9f4] bg-white p-4 shadow-[0_14px_44px_rgba(14,27,44,.07)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_20px_60px_rgba(0,0,0,.32)] sm:p-6">{serverMode && serviceBlocked && (
            <div role="status" aria-live="polite" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
              <div className="flex min-w-0 gap-2.5">
                {checking ? <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                <div><p className="text-xs font-black">{checking ? "Checking availability..." : "Temporarily unavailable"}</p><p className="mt-1 text-[11px] font-semibold leading-5 opacity-80">{checking ? "AJN PDF is confirming live availability before accepting the selected file." : "This tool is temporarily unavailable. On-device AJN PDF tools remain available."}</p></div>
              </div>
              {!checking && <button type="button" onClick={() => void refresh()} className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-[10px] font-black text-amber-900">Retry</button>}
            </div>
          )}
          <fieldset disabled={serviceBlocked} aria-disabled={serviceBlocked || undefined} className="m-0 min-w-0 border-0 p-0 disabled:cursor-not-allowed disabled:opacity-70">
            {children}
          </fieldset>
        </section>
      </main>
    </div>
  );
}

export function Btn({ onClick, disabled, loading, children, variant = "primary", full, style }: {
  onClick?: () => void; disabled?: boolean; loading?: boolean; children: ReactNode;
  variant?: "primary"|"secondary"|"ghost"; full?: boolean; style?: React.CSSProperties;
}) {
  const v = {
    primary: { background: "#2563EB", color: "#fff", boxShadow: "0 10px 24px rgba(37,99,235,.18)" },
    secondary: { background: "var(--jn-secondary-bg)", color: "var(--jn-text-primary)", border: "1px solid var(--jn-border)" },
    ghost: { background: "transparent", color: "var(--jn-text-primary)", border: "1px solid var(--jn-border)" },
  };
  const customStyle = { ...style } as React.CSSProperties;
  if (variant === "primary") {
    delete customStyle.background;
    delete customStyle.backgroundColor;
    delete customStyle.color;
    delete customStyle.boxShadow;
  }
  return <button type="button" className="jn-btn-base" onClick={onClick} disabled={disabled||loading} aria-busy={loading || undefined} style={{ width: full ? "100%" : undefined, ...v[variant], ...customStyle }}>{loading && <span className="jn-inline-loader" aria-hidden="true"><i/><i/><i/></span>}{children}</button>;
}

export function Drop({ files, onChange, accept="*", multiple=false, label, sub }: {
  files: ToolFile[]; onChange: (f: ToolFile[]) => void; accept?: string; multiple?: boolean; label?: string; sub?: string;
}) {
  const { t } = useLanguage();
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const addFiles = useCallback((rawFiles: File[]) => {
    const arr = rawFiles.filter(f => f.size > 0).map(f => ({ file: f, name: f.name, size: f.size }));
    if (typeof window !== "undefined" && arr.length > 0) {
      const toolId = toolIdFromPathname(window.location.pathname);
      const countBucket = arr.length === 1 ? "one-file" : arr.length <= 5 ? "two-to-five-files" : "six-plus-files";
      sendAjnAnalytics({ event_name: "upload_selected", path: window.location.pathname, tool_id: toolId, element_id: countBucket });
    }
    onChange(multiple ? [...files, ...arr] : arr.slice(0, 1));
  }, [files,multiple,onChange]);
  const add = useCallback((raw: FileList|null) => {
    if (!raw) return;
    addFiles(Array.from(raw));
  }, [addFiles]);
  const openPicker = () => ref.current?.click();
  return <div>
    <div className={cn("jn-drop", drag && "active")} role="button" tabIndex={0} aria-label={multiple ? t("common.chooseFiles") : t("common.chooseFile")}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); } }}
      onClick={openPicker} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);add(e.dataTransfer.files)}}>
      <input id={inputId} ref={ref} type="file" accept={accept} multiple={multiple} className="sr-only" onChange={e=>add(e.target.files)} />
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm"><UploadCloud size={23}/></div>
      <p className="m-0 text-sm font-extrabold text-slate-900">{drag ? t("upload.dropNow") : (label || (multiple ? t("common.chooseFiles") : t("common.chooseFile")))}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{sub || t("upload.drop")}</p>
    </div>
    <CloudImportActions multiple={multiple} accept={accept} onImport={addFiles} />
    {files.length > 0 && <div className="mt-3 space-y-2" aria-live="polite">{files.map((f,i)=><div key={`${f.name}-${i}`} className="jn-file-pill">
      <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600"><FileCheck2 size={16}/></div><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{f.name}</p><p className="text-xs font-medium text-slate-500">{fmtBytes(f.size)}</p></div></div>
      <button type="button" aria-label={`${t("common.remove")} ${f.name}`} onClick={()=>onChange(files.filter((_,j)=>j!==i))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"><X size={17}/></button>
    </div>)}</div>}
  </div>;
}

export function Done({ msg, onDownload, dlLabel, onReset, shareFile }: { msg?:string; onDownload?:()=>void; dlLabel?:string; onReset:()=>void; shareFile?:{blob:Blob;name:string} }) {
  const { t } = useLanguage();
  const [shareState, setShareState] = useState<"idle"|"copied-link"|"unavailable">("idle");
  const share = async () => {
    if (!shareFile) return;
    const result = await shareResult(shareFile.blob, shareFile.name);
    if (result === "cancelled") return;
    const toolId = toolIdFromPathname(window.location.pathname);
    sendAjnAnalytics({ event_name: "interaction", path: window.location.pathname, tool_id: toolId, element_id: result === "shared" ? "share-file" : result === "copied-link" ? "copy-tool-link" : "share-unavailable" });
    if (result === "copied-link" || result === "unavailable") {
      setShareState(result);
      window.setTimeout(() => setShareState("idle"), 1800);
    }
  };
  const canPreviewPdf = Boolean(
    shareFile &&
    (
      shareFile.blob.type.toLowerCase().startsWith("application/pdf") ||
      shareFile.name.toLowerCase().endsWith(".pdf")
    )
  );
  const previewPdf = () => {
    if (!shareFile || !canPreviewPdf || typeof window === "undefined") return;

    const previewBlob = shareFile.blob.type.toLowerCase().startsWith("application/pdf")
      ? shareFile.blob
      : new Blob([shareFile.blob], { type: "application/pdf" });
    const previewUrl = URL.createObjectURL(previewBlob);
    const opener = document.createElement("a");
    opener.href = previewUrl;
    opener.target = "_blank";
    opener.rel = "noopener noreferrer";
    opener.style.display = "none";
    opener.setAttribute("aria-label", `${t("common.preview")} PDF`);
    document.body.appendChild(opener);
    opener.click();
    opener.remove();

    const toolId = toolIdFromPathname(window.location.pathname);
    sendAjnAnalytics({
      event_name: "interaction",
      path: window.location.pathname,
      tool_id: toolId,
      element_id: "preview_pdf",
    });

    window.setTimeout(() => URL.revokeObjectURL(previewUrl), 5 * 60 * 1000);
  };
  return <div className="animate-in fade-in slide-in-from-bottom-2 py-4 text-center duration-300" role="status" aria-live="polite">
    <div className="jn-success-draw mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"><FileCheck2 className="h-6 w-6"/></div>
    <h3 className="text-xl font-black text-[#0e1b2c] dark:text-[#eef2f9]">{msg || t("result.ready")}</h3>
    <p className="mx-auto mt-1 max-w-md text-xs font-medium leading-5 text-[#64748b] dark:text-[#8b96ab]">{t("result.shareHelp")}</p>
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      {onDownload && <Btn onClick={onDownload} style={{background:"#0f172a"}}><Download size={16}/>{dlLabel || t("common.download")}</Btn>}
      {canPreviewPdf && <Btn variant="secondary" onClick={previewPdf}><Eye size={15}/>{t("common.preview")} PDF</Btn>}
      {shareFile && <Btn variant="secondary" onClick={() => void share()}><Share2 size={15}/>{shareState === "copied-link" ? t("result.toolLinkCopied") : shareState === "unavailable" ? t("result.shareUnavailable") : t("result.shareFile")}</Btn>}
      {shareFile && <GoogleDriveExportAction blob={shareFile.blob} name={shareFile.name} />}
      <Btn variant="secondary" onClick={()=>{if(typeof window!=="undefined"){const toolId=toolIdFromPathname(window.location.pathname);sendAjnAnalytics({event_name:"tool_reset",path:window.location.pathname,tool_id:toolId});}onReset();}}><RefreshCcw size={15}/>{t("common.processAnother")}</Btn>
    </div>
  </div>;
}

export function Range({ label, value, min, max, step=1, onChange, fmt }: { label:string; value:number; min:number; max:number; step?:number; onChange:(v:number)=>void; fmt?:(v:number)=>string }) {
  const id = useId();
  return <div><div className="mb-2 flex items-center justify-between gap-3"><label htmlFor={id} className="text-xs font-bold text-slate-700">{label}</label><span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{fmt?.(value)??value}</span></div><input id={id} className="jn-range" type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)}/></div>;
}

export function Pills<T extends string|number>({ opts, val, onChange }: { opts:{label:string;value:T}[]; val:T; onChange:(v:T)=>void }) {
  return <div className="flex flex-wrap gap-2">{opts.map(o=><button type="button" key={String(o.value)} aria-pressed={val===o.value} onClick={()=>onChange(o.value)} className={cn("min-h-10 rounded-xl border px-3 py-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500", val===o.value ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/15" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200")}>{o.label}</button>)}</div>;
}

export function F({ label, hint, children }: { label:string; hint?:string; children:ReactNode }) {
  return <div className="flex flex-col gap-1.5"><div className="text-xs font-bold text-slate-700">{label}</div>{children}{hint && <p className="m-0 text-xs font-medium leading-5 text-slate-500">{hint}</p>}</div>;
}

export function Info({ children, bg="rgba(37,99,235,0.05)", col="var(--jn-text-secondary)" }: { children:ReactNode; bg?:string; col?:string }) {
  return <div style={{background:bg,color:col}} className="rounded-xl border border-slate-200/70 p-3 text-xs font-medium leading-5">{children}</div>;
}
export function G2({ children, gap=12 }: { children:ReactNode; gap?:number }) { return <div className="jn-grid2" style={{gap}}>{children}</div>; }
export function Err({ msg }: { msg:string }) { return msg ? <RecoveryError message={msg} /> : null; }

export interface WorkspaceProps { title:string; description:string; accent?:string; children:ReactNode; }
