import type { Metadata } from 'next';

export function guideMetadata(slug: string, title: string, description: string): Metadata {
  const canonical = `/blog/${slug}`;
  return {
    title: `${title} | AJN PDF`,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: `${title} | AJN PDF`,
      description,
      url: canonical,
      siteName: 'AJN PDF',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | AJN PDF`,
      description,
    },
  };
}
