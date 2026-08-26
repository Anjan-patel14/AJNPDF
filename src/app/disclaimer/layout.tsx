import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'Review important limitations and disclaimers for AJN PDF document and image tools.',
  alternates: { canonical: '/disclaimer' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
