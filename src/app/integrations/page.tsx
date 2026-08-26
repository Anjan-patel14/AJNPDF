'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Cloud, CloudDownload, CloudUpload, ShieldCheck, Wrench } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { cloudProviderStatuses } from '@/lib/cloud-integrations';

export default function IntegrationsPage() {
  const providers = cloudProviderStatuses();
  return (
    <div className="ajn-page-shell">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-28 sm:px-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(30,62,130,.08)] sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700"><Cloud className="h-4 w-4" />Cloud files</div>
          <h1 className="mt-5 text-4xl font-black tracking-[-.04em] text-slate-950 sm:text-5xl">Open from cloud. Process with AJN PDF. Save the result back.</h1>
          <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600">Cloud access is deliberately opt-in. Provider buttons appear inside AJN upload/result panels only after the deployment has valid provider configuration.</p>
        </section>

        <section className="mt-6 grid gap-4">
          {providers.map(provider => (
            <article key={provider.id} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3"><div className={`grid h-11 w-11 place-items-center rounded-xl ${provider.configured?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{provider.configured?<CheckCircle2 className="h-5 w-5"/>:<Wrench className="h-5 w-5"/>}</div><div><h2 className="text-xl font-black text-slate-950">{provider.label}</h2><p className="text-xs font-bold text-slate-500">{provider.configured?'Deployment configured':'Configuration required'}</p></div></div>
                  {provider.reason&&<p className="mt-4 max-w-2xl text-xs font-semibold leading-6 text-slate-600">{provider.reason}</p>}
                </div>
                <div className="flex gap-2 text-xs font-black"><span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 ${provider.importAvailable?'bg-blue-50 text-blue-700':'bg-slate-100 text-slate-400'}`}><CloudDownload className="h-3.5 w-3.5"/>Import</span><span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 ${provider.exportAvailable?'bg-blue-50 text-blue-700':'bg-slate-100 text-slate-400'}`}><CloudUpload className="h-3.5 w-3.5"/>Export</span></div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="font-black text-slate-950">Google Drive setup</h2><ol className="mt-4 list-decimal space-y-2 pl-5 text-xs font-semibold leading-6 text-slate-600"><li>Enable Google Drive API and Google Picker API in the same Google Cloud project.</li><li>Create a web OAuth client and configure AJN PDF production origins.</li><li>Use the narrow <code className="rounded bg-slate-100 px-1">drive.file</code> scope.</li><li>Create a browser API key restricted to AJN PDF domains and the required Google APIs.</li><li>Set the OAuth client ID, browser API key and Cloud project number in the public deployment variables.</li></ol></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="font-black text-slate-950">Dropbox setup</h2><ol className="mt-4 list-decimal space-y-2 pl-5 text-xs font-semibold leading-6 text-slate-600"><li>Create a Dropbox Chooser app.</li><li>Add the AJN PDF production domain to the app.</li><li>Set the Dropbox app key in the public deployment variable.</li><li>AJN PDF immediately downloads selected direct links into browser memory; it does not treat the temporary Dropbox link as permanent storage.</li></ol></div>
        </section>

        <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"/><div><h2 className="font-black text-amber-950">OneDrive is intentionally gated</h2><p className="mt-2 text-xs font-semibold leading-6 text-amber-900">AJN PDF will not enable OneDrive merely because a client ID exists. The production implementation needs Microsoft MSAL.js authorization-code + PKCE, an SPA redirect URI and Graph permissions. This avoids falling back to an older or weaker auth shortcut.</p></div></div></section>

        <div className="mt-8 text-center"><Link href="/developer-api" className="text-sm font-black text-blue-700 hover:underline">Developer API documentation</Link></div>
      </main>
      <MainFooter />
    </div>
  );
}
