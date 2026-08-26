import type { Metadata } from 'next';
import Script from 'next/script';
import { CategoryDirectory } from '@/components/landing/category-directory';
import { SITE_URL } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'Free Image Converter & Image to PDF Tools',
  description: 'Convert JPG, PNG, WEBP, TIFF, BMP, GIF, SVG and HEIC files; export PDF pages as images.',
  alternates: { canonical: '/image-tools' },
  keywords: ['image converter online', 'image to PDF', 'PDF to image', 'JPG to PDF'],
  openGraph: { title: 'Free Image Converter & Image to PDF Tools | AJN PDF', description: 'Image conversion, PDF export and scan preparation tools.', url: '/image-tools', images: ['/og-image.jpg'] },
};

export default function Page() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AJN PDF image tools',
    url: `${SITE_URL}/image-tools`,
    description: metadata.description,
    isPartOf: { '@type': 'WebSite', name: 'AJN PDF', url: SITE_URL },
  };
  return <><Script id="image-category-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><CategoryDirectory category="image" /></>;
}
