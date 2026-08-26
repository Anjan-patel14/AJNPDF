import type { Metadata } from 'next';
import Link from 'next/link';
import { Code2, KeyRound, ShieldCheck, TerminalSquare } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { ApiStatusCard } from '@/components/products/api-status-card';

export const metadata: Metadata = { title: { absolute: 'AJN API - PDF Automation for Developers | AJN PDF' }, description: 'Use AJN PDF API v1 with scoped API keys, rate limits, conversion endpoints and electronic-signature packages.' };

const endpoints = [
  ['GET', '/api/v1/status', 'Public configuration status'],
  ['GET', '/api/v1/account', 'Key scopes and rate state'],
  ['GET', '/api/v1/capabilities', 'Available processors and API routes'],
  ['POST', '/api/v1/convert/{tool_id}', 'Run a supported conversion processor'],
  ['POST', '/api/v1/sign/electronic', 'Create an electronic-signature evidence package'],
] as const;

export default function DevelopersPage() {
  return <div className="min-h-screen bg-white"><Navbar/><main className="pt-[92px] md:pt-[108px]"><section className="mx-auto max-w-7xl px-4 pb-14 md:px-8"><div className="rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-red-50 p-6 sm:p-8 md:p-12"><p className="text-[10px] font-black uppercase tracking-[.24em] text-violet-700">AJN API</p><h1 className="mt-4 max-w-4xl text-balance text-[clamp(2.6rem,7vw,5.2rem)] font-black leading-[.98] tracking-[-.055em] text-slate-950">Automate supported PDF workflows.</h1><p className="mt-5 max-w-3xl text-sm font-medium leading-7 text-slate-600 md:text-lg">API v1 is already part of the AJN backend. It uses scoped API keys, per-key rate limits and SHA-256-only secret storage in server configuration.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="#endpoints" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-violet-700 px-5 text-xs font-black text-white shadow-lg shadow-violet-100 hover:bg-violet-800"><TerminalSquare className="h-4 w-4"/>View endpoints</Link><Link href="/account" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-800"><KeyRound className="h-4 w-4"/>Account</Link></div></div></section>

<section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 md:grid-cols-[1.1fr_.9fr] md:px-8"><div><h2 className="text-2xl font-black tracking-tight text-slate-950">Live service status</h2><div className="mt-4"><ApiStatusCard/></div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-6"><ShieldCheck className="h-6 w-6 text-violet-700"/><h2 className="mt-4 text-lg font-black text-slate-950">API key model</h2><p className="mt-2 text-sm font-medium leading-6 text-slate-600">AJN stores only SHA-256 digests of configured API secrets. Keys can have read, convert and sign scopes with an independent request rate.</p><p className="mt-3 text-xs font-semibold leading-5 text-slate-500">R21 includes a PowerShell key-generation helper. Self-service key issuance can be connected to billing after your payment provider is configured.</p></div></section>

<section id="endpoints" className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-24"><div className="flex items-center gap-3"><Code2 className="h-6 w-6 text-violet-700"/><h2 className="text-2xl font-black tracking-tight text-slate-950">API v1 endpoints</h2></div><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">{endpoints.map(([method,path,description])=><div key={path} className="grid gap-2 border-b border-slate-100 p-4 last:border-0 md:grid-cols-[90px_1fr_1fr] md:items-center"><span className="w-fit rounded-lg bg-slate-950 px-2.5 py-1 text-[10px] font-black text-white">{method}</span><code className="overflow-x-auto text-xs font-bold text-violet-700">{path}</code><p className="text-xs font-medium text-slate-600">{description}</p></div>)}</div><div className="mt-6 rounded-2xl bg-slate-950 p-5 text-slate-100"><p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-300">Example</p><pre className="mt-3 overflow-x-auto text-xs leading-6"><code>{`curl -H "X-AJN-API-Key: YOUR_KEY" \\\n  https://YOUR_BACKEND/api/v1/account`}</code></pre></div></section></main><MainFooter/></div>;
}
