'use client';

import React, { useMemo, useState } from 'react';
import { Cloud, CloudDownload, CloudUpload, Loader2 } from 'lucide-react';
import { cloudProviderStatuses, exportToGoogleDrive, importFromDropbox, importFromGoogleDrive } from '@/lib/cloud-integrations';
import { cn } from '@/lib/utils';

export function CloudImportActions({
  multiple,
  accept,
  disabled,
  onImport,
}: {
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  onImport: (files: File[]) => void;
}) {
  const providers = useMemo(() => cloudProviderStatuses().filter(provider => provider.importAvailable), []);
  const [busy, setBusy] = useState<string>('');
  const [message, setMessage] = useState('');

  if (!providers.length) return null;

  const run = async (provider: string) => {
    setBusy(provider);
    setMessage('');
    try {
      const files = provider === 'google-drive'
        ? await importFromGoogleDrive({ multiple })
        : await importFromDropbox({ multiple, accept });
      if (files.length) {
        onImport(files);
        setMessage(`${files.length} cloud file${files.length === 1 ? '' : 's'} imported.`);
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Cloud import could not be completed.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500"><Cloud className="h-3.5 w-3.5" />Cloud</span>
        {providers.map(provider => (
          <button
            key={provider.id}
            type="button"
            disabled={disabled || Boolean(busy)}
            onClick={() => void run(provider.id)}
            className={cn('inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50')}
          >
            {busy === provider.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudDownload className="h-3.5 w-3.5" />}
            {provider.label}
          </button>
        ))}
      </div>
      {message && <p role="status" aria-live="polite" className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{message}</p>}
    </div>
  );
}

export function GoogleDriveExportAction({ blob, name }: { blob: Blob; name: string }) {
  const google = useMemo(() => cloudProviderStatuses().find(provider => provider.id === 'google-drive'), []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  if (!google?.exportAvailable) return null;

  const upload = async () => {
    setBusy(true);
    setMessage('');
    try {
      const uploaded = await exportToGoogleDrive(blob, name);
      setMessage(`Saved to Google Drive as ${uploaded.name || name}.`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Google Drive export could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-center">
      <button type="button" disabled={busy} onClick={() => void upload()} className="jn-btn-base border border-slate-200 bg-white text-slate-800 disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
        Save to Drive
      </button>
      {message && <span role="status" aria-live="polite" className="mt-1 max-w-56 text-[10px] font-semibold text-slate-500">{message}</span>}
    </div>
  );
}
