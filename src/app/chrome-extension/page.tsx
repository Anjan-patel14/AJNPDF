import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Download, ImageDown, Puzzle, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { BUILD_PUBLIC_TOOLS } from '@/lib/build-public-tools';
import { SITE_URL } from '@/lib/seo-config';

const DOWNLOAD_PATH = '/downloads/AJN-PDF-CHROME-EXTENSION-1.0.0.zip';

export const metadata: Metadata = {
  title: 'AJN PDF Chrome Extension — Quick Image Tools & 100+ Workflows',
  description: 'Use four local image quick actions and search 100+ AJN PDF workflows from Chrome without page or browsing-history access.',
  alternates: { canonical: '/chrome-extension' },
  openGraph: {
    title: 'AJN PDF Chrome Extension',
    description: 'Local image quick actions plus fast access to 100+ AJN PDF workflows.',
    url: '/chrome-extension',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'AJN PDF Chrome extension and file tools' }],
  },
};

const quickTools = [
  ['Image to PDF', 'Combine multiple browser-supported images into one PDF directly in the extension.', ImageDown],
  ['Reduce Image', 'Create a smaller JPG or WEBP copy with a quality level you choose.', Sparkles],
  ['Resize Image', 'Change image width while preserving its aspect ratio.', ImageDown],
  ['Convert Image', 'Convert a selected image to JPG, PNG or WEBP.', ArrowRight]] as const;

export default function ChromeExtensionPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AJN PDF Quick Tools',
    applicationCategory: 'BrowserApplication',
    operatingSystem: 'Google Chrome',
    url: `${SITE_URL}/chrome-extension`,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: 'Chrome extension with local image quick actions and search across AJN PDF workflows.',
  };

  return (
    <div className="ajn-page-shell min-h-screen bg-white">
      <Navbar />
      <main className="pt-[64px] md:pt-[72px]">
        <section className="mx-auto max-w-7xl px-4 pb-14 pt-14 text-center md:px-8 md:pb-20 md:pt-24">
          <div className="ajn-white-icon-tile mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] text-blue-600"><Puzzle className="h-8 w-8" /></div>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[.14em] text-blue-600">AJN PDF for Chrome</p>
          <h1 className="mx-auto mt-3 max-w-5xl text-4xl font-black tracking-[-.055em] text-slate-950 md:text-6xl">Work smarter from Chrome.</h1>
          <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-8 text-slate-600 md:text-lg">Four useful image actions run directly inside the extension, while fast search puts {BUILD_PUBLIC_TOOLS.length} AJN PDF workflows one click away.</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={DOWNLOAD_PATH} download className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white transition hover:bg-blue-700"><Download className="h-4 w-4" />Download test package</a>
            <Link href="/pdf-tools" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-800 hover:border-blue-200 hover:text-blue-700">Open all tools<ArrowRight className="h-4 w-4" /></Link>
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-[11px] font-semibold leading-5 text-slate-500">The downloadable package is for local testing. Publish the included store-ready ZIP through the Chrome Web Store before offering one-click installation to the public.</p>
        </section>

        <section className="border-y border-slate-200 bg-slate-50/70">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-3 md:px-8">
            <div className="rounded-[18px] border border-slate-200 bg-white p-5"><ShieldCheck className="h-5 w-5 text-emerald-600" /><h2 className="mt-3 text-sm font-black text-slate-950">No page-reading permission</h2><p className="mt-2 text-xs font-medium leading-6 text-slate-600">The extension manifest requests no page, browsing-history, tab-content or host permissions.</p></div>
            <div className="rounded-[18px] border border-slate-200 bg-white p-5"><Search className="h-5 w-5 text-blue-600" /><h2 className="mt-3 text-sm font-black text-slate-950">Search {BUILD_PUBLIC_TOOLS.length} workflows</h2><p className="mt-2 text-xs font-medium leading-6 text-slate-600">Find PDF, conversion, image, edit and security workflows without scrolling through the full catalog.</p></div>
            <div className="rounded-[18px] border border-slate-200 bg-white p-5"><ImageDown className="h-5 w-5 text-violet-600" /><h2 className="mt-3 text-sm font-black text-slate-950">Real local quick actions</h2><p className="mt-2 text-xs font-medium leading-6 text-slate-600">Image to PDF, reduce image, resize image and image conversion are implemented inside extension pages instead of being link-only shortcuts.</p></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
          <div className="max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[.13em] text-blue-600">Quick actions</p><h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-slate-950 md:text-4xl">Useful before you even open the website.</h2><p className="mt-4 text-sm font-medium leading-7 text-slate-600">The first version deliberately keeps permissions narrow and the workflow easy to review.</p></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{quickTools.map(([title,desc,Icon])=><div key={title} className="rounded-[18px] border border-slate-200 bg-white p-5"><div className="ajn-white-icon-tile flex h-10 w-10 items-center justify-center rounded-xl text-blue-600"><Icon className="h-5 w-5" /></div><h3 className="mt-4 text-sm font-black text-slate-950">{title}</h3><p className="mt-2 text-xs font-medium leading-6 text-slate-600">{desc}</p></div>)}</div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20 md:px-8">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-6 md:p-8">
            <p className="text-[10px] font-black uppercase tracking-[.13em] text-slate-500">Local testing</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-slate-950">Install the test build in four steps.</h2>
            <ol className="mt-6 grid gap-3 text-sm font-semibold leading-6 text-slate-700 md:grid-cols-2">
              <li className="rounded-xl bg-white p-4 ring-1 ring-slate-200">1. Download and unzip the extension package.</li>
              <li className="rounded-xl bg-white p-4 ring-1 ring-slate-200">2. Open <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">chrome://extensions</code>.</li>
              <li className="rounded-xl bg-white p-4 ring-1 ring-slate-200">3. Turn on Developer mode and choose Load unpacked.</li>
              <li className="rounded-xl bg-white p-4 ring-1 ring-slate-200">4. Select the extracted folder that contains <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">manifest.json</code>.</li>
            </ol>
            <div className="mt-6 flex flex-wrap gap-3"><Link href="/chrome-extension/privacy" className="text-xs font-black text-blue-700 hover:underline">Extension privacy →</Link><Link href="/privacy" className="text-xs font-black text-slate-600 hover:text-blue-700">Website privacy →</Link></div>
          </div>
        </section>
      </main>
      <MainFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
