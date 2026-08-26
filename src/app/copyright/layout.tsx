import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Copyright Policy',
  description: 'Review copyright rules and permitted use of AJN PDF website content and tools.',
  alternates: { canonical: '/copyright' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
