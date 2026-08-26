import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { GuideLibrary } from '@/components/discover/guide-library';

export const metadata: Metadata = {
  title: 'AJN PDF Guides - PDF, Conversion & Security',
  description:
    'Browse practical AJN PDF guides for core PDF workflows, document conversion,  and scans, image tools, security, limits and troubleshooting.',
  alternates: { canonical: '/discover/guides' },
};

export default function DiscoverGuidesPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <section className="max-w-4xl">
          <Link href="/discover" className="inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-900">
            <ArrowLeft className="h-4 w-4" /> Back to AJN Discover
          </Link>
          <span className="ajn-section-kicker mt-6">AJN Discover guides</span>
          <h1 className="mt-5 text-4xl font-black tracking-[-.045em] md:text-7xl">
            Practical guides for real document workflows.
          </h1>
          <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-slate-600 md:text-lg">
            Start with the task you need, understand the processing model and limitations, then continue directly to the relevant AJN PDF tool.
          </p>
        </section>

        <div className="mt-12">
          <GuideLibrary />
        </div>
      </main>
      <MainFooter />
    </div>
  );
}
