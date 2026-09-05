import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GuideArticle } from '@/components/blog/guide-article';
import { BUILD_PUBLIC_TOOLS } from '@/lib/build-public-tools';
import { guideMetadata } from '@/lib/guide-metadata';
import { getSeoGrowthGuide, SEO_GROWTH_GUIDES } from '@/lib/seo-growth-guides';
import { toolPath } from '@/lib/tool-routes';

export const dynamicParams = false;

type GrowthGuidePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SEO_GROWTH_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GrowthGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getSeoGrowthGuide(slug);
  if (!guide) return { title: 'Guide Not Found', robots: { index: false, follow: false } };

  const base = guideMetadata(guide.slug, guide.metaTitle, guide.summary);
  return {
    ...base,
    keywords: [
      guide.primaryKeyword,
      `${guide.pillar.replace(/-/g, ' ')} online`,
      'online PDF tools',
      'AJN PDF',
    ],
  };
}

export default async function GrowthGuidePage({ params }: GrowthGuidePageProps) {
  const { slug } = await params;
  const guide = getSeoGrowthGuide(slug);
  if (!guide) notFound();

  const relatedTools = guide.related.flatMap((id) => {
    const tool = BUILD_PUBLIC_TOOLS.find((candidate) => candidate.id === id);
    return tool
      ? [{
          href: toolPath(tool.id),
          title: tool.name,
          description: tool.desc,
        }]
      : [];
  });

  return (
    <GuideArticle
      slug={guide.slug}
      eyebrow={guide.eyebrow}
      title={guide.title}
      summary={guide.summary}
      readTime={guide.readTime}
      sections={guide.sections}
      checklist={guide.checklist}
      relatedTools={relatedTools}
      datePublished="2026-09-05"
      dateModified="2026-09-05"
    />
  );
}
