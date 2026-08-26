import type { Metadata } from 'next';
import Script from 'next/script';
import { CategoryDirectory } from '@/components/landing/category-directory';
import { SITE_URL } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'Free Online PDF Editor, Security & Utility Tools',
  description: 'Merge, split, compress, organize, crop, rotate, protect, unlock and repair PDFs with practical controls and clearly stated limitations.',
  alternates: { canonical: '/pdf-utilities' },
  keywords: ['PDF tools online', 'PDF editor online', 'merge PDF', 'compress PDF', 'protect PDF'],
  openGraph: { title: 'Free Online PDF Editor & Utility Tools | AJN PDF', description: 'PDF editing, organization, security and recovery workflows.', url: '/pdf-utilities', images: ['/og-image.jpg'] },
};

export default function Page() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AJN PDF editing and utility tools',
    url: `${SITE_URL}/pdf-utilities`,
    description: metadata.description,
    isPartOf: { '@type': 'WebSite', name: 'AJN PDF', url: SITE_URL },
  };
  return <><Script id="pdf-category-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><CategoryDirectory category="pdf" /></>;
}
