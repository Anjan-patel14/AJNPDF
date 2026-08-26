import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, Copyright, Mail, ShieldCheck } from 'lucide-react';
import { MainFooter } from '@/components/landing/main-footer';
import { Navbar } from '@/components/landing/navbar';
import { AJN_BRAND } from '@/lib/brand';
import { SITE_URL } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'Image Licensing | AJN PDF',
  description: 'Copyright, attribution and licensing information for images published through AJN Discover.',
  alternates: { canonical: '/image-licensing' },
};

export default function ImageLicensingPage() {
  return (
    <div className="ajn-page-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
        <Link href="/discover" className="inline-flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to AJN Discover</Link>
        <span className="ajn-section-kicker mt-8 inline-flex">Image licensing</span>
        <h1 className="mt-5 text-4xl font-black tracking-[-.045em] text-foreground md:text-6xl">Clear rights, attribution and licensing information.</h1>
        <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-muted-foreground">Images published in AJN Discover are admin-controlled and require a rights confirmation before publication. Unless an individual post states otherwise, publication on AJN PDF does not grant visitors a licence to copy, redistribute or commercially reuse the image.</p>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="ajn-theme-surface rounded-[2rem] p-6"><Copyright className="h-6 w-6 text-blue-600" /><h2 className="mt-5 text-lg font-black text-foreground">Copyright</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Copyright remains with the applicable rights holder. AJN PDF only publishes media that an administrator confirms AJN owns or has permission to publish.</p></div>
          <div className="ajn-theme-surface rounded-[2rem] p-6"><BadgeCheck className="h-6 w-6 text-emerald-600" /><h2 className="mt-5 text-lg font-black text-foreground">Attribution</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Search metadata identifies AJN PDF / AJN Studio as the publishing credit. A post can provide additional context in its title, caption and visible page content.</p></div>
          <div className="ajn-theme-surface rounded-[2rem] p-6"><ShieldCheck className="h-6 w-6 text-red-600" /><h2 className="mt-5 text-lg font-black text-foreground">No automatic reuse licence</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Do not assume an image is Creative Commons, public domain or commercially reusable unless that permission is explicitly stated.</p></div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-blue-200 bg-blue-50/70 p-7 text-blue-950 md:p-9">
          <div className="flex items-start gap-4"><Mail className="mt-1 h-6 w-6 shrink-0" /><div><h2 className="text-xl font-black">Request permission or licensing information</h2><p className="mt-3 text-sm leading-7">For a specific AJN Discover image, include the public image URL and intended use. AJN PDF will confirm whether permission can be granted or whether another rights holder must be contacted.</p><a className="ajn-primary-button mt-6" href={`mailto:${AJN_BRAND.contactEmail}?subject=${encodeURIComponent('AJN PDF Image Licensing Request')}`}>Contact AJN PDF</a></div></div>
        </section>

        <p className="mt-8 text-xs font-medium leading-6 text-muted-foreground">Structured image metadata uses this page as the licensing-information URL and the AJN PDF contact route as the acquisition/contact path. See also the <Link href="/copyright" className="font-black text-foreground underline underline-offset-4">Copyright Policy</Link>. Canonical licensing URL: {SITE_URL}/image-licensing.</p>
      </main>
      <MainFooter />
    </div>
  );
}
