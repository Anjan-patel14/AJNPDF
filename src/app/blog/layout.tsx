import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Guides and Tutorials',
  description: 'Read practical guides about PDF editing, conversion, privacy and browser-based document processing.',
  alternates: { canonical: '/blog' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
