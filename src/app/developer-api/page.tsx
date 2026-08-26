import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Braces, FileKey2, FileSignature, ScanText, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';

export const metadata: Metadata = {
  title: 'Developer API | AJN PDF',
  description: 'AJN PDF API v1 documentation for conversion,  analysis and evidence-backed electronic signatures.',
};

const endpoints = [
  ['GET', '/api/v1/account', 'Inspect the authenticated key id, scopes and rate limit.'],
  ['GET', '/api/v1/capabilities', 'Discover live conversion tools, exact required scopes, and deeper /signing capabilities.'],
  ['POST', '/api/v1/convert/{tool_id}', 'Run a live AJN PDF conversion. Normal tools require convert; -backed tool IDs require convert + .'],
  ['POST', '/api/v1//text', ' a PDF or image into text with language, DPI and PDF page-range controls. Requires .'],
  ['POST', '/api/v1//searchable-pdf', 'Create a searchable PDF with an  text layer. Requires .'],
  ['POST', '/api/v1//analyze', 'Return page text, line groups, word confidence, bounding boxes and orientation/script data. Requires .'],
  ['POST', '/api/v1/sign/electronic', 'Create an evidence-backed electronic-signature ZIP package. Requires sign.']] as const;

const featureCards: { icon: LucideIcon; title: string; copy: string }[] = [
  { icon: FileKey2, title: 'Scoped API keys', copy: 'read · convert ·  · sign' },
  { icon: ScanText, title: 'Deep ', copy: '6 languages · combined language models · layout JSON' },
  { icon: FileSignature, title: 'Electronic signature', copy: 'Consent · evidence id · hashes · embedded manifest' },
  { icon: ShieldCheck, title: 'Production guards', copy: 'Worker isolation · limits · timeouts · validation' }];

const curl = `curl -X POST "$AJN_API_BASE/api/v1//text" \\
  -H "X-AJN-API-Key: $AJN_API_KEY" \\
  -F "file=@scan.pdf" \\
  -F "language=eng+tel" \\
  -F "dpi=240" \\
  -F "pages=1-3" \\
  -o recognized.txt`;

const signCurl = `curl -X POST "$AJN_API_BASE/api/v1/sign/electronic" \\
  -H "X-AJN-API-Key: $AJN_API_KEY" \\
  -F "pdf=@agreement.pdf" \\
  -F "signature=@signature.png" \\
  -F "signer_name=Example Signer" \\
  -F "signer_email=signer@example.com" \\
  -F "consented=true" \\
  -F "page=1" -F "x=72" -F "y=72" \\
  -o signed-package.zip`;

export default function DeveloperApiPage() {
  return (
    <div className="ajn-page-shell">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(30,62,130,.08)] sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700"><Braces className="h-4 w-4" />AJN PDF API v1</div>
              <h1 className="mt-5 text-4xl font-black tracking-[-.04em] text-slate-950 sm:text-6xl">Build document workflows on the same AJN PDF engine.</h1>
              <p className="mt-5 text-base font-medium leading-8 text-slate-600">The public API reuses AJN PDF&apos;s validated conversion worker, multilingual  and electronic-signature evidence engine. API access is fail-closed and uses scoped keys.</p>
            </div>
            <Link href="/integrations" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 hover:border-blue-300">Cloud integrations</Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {featureCards.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <Icon className="h-5 w-5 text-blue-600" />
              <h2 className="mt-3 font-black text-slate-950">{title}</h2>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-500">{copy}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">Authentication</h2>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600">Send the plaintext secret only in the <code className="rounded bg-slate-100 px-1.5 py-0.5">X-AJN-API-Key</code> header over HTTPS. AJN PDF deployment configuration stores only the SHA-256 digest. Keys can have separate scopes and per-minute limits. Generic non- conversion needs <code className="rounded bg-slate-100 px-1.5 py-0.5">convert</code>; -backed tool IDs on the generic conversion route require both <code className="rounded bg-slate-100 px-1.5 py-0.5">convert</code> and <code className="rounded bg-slate-100 px-1.5 py-0.5"></code>.</p>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-6 text-amber-950">Do not place API secrets in browser JavaScript, GitHub, Vercel public environment variables, screenshots, or support messages. Generate a key locally and inject the hashed configuration into the backend secret environment.</div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-6 sm:p-8"><h2 className="text-2xl font-black text-slate-950">Endpoints</h2></div>
          <div className="divide-y divide-slate-100">{endpoints.map(([method,path,description]) => <div key={path} className="grid gap-3 p-5 sm:grid-cols-[80px_1fr_1.5fr] sm:items-center sm:px-8"><span className="w-fit rounded-lg bg-slate-950 px-2.5 py-1 text-[10px] font-black text-white">{method}</span><code className="break-all text-xs font-bold text-blue-700">{path}</code><p className="text-xs font-semibold leading-6 text-slate-500">{description}</p></div>)}</div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-slate-100"><h2 className="font-black"> example</h2><pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-slate-300">{curl}</pre></div>
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-slate-100"><h2 className="font-black">Electronic signature example</h2><pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-slate-300">{signCurl}</pre></div>
        </section>

        <section className="mt-8 rounded-3xl border border-violet-200 bg-violet-50 p-6 sm:p-8">
          <h2 className="text-xl font-black text-violet-950">Signature trust level</h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-violet-900">The R16 signing endpoint creates an evidence-backed <strong>electronic signature</strong>: visual mark, signer identity, explicit consent, intent, evidence ID, SHA-256 hashes and embedded evidence. It does not claim a certificate-backed PAdES digital signature, CA trust, Aadhaar eSign, or government identity verification.</p>
        </section>
      </main>
      <MainFooter />
    </div>
  );
}
