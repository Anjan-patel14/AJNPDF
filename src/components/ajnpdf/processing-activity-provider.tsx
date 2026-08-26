"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { engine } from "@/lib/engine";
import styles from "./processing-activity-provider.module.css";
import { useLanguage } from "@/lib/i18n/language-context";

type Phase = "idle" | "preparing" | "processing" | "cancelling" | "ready" | "error";
type ActivityState = {
  active: boolean;
  phase: Phase;
  canCancel: boolean;
  requestLabel: string;
  jobId?: string;
  stageLabel?: string;
  progressPct?: number;
};

const INITIAL_STATE: ActivityState = { active: false, phase: "idle", canCancel: false, requestLabel: "document" };
const SERVER_PATH_PATTERN = /\/api\/(?:convert\/|pdf\/(?:protect|unlock|repair|compress)(?:\/|$))/i;

function getRequestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}
function getMethod(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.method) return init.method.toUpperCase();
  if (typeof Request !== "undefined" && input instanceof Request) return input.method.toUpperCase();
  return "GET";
}
function isServerProcessingRequest(input: RequestInfo | URL, init?: RequestInit) {
  if (getMethod(input, init) !== "POST") return false;
  try { return SERVER_PATH_PATTERN.test(new URL(getRequestUrl(input), window.location.href).pathname); } catch { return false; }
}
function requestLabelFromUrl(input: RequestInfo | URL) {
  try {
    const path = new URL(getRequestUrl(input), window.location.href).pathname;
    return (path.split("/").filter(Boolean).at(-1) ?? "document").replace(/-/g, " ");
  } catch { return "document"; }
}

