import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { AJN_BRAND, AJN_CONFIRMED_SOCIAL_LINKS } from '@/lib/brand';
import { SITE_URL } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: { absolute: 'AJN Studio - Independent Software Products by Anjan Kumar' },
  description: 'AJN Studio is the independent product identity behind AJN PDF and related utility products built and maintained by Anjan Kumar in India.',
  alternates: { canonical: '/ajn-studio' },
  robots: { index: true, follow: true },
};

const products = [
  { name: 'AJN PDF', href: '/', text: 'Browser-first PDF editing, organization, conversion and document utility workflows.' },
  { name: 'QR AJN', href: 'https://qrajn.online', text: 'QR creation and management utilities from the AJN product family.' },
  { name: 'AJN Buzz', href: 'https://ajn.buzz', text: 'Separate image-focused utility workflows from the AJN product family.' },
];

export default function AjnStudioPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/ajn-studio#organization`,
    name: AJN_BRAND.studioName,
    url: `${SITE_URL}/ajn-studio`,
    logo: `${SITE_URL}/brand/ajn-logo-transparent.png`,
    founder: { '@id': `${SITE_URL}/developer#anjan` },
    sameAs: AJN_CONFIRMED_SOCIAL_LINKS,
  };

  return (
    <div className="ajn-page-shell">
      <Navbar />
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <section className="max-w-4xl">
          <span className="ajn-section-kicker">Independent software studio</span>
          <h1 className="mt-6 text-4xl font-black tracking-[-.05em] text-foreground md:text-6xl">AJN Studio</h1>
          <p className="mt-6 text-base font-medium leading-8 text-muted-foreground md:text-lg">
            AJN Studio is the product identity used for independent software tools built and maintained by Anjan Kumar in India. AJN PDF is the lead document product in this ecosystem.
          </p>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-3">
          {products.map((product) => {
            const external = product.href.startsWith('http');
            const className = 'ajn-theme-surface rounded-3xl p-7 transition hover:-translate-y-0.5';
            return external ? (
              <a key={product.name} href={product.href} target="_blank" rel="noreferrer" className={className}>
                <h2 className="text-2xl font-black text-foreground">{product.name}</h2>
                <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground">{product.text}</p>
              </a>
            ) : (
              <Link key={product.name} href={product.href} className={className}>
                <h2 className="text-2xl font-black text-foreground">{product.name}</h2>
                <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground">{product.text}</p>
              </Link>
            );
          })}
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black text-foreground">Product principles</h2>
            <ul className="mt-5 space-y-3 text-sm font-medium leading-7 text-muted-foreground">
              <li>Build focused utilities around clear user jobs instead of inflated feature claims.</li>
              <li>Explain browser-local and server-assisted processing separately.</li>
              <li>Publish limitations, status information and policy links where users can verify them.</li>
              <li>Prefer useful, accessible interfaces over fabricated social proof.</li>
            </ul>
          </article>
          <article className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black text-foreground">AJN PDF accountability</h2>
            <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground">
              AJN PDF is independently developed and maintained by Anjan Kumar under AJN Studio. The Trust Center and Changelog provide public context about processing behavior, current capabilities and important changes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/developer" className="ajn-secondary-button">Developer</Link>
              <Link href="/trust" className="ajn-secondary-button">Trust Center</Link>
              <Link href="/changelog" className="ajn-secondary-button">Changelog</Link>
            </div>
          </article>
        </section>
      </main>
      <MainFooter />
    </div>
  );
}
