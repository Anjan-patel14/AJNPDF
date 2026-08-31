"use client";

import React, { useState } from "react";
import { ToolWorkspace, Drop, Btn, Done, Err, F, G2, IS, Info, ToolFile, dl } from "./_shared";
import { protectPdfOnServer } from "@/lib/pdf-backend";
import { safeOutputName, validateFiles } from "@/lib/file-validation";

import { useLanguage } from "@/lib/i18n/language-context";
import { friendlyBackendError } from "@/lib/i18n/backend-errors";
import { resolveBackendLimits } from "@/lib/tool-limits";

export default function ProtectPdf() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [outputName, setOutputName] = useState("protected.pdf");
  const [permissions, setPermissions] = useState({ printing: true, copying: false, editing: false, annotations: false, formFilling: true });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState("");

  const run = async () => {
    const latestLimits = resolveBackendLimits();
    const effectiveMaxMb = Math.min(latestLimits.maxFileSizeMb, latestLimits.maxTotalSizeMb);
    const validation = validateFiles(files.map(item => item.file), { extensions: [".pdf"], minFiles: 1, maxFiles: 1, maxSizeMb: effectiveMaxMb });
    if (validation) { setError(validation); return; }
    if (password.length < 8) { setError("Use an open password with at least 8 characters for stronger protection."); return; }
    if (password !== confirm) { setError("The password confirmation does not match."); return; }
    if (ownerPassword && ownerPassword === password) { setError("For stronger permission control, use a different owner password or leave it empty."); return; }
    setError(""); setLoading(true);
    try {
      setResult(await protectPdfOnServer({
        file: files[0].file,
        userPassword: password,
        ownerPassword,
        outputName: safeOutputName(outputName, "protected", ".pdf"),
        allowPrinting: permissions.printing,
        allowCopying: permissions.copying,
        allowEditing: permissions.editing,
        allowAnnotations: permissions.annotations,
        allowFormFilling: permissions.formFilling,
      }));
      setPassword(""); setConfirm(""); setOwnerPassword("");
    } catch (e: unknown) { setError(friendlyBackendError(t, e, "errors.processingFailed")); }
    finally { setLoading(false); }
  };

  const reset = () => { setFiles([]); setPassword(""); setConfirm(""); setOwnerPassword(""); setResult(null); setError(""); };

  return (
    <ToolWorkspace title="Protect PDF" description="Apply real AES-256 password encryption" accent="#2563EB">
      {result ? (
        <Done msg="PDF protected successfully" onDownload={() => dl(result, safeOutputName(outputName, "protected", ".pdf"))} shareFile={{ blob: result, name: safeOutputName(outputName, "protected", ".pdf") }} onReset={reset} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Drop files={files} onChange={setFiles} accept=".pdf,application/pdf" label="Select one PDF" />
          <G2><F label="Open password" hint="Minimum 8 characters recommended"><input style={IS} type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} /></F><F label="Confirm password"><input style={IS} type="password" autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} /></F></G2>
          <G2><F label="Owner password" hint="Optional and not shown again"><input style={IS} type="password" autoComplete="new-password" value={ownerPassword} onChange={event => setOwnerPassword(event.target.value)} /></F><F label="Output filename"><input style={IS} value={outputName} onChange={event => setOutputName(event.target.value)} /></F></G2>
          <F label="Document permissions">
            <div className="jn-grid2">
              {([
                ["printing", "Allow printing"], ["copying", "Allow copying"], ["editing", "Allow editing"], ["annotations", "Allow annotations"], ["formFilling", "Allow form filling"]] as const).map(([key, label]) => (
                <label key={key} className="jn-file-pill" style={{ justifyContent: "flex-start" }}><input type="checkbox" checked={permissions[key]} onChange={event => setPermissions(prev => ({ ...prev, [key]: event.target.checked }))} /> <span style={{ fontSize: 10, fontWeight: 800 }}>{label}</span></label>
              ))}
            </div>
          </F>
          <Info>Passwords are used only for this request and are not written to application logs. Temporary request workspace data is scheduled for cleanup after the response is returned.</Info>
          <Err msg={error} />
          <Btn onClick={run} loading={loading} disabled={!files.length || !password || !confirm} full style={{ background: "#2563EB" }}>Protect PDF</Btn>
        </div>
      )}
    </ToolWorkspace>
  );
}
