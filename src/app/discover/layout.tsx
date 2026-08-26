import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AJN Discover — Original Images and Product Updates',
  description: 'Explore original AJN PDF and AJN Studio images, product updates, learning visuals and developer posts.',
  alternates: { canonical: '/discover' },
  openGraph: { title: 'AJN Discover', description: 'Original images and product updates from AJN PDF and AJN Studio.', url: '/discover', type: 'website' },
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) { return children; }