export function ProcessingActivityProvider() {
  const { t, text } = useLanguage();
  const [activity, setActivity] = useState<ActivityState>(INITIAL_STATE);
  const activeCount = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideLater = useCallback((delay: number) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setActivity(INITIAL_STATE), delay);
  }, []);

  const finish = useCallback((phase: "ready" | "error") => {
    if (revealTimer.current) { clearTimeout(revealTimer.current); revealTimer.current = null; }
    setActivity(current => current.active ? { ...current, phase, canCancel: false } : current);
    hideLater(phase === "ready" ? 900 : 1500);
  }, [hideLater]);

  const markCancelled = useCallback(() => {
    setActivity(current => current.active
      ? { ...current, active: true, phase: "cancelling", canCancel: false, stageLabel: undefined, progressPct: undefined }
      : current);
    hideLater(650);
  }, [hideLater]);

  useEffect(() => {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!isServerProcessingRequest(input, init)) return nativeFetch(input, init);
      activeCount.current += 1;
      const requestLabel = requestLabelFromUrl(input);
      let nextInit = init;
      const controller = new AbortController();
      const suppliedSignal = init?.signal ?? (typeof Request !== "undefined" && input instanceof Request ? input.signal : undefined);
      const forwardAbort = () => controller.abort(suppliedSignal?.reason);
      if (suppliedSignal?.aborted) forwardAbort();
      else suppliedSignal?.addEventListener("abort", forwardAbort, { once: true });
      abortController.current = controller;
      nextInit = { ...init, signal: controller.signal };
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(() => setActivity({ active: true, phase: "processing", canCancel: true, requestLabel }), 100);
      try {
        const response = await nativeFetch(input, nextInit);
        if (activeCount.current === 1) finish(response.ok ? "ready" : "error");
        return response;
      } catch (error) {
        if (activeCount.current === 1) {
          if (error instanceof DOMException && error.name === "AbortError") markCancelled();
          else finish("error");
        }
        throw error;
      } finally {
        suppliedSignal?.removeEventListener("abort", forwardAbort);
        activeCount.current = Math.max(0, activeCount.current - 1);
        if (activeCount.current === 0) abortController.current = null;
      }
    };
    return () => {
      window.fetch = nativeFetch;
      if (revealTimer.current) clearTimeout(revealTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [finish, markCancelled]);

  useEffect(() => {
    const start = (event: Event) => {
      const detail = (event as CustomEvent<{ label?: string; jobId?: string }>).detail;
      if (revealTimer.current) { clearTimeout(revealTimer.current); revealTimer.current = null; }
      setActivity({
        active: true,
        phase: "preparing",
        canCancel: Boolean(detail?.jobId),
        requestLabel: (detail?.label || "document").replace(/-/g, " "),
        jobId: detail?.jobId,
      });
    };
    const progress = (event: Event) => {
      const detail = (event as CustomEvent<{ pct?: number; stage?: string; jobId?: string }>).detail;
      setActivity(current => current.active ? {
        ...current,
        phase: "processing",
        canCancel: Boolean(detail?.jobId || current.jobId),
        jobId: detail?.jobId || current.jobId,
        stageLabel: detail?.stage ? String(detail.stage) : current.stageLabel,
        progressPct: typeof detail?.pct === "number" ? Math.max(0, Math.min(100, detail.pct)) : current.progressPct,
      } : current);
    };
    const done = () => finish("ready");
    const error = () => finish("error");
    const cancelled = () => markCancelled();
    window.addEventListener("ajn:processing-start", start as EventListener);
    window.addEventListener("ajn:processing-progress", progress as EventListener);
    window.addEventListener("ajn:processing-finish", done as EventListener);
    window.addEventListener("ajn:processing-error", error as EventListener);
    window.addEventListener("ajn:processing-cancelled", cancelled as EventListener);
    return () => {
      window.removeEventListener("ajn:processing-start", start as EventListener);
      window.removeEventListener("ajn:processing-progress", progress as EventListener);
      window.removeEventListener("ajn:processing-finish", done as EventListener);
      window.removeEventListener("ajn:processing-error", error as EventListener);
      window.removeEventListener("ajn:processing-cancelled", cancelled as EventListener);
    };
  }, [finish, markCancelled]);

  const cancel = useCallback(() => {
    setActivity(current => current.active ? { ...current, phase: "cancelling", canCancel: false, progressPct: undefined } : current);
    if (activity.jobId && engine.cancelJob(activity.jobId)) return;
    abortController.current?.abort();
  }, [activity.jobId]);

  if (!activity.active) return null;
  const stage = activity.phase === "preparing" ? 0 : activity.phase === "processing" || activity.phase === "cancelling" ? 1 : 2;
  const labels = [t("processing.fullStagePrepare"), t("processing.fullStageProcess"), t("processing.fullStageReady")];
  const title = activity.phase === "preparing"
    ? t("processing.fullPreparingTitle")
    : activity.phase === "processing"
      ? t("processing.fullProcessingTitle")
      : activity.phase === "cancelling"
        ? t("processing.cancelling")
        : activity.phase === "ready"
          ? t("processing.fullReadyTitle")
          : t("processing.fullErrorTitle");
  const description = activity.phase === "preparing"
    ? t("processing.fullPreparingDescription")
    : activity.phase === "processing"
      ? (activity.stageLabel ? text(activity.stageLabel) : t("processing.fullProcessingDescription"))
      : activity.phase === "cancelling"
        ? t("processing.cancellingDescription")
        : activity.phase === "ready"
          ? t("processing.fullReadyDescription")
          : t("processing.fullErrorDescription");
  const complete = activity.phase === "ready";
  const terminal = activity.phase === "ready" || activity.phase === "error" || activity.phase === "cancelling";

  return <div className={styles.backdrop}>
    <section className={styles.panel} role="status" aria-live="polite" aria-busy={!terminal}>
      <div className={styles.brandRow}><span className={styles.brand}>AJN PDF</span><span className={styles.secureBadge}><ShieldCheck />{t("processing.fullWorkflow")}</span></div>
      <div className={styles.visual} aria-hidden="true"><div className={`${styles.sheet} ${styles.sheetBack}`} /><div className={`${styles.sheet} ${styles.sheetMiddle}`} /><div className={`${styles.sheet} ${styles.sheetFront}`}>{complete ? <CheckCircle2 /> : <FileText />}<span className={styles.scanLine} /></div></div>
      <div className={styles.copy}><span className={styles.eyebrow}>{t("processing.fullWorkspace")}</span><h2 className={styles.title}>{title}</h2><p className={styles.description}>{description}</p></div>
      <div className={styles.progressTrack} role="progressbar" aria-label="Processing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={typeof activity.progressPct === "number" ? Math.round(activity.progressPct) : undefined}>
        <div className={activity.phase === "error" ? styles.progressError : activity.phase === "ready" ? styles.progressReady : activity.phase === "cancelling" ? styles.progressError : typeof activity.progressPct === "number" ? styles.progressKnown : styles.progressBar} style={typeof activity.progressPct === "number" && activity.phase === "processing" ? { width: `${activity.progressPct}%` } : undefined} />
      </div>
      <div className={styles.stages} aria-hidden="true">{labels.map((label, index) => <div key={label} className={`${styles.stage} ${index <= stage ? styles.stageActive : ""}`}><span className={styles.stageMark}>{String(index + 1).padStart(2, "0")}</span><span>{label}</span></div>)}</div>
      <div className={styles.meta}><span className={styles.jobLabel}>{activity.requestLabel}{typeof activity.progressPct === "number" && activity.phase === "processing" ? ` · ${Math.round(activity.progressPct)}%` : ""}</span>{activity.canCancel && activity.phase !== "ready" && activity.phase !== "error" && activity.phase !== "cancelling" && <button className={styles.cancel} type="button" onClick={cancel}>{t("common.cancel")}</button>}</div>
    </section>
  </div>;
}
