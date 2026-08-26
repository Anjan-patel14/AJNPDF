"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ToolWorkspace, Drop, Btn, Done, F, Err, IS, ToolFile, dl, Info } from "./_shared";
import { unlockPdfOnServer, checkPdfBackendHealth } from "@/lib/pdf-backend";
import { safeOutputName, validateFiles } from "@/lib/file-validation";

import { useLanguage } from "@/lib/i18n/language-context";
import { friendlyBackendError } from "@/lib/i18n/backend-errors";
import { resolveBackendLimits } from "@/lib/tool-limits";

export default function UnlockPdf() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [outputName, setOutputName] = useState("unlocked.pdf");
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
    if (!password) { setError("Enter the current valid PDF password."); return; }
    if (!authorized) { setError("Confirm that you own the document or have permission to unlock it."); return; }
    setError(""); setLoading(true);
    try {
      setResult(await unlockPdfOnServer({ file: files[0].file, password, authorized, outputName: safeOutputName(outputName, "unlocked", ".pdf") }));
      setPassword("");
    } catch (e: unknown) { setError(friendlyBackendError(t, e, "errors.processingFailed")); }
    finally { setLoading(false); }
  };

  const reset = () => { setFiles([]); setPassword(""); setAuthorized(false); setResult(null); setError(""); };

  return (
    <ToolWorkspace title="Unlock PDF" description="Remove encryption using the current valid password" accent="#059669">
      {result ? (
        <Done msg="PDF unlocked successfully" onDownload={() => dl(result, safeOutputName(outputName, "unlocked", ".pdf"))} shareFile={{ blob: result, name: safeOutputName(outputName, "unlocked", ".pdf") }} onReset={reset} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Drop files={files} onChange={setFiles} accept=".pdf,application/pdf" label="Select an encrypted PDF" />
          <F label="Current PDF password"><input style={IS} type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter the existing password" /></F>
          <F label="Output filename"><input style={IS} value={outputName} onChange={event => setOutputName(event.target.value)} /></F>
          <label className="jn-file-pill" style={{ justifyContent: "flex-start", alignItems: "flex-start" }}><input type="checkbox" checked={authorized} onChange={event => setAuthorized(event.target.checked)} /><span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.5 }}>I own this document or have permission to remove its password.</span></label>
          <Info>AJN PDF does not guess, brute-force or bypass passwords. A correct current password is required. Read the <Link href="/unlock-authorization-policy" className="underline font-black">authorization policy</Link>.</Info>
          <Err msg={error} />
          <Btn onClick={run} loading={loading} disabled={!files.length || !password || !authorized} full style={{ background: "#059669" }}>Unlock PDF</Btn>
        </div>
      )}
    </ToolWorkspace>
  );
}
