"use client";

/* AJN PDF COMPRESS TARGET SIZE PRECISE V8.2 */

import { useState } from "react";
import { jsPDF } from "jspdf";
import {
  ToolWorkspace,
  Drop,
  Btn,
  Done,
  Err,
  F,
  IS,
  SS,
  Info,
  ToolFile,
  dl,
  fmtBytes,
  withProcessingActivity,
  updateToolProcessing,
} from "./_shared";
import { initPdfWorker } from "@/lib/pdfjs-worker";
import { safeOutputName, validateFiles } from "@/lib/file-validation";

type TargetUnit = "KB" | "MB";

type CompressionResult = {
  blob: Blob;
  original: number;
  output: number;
  target: number;
  durationMs: number;
};

const MIN_TARGET_KB = 20;
const MAX_TARGET_KB = 102400;
const ATTEMPTS = 9;
const TARGET_FLOOR_RATIO = 0.97;

function parseTargetBytes(value: string, unit: TargetUnit) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * (unit === "MB" ? 1024 * 1024 : 1024));
}

export default function CompressPdf() {
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [targetValue, setTargetValue] = useState("");
  const [targetUnit, setTargetUnit] = useState<TargetUnit>("KB");
  const [outputName, setOutputName] = useState("compressed.pdf");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState("");

  const run = async () => {
    const validation = validateFiles(
      files.map((item) => item.file),
      {
        extensions: [".pdf"],
        minFiles: 1,
        maxFiles: 1,
        maxSizeMb: 40,
      },
    );

    if (validation) {
      setError(validation);
      return;
    }

    const source = files[0]?.file;
    if (!source) {
      setError("Select one PDF first.");
      return;
    }

    const wantedBytes = parseTargetBytes(targetValue, targetUnit);
    const wantedKb = wantedBytes / 1024;

    if (!wantedBytes) {
      setError("Enter the target PDF size.");
      return;
    }

    if (wantedKb < MIN_TARGET_KB || wantedKb > MAX_TARGET_KB) {
      setError(`Enter a target between ${MIN_TARGET_KB} KB and ${MAX_TARGET_KB} KB.`);
      return;
    }

    if (wantedBytes >= source.size) {
      setError(`Target must be smaller than the original PDF (${fmtBytes(source.size)}).`);
      return;
    }

    setError("");
    setLoading(true);
    const startedAt = performance.now();

    try {
      const nextResult = await withProcessingActivity("Compress PDF", async () => {
        initPdfWorker();
        const pdfjs = await import("pdfjs-dist");
        const pdf = await pdfjs
          .getDocument({ data: new Uint8Array(await source.arrayBuffer()) })
          .promise;

        const renderCandidate = async (
          scale: number,
          quality: number,
          attempt: number,
        ) => {
          const first = await pdf.getPage(1);
          const firstViewport = first.getViewport({ scale });

          const out = new jsPDF({
            orientation:
              firstViewport.width > firstViewport.height ? "landscape" : "portrait",
            unit: "pt",
            format: [firstViewport.width, firstViewport.height],
            compress: true,
          });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("Canvas processing is unavailable in this browser.");
          }

          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = pageNumber === 1 ? first : await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale });

            canvas.width = Math.max(1, Math.ceil(viewport.width));
            canvas.height = Math.max(1, Math.ceil(viewport.height));

            context.save();
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.filter = "none";
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({
              canvasContext: context,
              viewport,
            }).promise;

            context.restore();

            const dataUrl = canvas.toDataURL("image/jpeg", quality);

            if (pageNumber > 1) {
              out.addPage(
                [viewport.width, viewport.height],
                viewport.width > viewport.height ? "landscape" : "portrait",
              );
            }

            out.addImage(
              dataUrl,
              "JPEG",
              0,
              0,
              viewport.width,
              viewport.height,
              undefined,
              "FAST",
            );

            const pct = Math.min(
              98,
              Math.round(
                (((attempt * pdf.numPages) + pageNumber) /
                  (ATTEMPTS * pdf.numPages)) *
                  100,
              ),
            );

            updateToolProcessing(
              pct,
              `Compressing toward ${fmtBytes(wantedBytes)} · page ${pageNumber} of ${pdf.numPages}`,
            );
          }

          return out.output("blob");
        };

        let lowStrength = 0;
        let highStrength = 1;
        let bestUnderTarget: Blob | null = null;
        let bestUnderGap = Number.POSITIVE_INFINITY;
        let closestBlob: Blob | null = null;
        let closestGap = Number.POSITIVE_INFINITY;

        for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
          const strength = (lowStrength + highStrength) / 2;

          // Internal-only control: users choose size, AJN PDF chooses quality.
          // The curve changes JPEG quality more gently than resolution so we
          // preserve page detail while converging near the requested maximum.
          const scale = Math.max(0.46, 1.34 - strength * 0.82);
          const quality = Math.max(0.2, 0.94 - strength * 0.7);

          const blob = await renderCandidate(scale, quality, attempt);
          const gap = Math.abs(blob.size - wantedBytes);

          if (gap < closestGap) {
            closestGap = gap;
            closestBlob = blob;
          }

          if (blob.size <= wantedBytes) {
            const underGap = wantedBytes - blob.size;
            if (underGap < bestUnderGap) {
              bestUnderGap = underGap;
              bestUnderTarget = blob;
            }

            // A result inside the 97%-100% target band is already close enough.
            if (blob.size >= wantedBytes * TARGET_FLOOR_RATIO) {
              break;
            }

            // Too small: preserve more quality by reducing compression strength.
            highStrength = strength;
          } else {
            // Too large: increase compression strength.
            lowStrength = strength;
          }
        }

        const blob = bestUnderTarget || closestBlob;
        if (!blob) {
          throw new Error("A compressed PDF could not be created.");
        }

        updateToolProcessing(100, "Compression complete");

        try {
          if (typeof pdf.destroy === "function") {
            await pdf.destroy();
          }
        } catch {
          // Cleanup must never hide a completed result.
        }

        return {
          blob,
          original: source.size,
          output: blob.size,
          target: wantedBytes,
          durationMs: performance.now() - startedAt,
        };
      });

      setResult(nextResult);
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "The PDF could not be compressed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const reduction = result
    ? Math.round(((result.original - result.output) / result.original) * 100)
    : 0;

  const targetReached = Boolean(result && result.output <= result.target);

  const reset = () => {
    setResult(null);
    setFiles([]);
    setTargetValue("");
    setTargetUnit("KB");
    setOutputName("compressed.pdf");
    setError("");
  };

  return (
    <ToolWorkspace
      title="Compress PDF"
      description="Enter the PDF size you want. AJN PDF automatically compresses toward that target."
      accent="#D92D20"
    >
      {result ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">
                Original
              </p>
              <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">
                {fmtBytes(result.original)}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">
                Target
              </p>
              <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">
                {fmtBytes(result.target)}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">
                Result
              </p>
              <p className="mt-1 text-sm font-black text-[#D92D20] dark:text-[#EF4444]">
                {fmtBytes(result.output)}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">
                Saved
              </p>
              <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">
                {Math.max(0, reduction)}%
              </p>
            </div>
          </div>

          {targetReached ? (
            <Info>
              {result.output >= result.target * TARGET_FLOOR_RATIO
                ? `Target matched closely in ${(result.durationMs / 1000).toFixed(1)}s.`
                : `Target reached in ${(result.durationMs / 1000).toFixed(1)}s. This PDF compressed below the requested maximum while preserving the best result found by the browser compressor.`}
            </Info>
          ) : (
            <Info bg="rgba(245,158,11,.08)" col="var(--jn-text-secondary)">
              Closest result: {fmtBytes(result.output)}. This PDF could not reach {fmtBytes(result.target)} with the available browser compression range. Try a slightly larger target.
            </Info>
          )}

          <Done
            msg={targetReached ? "Compressed PDF ready" : "Best compression ready"}
            onDownload={() =>
              dl(
                result.blob,
                safeOutputName(outputName, "compressed", ".pdf"),
              )
            }
            shareFile={{
              blob: result.blob,
              name: safeOutputName(outputName, "compressed", ".pdf"),
            }}
            onReset={reset}
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Drop
            files={files}
            onChange={setFiles}
            accept=".pdf,application/pdf"
            label="Select one PDF"
            sub="Up to 40 MB"
          />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <F label="Target PDF size">
              <div className="grid grid-cols-[1fr_100px] gap-2">
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  placeholder={targetUnit === "KB" ? "500" : "1"}
                  style={IS}
                  value={targetValue}
                  onChange={(event) => setTargetValue(event.target.value)}
                  aria-label="Target PDF size"
                />

                <select
                  style={SS}
                  value={targetUnit}
                  onChange={(event) =>
                    setTargetUnit(event.target.value as TargetUnit)
                  }
                  aria-label="Target PDF size unit"
                >
                  <option value="KB">KB</option>
                  <option value="MB">MB</option>
                </select>
              </div>
            </F>

            {files[0] ? (
              <p className="mt-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Original PDF: {fmtBytes(files[0].size)}
              </p>
            ) : null}
          </div>

          <F label="Output filename">
            <input
              style={IS}
              value={outputName}
              onChange={(event) => setOutputName(event.target.value)}
            />
          </F>

          <Info bg="rgba(217,45,32,.06)" col="var(--jn-text-secondary)">
            Target size is an approximate maximum. AJN PDF automatically adjusts page resolution and image quality. Compression rasterizes pages, so searchable text, links, forms and accessibility can be reduced.
          </Info>

          <Err msg={error} />

          <Btn
            onClick={run}
            loading={loading}
            disabled={!files.length || !targetValue.trim()}
            full
          >
            Compress to target size
          </Btn>
        </div>
      )}
    </ToolWorkspace>
  );
}
