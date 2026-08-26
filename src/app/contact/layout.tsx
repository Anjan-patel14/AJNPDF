import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Contact AJN PDF' },
  description: 'Contact the AJN PDF team for support, feedback, business enquiries and website assistance.',
  alternates: { canonical: '/contact' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
