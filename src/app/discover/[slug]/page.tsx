import { RuntimeImage } from '@/components/ui/runtime-image';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { MediaAnalytics } from '@/components/media/media-analytics';
import { ShareMediaButton } from '@/components/media/share-media-button';
import { fetchPublicMediaPost } from '@/lib/public-media';
import { SITE_URL } from '@/lib/seo-config';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPublicMediaPost(slug);
  if (!post) return { title: 'Image not found', robots: { index: false, follow: false } };
  return {
    title: post.title,
    description: post.caption.slice(0, 158),
    alternates: { canonical: `/discover/${post.slug}` },
    openGraph: {
      type: 'article',
      url: `/discover/${post.slug}`,
      title: post.title,
      description: post.caption,
      publishedTime: post.published_at,
      authors: [`${SITE_URL}/developer`],
      images: [{ url: post.image_url, width: post.width || 1200, height: post.height || 1200, alt: post.alt_text }],
    },
    twitter: { card: 'summary_large_image', images: [post.image_url] },
  };
}

export default async function DiscoverPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchPublicMediaPost(slug);
  if (!post) notFound();
  const absoluteImage = post.image_url.startsWith('http') ? post.image_url : `${SITE_URL}${post.image_url}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: post.title,
    caption: post.caption,
    description: post.caption,
    contentUrl: absoluteImage,
    thumbnailUrl: post.thumbnail_url || absoluteImage,
    uploadDate: post.published_at,
    creator: { '@type': 'Person', name: 'Anjan Kumar', url: `${SITE_URL}/developer` },
    creditText: 'Published by AJN PDF / AJN Studio',
    copyrightNotice: 'Copyright applies. See AJN PDF image licensing information.',
    license: `${SITE_URL}/image-licensing`,
    acquireLicensePage: `${SITE_URL}/contact`,
  };

  return (
    <div className="ajn-page-shell">
      <Navbar />
      <MediaAnalytics eventName="media_open" slug={post.slug} />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Link href="/discover" className="inline-flex items-center gap-2 text-xs font-black text-blue-600"><ArrowLeft className="h-4 w-4" />Back to AJN Discover</Link>
        <article className="mt-7 overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_28px_80px_rgba(15,23,42,.10)]">
          <RuntimeImage src={post.image_url} alt={post.alt_text} width={post.width || 1200} height={post.height || 1200} className="max-h-[78vh] w-full bg-muted object-contain" />
          <div className="p-6 md:p-10">
            <h1 className="text-3xl font-black tracking-[-.035em] text-foreground md:text-5xl">{post.title}</h1>
            <p className="mt-5 text-base font-medium leading-8 text-muted-foreground">{post.caption}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold text-muted-foreground">
              <span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4" />Anjan · AJN PDF</span>
              <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2"><ShareMediaButton title={post.title} slug={post.slug} />{post.tags.map((tag) => <span key={tag} className="rounded-full border border-border bg-muted px-3 py-1.5 text-[10px] font-black uppercase tracking-[.08em] text-muted-foreground">{tag}</span>)}</div>
          </div>
        </article>
      </main>
      <MainFooter />
    </div>
  );
}
