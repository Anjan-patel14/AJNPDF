import type { Metadata } from 'next';
import { AJN_BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: { absolute: 'Anjan — Developer of AJN PDF' },
  description: 'Meet Anjan, developer of AJN PDF and AJN Studio, and learn about the product approach behind its PDF, image and document tools.',
  alternates: { canonical: '/developer' },
  openGraph: {
    type: 'profile',
    url: '/developer',
    title: 'Anjan — Developer of AJN PDF',
    description: AJN_BRAND.developerBio,
    images: [{ url: AJN_BRAND.developerOgImage, width: 1200, height: 630, alt: 'Anjan, developer of AJN PDF' }],
  },
  twitter: { card: 'summary_large_image', images: [AJN_BRAND.developerOgImage] },
};

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return children;
}
