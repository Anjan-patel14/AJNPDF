import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Review the terms and conditions for using AJN PDF online document and image tools.',
  alternates: { canonical: '/terms' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
