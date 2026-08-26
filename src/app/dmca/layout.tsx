import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DMCA Policy',
  description: 'Read the AJN PDF copyright complaint and DMCA notice process.',
  alternates: { canonical: '/dmca' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
