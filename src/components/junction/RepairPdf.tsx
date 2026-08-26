"use client";

import React, { useState } from "react";
import { ToolWorkspace, Drop, Btn, Done, Err, F, IS, Info, ToolFile, dl } from "./_shared";
import { repairPdfOnServer, checkPdfBackendHealth } from "@/lib/pdf-backend";
import { safeOutputName, validateFiles } from "@/lib/file-validation";

import { useLanguage } from "@/lib/i18n/language-context";
import { friendlyBackendError } from "@/lib/i18n/backend-errors";
import { resolveBackendLimits } from "@/lib/tool-limits";

export default function RepairPdf() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [outputName, setOutputName] = useState("repaired.pdf");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState("");

  const run = async () => {
    const latestHealth = await checkPdfBackendHealth();
    if (latestHealth.status !== "online") { setError("This tool is temporarily unavailable. Check live status and try again."); return; }
    const latestLimits = resolveBackendLimits(latestHealth);
    const effectiveMaxMb = Math.min(latestLimits.maxFileSizeMb, latestLimits.maxTotalSizeMb);
    const validation = validateFiles(files.map(item => item.file), { extensions: [".pdf"], minFiles: 1, maxFiles: 1, maxSizeMb: effectiveMaxMb });
    if (validation) { setError(validation); return; }
    setError(""); setLoading(true);
    try { setResult(await repairPdfOnServer(files[0].file, safeOutputName(outputName, "repaired", ".pdf"))); }
    catch (e: unknown) { setError(friendlyBackendError(t, e, "errors.processingFailed")); }
    finally { setLoading(false); }
  };

  return (
    <ToolWorkspace title="Repair PDF" description="Attempt safe recovery of minor PDF structure damage" accent="#DC2626">
      {result ? (
        <Done msg="Repair completed" onDownload={() => dl(result, safeOutputName(outputName, "repaired", ".pdf"))} shareFile={{ blob: result, name: safeOutputName(outputName, "repaired", ".pdf") }} onReset={() => { setResult(null); setFiles([]); setError(""); }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Drop files={files} onChange={setFiles} accept=".pdf,application/pdf" label="Select a damaged PDF" />
          <F label="Output filename"><input style={IS} value={outputName} onChange={event => setOutputName(event.target.value)} /></F>
          <Info>Recovery rebuilds readable PDF structures when possible. Severely damaged documents may not be recoverable.</Info>
          <Err msg={error} />
          <Btn onClick={run} loading={loading} disabled={!files.length} full style={{ background: "#DC2626" }}>Attempt Repair</Btn>
        </div>
      )}
    </ToolWorkspace>
  );
}
