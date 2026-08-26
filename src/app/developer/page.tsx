import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Code2, FileSearch, Globe2, Instagram, Layers3, Mail, ShieldCheck, Youtube } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { AJN_BRAND } from '@/lib/brand';
import { SITE_URL } from '@/lib/seo-config';

const focusAreas = [
  { icon: FileSearch, title: 'Useful document workflows', text: 'PDF, image and office-file tools built around clear inputs, limits and downloadable results.' },
  { icon: ShieldCheck, title: 'Honest processing', text: 'On-device and online workflows are labelled so users understand how each file is handled.' },
  { icon: Layers3, title: 'Accessible product design', text: 'Responsive layouts, light and dark themes, keyboard states and reduced-motion support are part of the product system.' }];

export default function DeveloperPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      '@id': `${SITE_URL}/developer#anjan`,
      name: AJN_BRAND.developerName,
      alternateName: AJN_BRAND.developerDisplayName,
      image: `${SITE_URL}${AJN_BRAND.developerImageJpeg}`,
      jobTitle: AJN_BRAND.developerRole,
      description: AJN_BRAND.developerBio,
      url: `${SITE_URL}/developer`,
      worksFor: { '@type': 'Organization', name: AJN_BRAND.studioName, url: `${SITE_URL}/ajn-studio` },
      knowsAbout: ['Next.js', 'React', 'TypeScript', 'Python FastAPI', 'PDF tools', '', 'document conversion', 'web development', 'product design'],
      sameAs: Object.values(AJN_BRAND.social),
    },
  };

  return (
    <div className="ajn-page-shell">
      <Navbar />
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <section className="grid items-center gap-10 lg:grid-cols-[.88fr_1.12fr] lg:gap-16">
          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="ajn-profile-frame">
              <Image
                src={AJN_BRAND.developerImage}
                alt="Anjan, developer of AJN PDF"
                width={1200}
                height={1200}
                priority
                sizes="(max-width: 1024px) 88vw, 520px"
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="ajn-profile-badge"><Code2 className="h-5 w-5" /><span>Developer profile</span></div>
          </div>

          <div>
            <span className="ajn-section-kicker">Developer of AJN PDF</span>
            <h1 className="mt-6 text-[clamp(3.3rem,8vw,7rem)] font-black leading-[.88] tracking-[-.065em] text-foreground">ANJAN</h1>
            <p className="mt-5 text-xl font-black text-blue-600">Building AJN PDF and AJN Studio from India.</p>
            <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-muted-foreground md:text-lg">{AJN_BRAND.developerBio}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/pdf-tools" className="ajn-primary-button">Explore AJN PDF <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/discover" className="ajn-secondary-button">Public image feed</Link>
              <Link href="/ajn-studio" className="ajn-secondary-button">About AJN Studio</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-2" aria-label="Anjan public links">
              <a className="ajn-icon-link" href={AJN_BRAND.social.instagram} target="_blank" rel="me noreferrer" aria-label="Anjan Kumar on Instagram"><Instagram className="h-4 w-4" /></a>
              <a className="ajn-icon-link" href={AJN_BRAND.social.youtube} target="_blank" rel="me noreferrer" aria-label="Anjan Kumar on YouTube"><Youtube className="h-4 w-4" /></a>
              <a className="ajn-icon-link" href={`mailto:${AJN_BRAND.contactEmail}`} aria-label="Email Anjan Kumar"><Mail className="h-4 w-4" /></a>
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-5 lg:grid-cols-3">
          {focusAreas.map(({ icon: Icon, title, text }) => (
            <article key={title} className="ajn-theme-surface rounded-3xl p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white"><Icon className="h-5 w-5" /></span>
              <h2 className="mt-6 text-xl font-black text-foreground">{title}</h2>
              <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground">{text}</p>
            </article>
          ))}
        </section>

        <section className="ajn-theme-surface mt-20 rounded-[2rem] p-7 md:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <span className="ajn-section-kicker">Public identity</span>
              <h2 className="mt-5 text-3xl font-black tracking-[-.04em] text-foreground md:text-5xl">AJN, AJN PDF and AJN Studio—one connected product identity.</h2>
              <p className="mt-5 max-w-3xl text-sm font-medium leading-7 text-muted-foreground">The developer page, product pages, guides and public image feed use consistent authorship and structured data. Search engines still decide how and when those pages appear; the website does not promise a particular ranking.</p>
            </div>
            <Globe2 className="h-20 w-20 text-blue-600/25" />
          </div>
        </section>
      </main>
      <MainFooter />
    </div>
  );
}
