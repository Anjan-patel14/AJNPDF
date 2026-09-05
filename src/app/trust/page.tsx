import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { SITE_URL } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: { absolute: 'AJN PDF Trust Center - File Processing, Privacy & Security' },
  description: 'Understand how AJN PDF handles files, which tools run locally in the browser, which workflows use a server, and the limits users should know before processing documents.',
  alternates: { canonical: '/trust' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: '/trust',
    title: 'AJN PDF Trust Center - File Processing, Privacy & Security',
    description: 'Clear information about AJN PDF browser processing, server-assisted workflows, editor limitations and public trust policies.',
  },
};

const browserLocalTools = [
  'Add Image to PDF', 'Add Text', 'Compare PDF', 'Compress PDF', 'Crop PDF', 'Delete PDF Pages',
  'Edit PDF', 'Extract Images', 'Flatten PDF', 'Image to PDF', 'JPEG to PDF', 'JPG to PDF',
  'Merge PDF', 'Organize PDF', 'Page Number', 'PDF Metadata', 'PDF ZIP Extract', 'PNG to PDF',
  'Rotate PDF', 'Sign PDF', 'Split PDF', 'Watermark PDF', 'WebP to PDF',
];

const serverAssistedTools = ['Protect PDF', 'Unlock PDF', 'Repair PDF'];

const trustJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${SITE_URL}/trust#page`,
  url: `${SITE_URL}/trust`,
  name: 'AJN PDF Trust Center',
  description: 'AJN PDF file-processing, privacy, security and product-limit information.',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  publisher: { '@id': `${SITE_URL}/ajn-studio#organization` },
};

export default function TrustPage() {
  return (
    <div className="ajn-page-shell">
      <Navbar />
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trustJsonLd) }} />

        <section className="max-w-4xl">
          <span className="ajn-section-kicker">AJN PDF Trust Center</span>
          <h1 className="mt-6 text-4xl font-black tracking-[-.05em] text-foreground md:text-6xl">
            Clear file handling. Clear product limits.
          </h1>
          <p className="mt-6 text-base font-medium leading-8 text-muted-foreground md:text-lg">
            AJN PDF has 26 public PDF workflows. Twenty-three are designed to process files locally in the browser. Three security workflows are server-assisted because their processing requires the backend service.
          </p>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="ajn-theme-surface rounded-3xl p-7 md:p-8">
            <p className="text-xs font-black uppercase tracking-[.12em] text-blue-600">23 browser-local public workflows</p>
            <h2 className="mt-4 text-2xl font-black text-foreground">Files stay in the browser processing path</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground">
              These public workflows are designed to perform their main PDF processing on the user&apos;s device. They do not need the document sent to AJN PDF&apos;s processing backend for the core operation.
            </p>
            <ul className="mt-6 grid gap-2 text-sm font-bold text-foreground sm:grid-cols-2">
              {browserLocalTools.map((name) => <li key={name} className="rounded-xl bg-slate-50 px-3 py-2">{name}</li>)}
            </ul>
          </article>

          <article className="ajn-theme-surface rounded-3xl p-7 md:p-8">
            <p className="text-xs font-black uppercase tracking-[.12em] text-amber-600">3 server-assisted public workflows</p>
            <h2 className="mt-4 text-2xl font-black text-foreground">Backend service required</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground">
              Protect PDF, Unlock PDF and Repair PDF use AJN PDF&apos;s server-assisted processing path. Availability can change, so users should check the live Status page before relying on these workflows.
            </p>
            <ul className="mt-6 grid gap-2 text-sm font-bold text-foreground">
              {serverAssistedTools.map((name) => <li key={name} className="rounded-xl bg-amber-50 px-3 py-2">{name}</li>)}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/status" className="ajn-primary-button">View live status</Link>
              <Link href="/file-processing-policy" className="ajn-secondary-button">File Processing Policy</Link>
            </div>
          </article>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black text-foreground">PDF Editor limits</h2>
            <ul className="mt-5 space-y-3 text-sm font-medium leading-7 text-muted-foreground">
              <li>Smart text replacement is a visual editing workflow; it is not a guarantee of Word-style native rewriting for every PDF.</li>
              <li>Font matching is best effort. Exact embedded or proprietary font reuse is not guaranteed.</li>
              <li>Whiteout visually covers content. It is not secure redaction and should not be used to remove sensitive information.</li>
              <li>Scanned pages are not automatically converted into editable text by the current public editor; manual editing may be required.</li>
            </ul>
          </article>

          <article className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black text-foreground">Privacy and security references</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground">
              Browser-local processing, server-assisted processing, account data and legal terms are documented separately so the website does not make one blanket claim for every workflow.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link className="ajn-secondary-button justify-center" href="/privacy">Privacy Policy</Link>
              <Link className="ajn-secondary-button justify-center" href="/security">Security</Link>
              <Link className="ajn-secondary-button justify-center" href="/transparency">Transparency</Link>
              <Link className="ajn-secondary-button justify-center" href="/terms">Terms</Link>
            </div>
          </article>
        </section>

        <section className="mt-12 rounded-3xl border border-blue-100 bg-blue-50 p-7 md:p-9">
          <h2 className="text-2xl font-black text-foreground">Independent development, public accountability</h2>
          <p className="mt-4 max-w-4xl text-sm font-medium leading-7 text-muted-foreground">
            AJN PDF is independently developed and maintained by Anjan Kumar under AJN Studio. Product pages, policies, status information and the public changelog are intended to make current capabilities and limitations easy to verify.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/developer" className="ajn-secondary-button">Developer</Link>
            <Link href="/ajn-studio" className="ajn-secondary-button">AJN Studio</Link>
            <Link href="/changelog" className="ajn-secondary-button">Changelog</Link>
          </div>
        </section>
      </main>
      <MainFooter />
    </div>
  );
}
