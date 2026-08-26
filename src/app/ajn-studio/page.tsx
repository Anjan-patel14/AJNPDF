import Link from 'next/link';
import { ArrowRight, ImageIcon, Search, Sparkles, Wrench } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { SITE_URL } from '@/lib/seo-config';
import { AJN_BRAND, AJN_STUDIO_ALTERNATE_NAMES } from '@/lib/brand';

const products = [
  { icon: Wrench, title: 'AJN PDF', text: 'PDF, image and document conversion tools with clear processing labels.', href: '/pdf-tools' },
  { icon: ImageIcon, title: 'AJN Discover', text: 'A public image feed for original AJN product updates, visuals and learning posts.', href: '/discover' },
  { icon: Search, title: 'AJN content system', text: 'Useful guides, structured data and internal links that help users discover the right workflow.', href: '/blog' }];

export default function AjnStudioPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/ajn-studio#organization`,
    name: AJN_BRAND.studioName,
    alternateName: AJN_STUDIO_ALTERNATE_NAMES,
    url: `${SITE_URL}/ajn-studio`,
    logo: `${SITE_URL}/logo.jpeg`,
    founder: { '@id': `${SITE_URL}/developer#anjan` },
    brand: { '@type': 'Brand', '@id': `${SITE_URL}/#brand`, name: AJN_BRAND.productName, url: SITE_URL },
  };

  return (
    <div className="ajn-page-shell">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 md:px-8 md:pt-40">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <section className="mx-auto max-w-4xl text-center">
          <span className="ajn-section-kicker">AJN Studio</span>
          <h1 className="mt-6 text-5xl font-black tracking-[-.06em] text-foreground md:text-8xl">Practical digital products under one AJN identity.</h1>
          <p className="mx-auto mt-6 max-w-3xl text-base font-medium leading-8 text-muted-foreground md:text-lg">AJN Studio is the product identity behind AJN PDF. It connects useful tools, original educational content and public product updates without creating fake popularity or ranking claims.</p>
        </section>
        <section className="mt-16 grid gap-5 lg:grid-cols-3">
          {products.map(({ icon: Icon, title, text, href }, index) => (
            <Link key={title} href={href} className="ajn-category-card group block">
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-emerald-600' : 'bg-red-600'}`}><Icon className="h-5 w-5" /></span>
              <h2 className="mt-6 text-2xl font-black text-foreground">{title}</h2>
              <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground">{text}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-xs font-black text-blue-600">Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </section>
        <section className="mt-16 rounded-[2rem] bg-slate-950 p-8 text-white md:p-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div><Sparkles className="h-7 w-7 text-blue-300" /><h2 className="mt-5 text-3xl font-black md:text-5xl">Built by Anjan.</h2><p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-300">See the developer profile, product approach and public links connected to AJN PDF.</p></div>
            <Link href="/developer" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-xs font-black text-slate-950">Developer profile <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
      <MainFooter />
    </div>
  );
}
