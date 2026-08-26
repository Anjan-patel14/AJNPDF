import Link from 'next/link';
import { ArrowRight, ImageIcon, Search, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { PublicMediaExplorer } from '@/components/media/public-media-explorer';
import { MediaAnalytics } from '@/components/media/media-analytics';
import { fetchPublicMediaPosts } from '@/lib/public-media';
import { SITE_URL } from '@/lib/seo-config';

export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  const posts = await fetchPublicMediaPosts(48);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AJN Discover',
    url: `${SITE_URL}/discover`,
    description: 'Original AJN PDF and AJN Studio images, product updates and learning visuals.',
    creator: { '@type': 'Person', name: 'Anjan Kumar', url: `${SITE_URL}/developer` },
    hasPart: posts.slice(0, 24).map((post) => ({
      '@type': 'ImageObject',
      name: post.title,
      caption: post.caption,
      contentUrl: post.image_url.startsWith('http') ? post.image_url : `${SITE_URL}${post.image_url}`,
      url: `${SITE_URL}/discover/${post.slug}`,
      datePublished: post.published_at,
      creator: { '@type': 'Person', name: 'Anjan Kumar', url: `${SITE_URL}/developer` },
      creditText: 'Published by AJN PDF / AJN Studio',
      copyrightNotice: 'Copyright applies. See AJN PDF image licensing information.',
      license: `${SITE_URL}/image-licensing`,
      acquireLicensePage: `${SITE_URL}/contact`,
    })),
  };

  return (
    <div className="ajn-page-shell">
      <Navbar />
      <MediaAnalytics eventName="media_view" />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 md:px-8 md:pt-40">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <section className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-4xl">
            <span className="ajn-section-kicker">AJN Discover</span>
            <h1 className="mt-6 text-5xl font-black tracking-[-.055em] text-foreground md:text-7xl">Original images, product updates and useful visual guides.</h1>
            <p className="mt-6 max-w-3xl text-base font-medium leading-8 text-muted-foreground">This public feed is managed by AJN PDF. Each post uses descriptive titles, captions and alt text so people and search engines can understand the image without keyword stuffing.</p>
          </div>
          <div className="flex flex-wrap gap-2"><Link href="/image-licensing" className="ajn-secondary-button">Image licensing</Link><Link href="/developer" className="ajn-secondary-button">Meet Anjan <ArrowRight className="h-4 w-4" /></Link></div>
        </section>

        <section className="mt-10 grid gap-3 rounded-3xl border border-border bg-card/80 p-5 text-sm text-card-foreground sm:grid-cols-3">
          <div className="flex items-start gap-3"><ImageIcon className="mt-0.5 h-5 w-5 text-blue-600" /><div><p className="font-black">Original AJN media</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Only controlled AJN assets and admin-published posts.</p></div></div>
          <div className="flex items-start gap-3"><Search className="mt-0.5 h-5 w-5 text-emerald-600" /><div><p className="font-black">Search-friendly context</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Relevant filenames, captions, alt text and image sitemap entries.</p></div></div>
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-red-600" /><div><p className="font-black">Admin controlled</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Publishing and deletion require the private admin token.</p></div></div>
        </section>

        <section className="mt-12">
          <PublicMediaExplorer posts={posts} />
        </section>
      </main>
      <MainFooter />
    </div>
  );
}
