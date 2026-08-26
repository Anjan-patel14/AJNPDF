import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers about AJN PDF tools, file handling, supported files, privacy, security and downloads.',
  alternates: { canonical: '/faq' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
