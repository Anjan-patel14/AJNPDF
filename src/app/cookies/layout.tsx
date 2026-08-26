import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Learn how AJN PDF uses cookies, analytics and advertising technologies.',
  alternates: { canonical: '/cookies' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
