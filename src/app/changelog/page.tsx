import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { SITE_URL } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: { absolute: 'AJN PDF Changelog - Product Updates & Releases' },
  description: 'Follow verified AJN PDF product updates, PDF Editor improvements, public tool changes and reliability work.',
  alternates: { canonical: '/changelog' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: '/changelog',
    title: 'AJN PDF Changelog - Product Updates & Releases',
    description: 'A factual public record of important AJN PDF product updates.',
  },
};

const changelogJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${SITE_URL}/changelog#page`,
  url: `${SITE_URL}/changelog`,
  name: 'AJN PDF Changelog',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  publisher: { '@id': `${SITE_URL}/ajn-studio#organization` },
  dateModified: '2026-09-05',
};

export default function ChangelogPage() {
  return (
    <div className="ajn-page-shell">
      <Navbar />
      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(changelogJsonLd) }} />
        <section className="max-w-3xl">
          <span className="ajn-section-kicker">Product updates</span>
          <h1 className="mt-6 text-4xl font-black tracking-[-.05em] text-foreground md:text-6xl">AJN PDF Changelog</h1>
          <p className="mt-6 text-base font-medium leading-8 text-muted-foreground md:text-lg">
            A factual public record of meaningful AJN PDF changes. Entries describe shipped product work without invented usage numbers, ratings or release claims.
          </p>
        </section>

        <article className="ajn-theme-surface mt-12 rounded-[2rem] p-7 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[.12em] text-blue-600">September 2026</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-foreground">Professional browser PDF Editor and SEO foundation</h2>
            </div>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">Current</span>
          </div>
          <ul className="mt-7 space-y-4 text-sm font-medium leading-7 text-muted-foreground">
            <li><strong className="text-foreground">PDF Editor:</strong> promoted the browser editor as a primary AJN PDF workflow for visible text changes, images, signatures, page work and live preview.</li>
            <li><strong className="text-foreground">Font matching:</strong> improved best-effort visual font-family and text-width matching while keeping exact-font limitations explicit.</li>
            <li><strong className="text-foreground">Public catalog:</strong> aligned public navigation and SEO around 26 PDF tools.</li>
            <li><strong className="text-foreground">Image-to-PDF:</strong> kept JPG, JPEG, PNG and WebP conversion workflows browser-local with ordering, rotation and page controls.</li>
            <li><strong className="text-foreground">Trust and SEO:</strong> added clearer entity relationships, processing disclosures, internal links, Trust Center and public changelog coverage.</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/edit-pdf" className="ajn-primary-button">Open PDF Editor</Link>
            <Link href="/trust" className="ajn-secondary-button">Trust Center</Link>
            <Link href="/pdf-tools" className="ajn-secondary-button">All PDF tools</Link>
          </div>
        </article>

        <section className="mt-10 rounded-3xl border border-black/5 bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-black text-foreground">Release policy</h2>
          <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground">
            Changelog entries are added when user-visible capabilities, processing behavior, trust information or important reliability work changes. Minor internal refactors do not need a public entry.
          </p>
        </section>
      </main>
      <MainFooter />
    </div>
  );
}
