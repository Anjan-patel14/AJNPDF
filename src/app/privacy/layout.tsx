import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read how AJN PDF handles website data, cookies, analytics, advertising and browser-based file processing.',
  alternates: { canonical: '/privacy' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
