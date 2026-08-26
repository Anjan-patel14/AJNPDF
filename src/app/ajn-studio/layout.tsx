import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'AJN Studio — Product Studio Behind AJN PDF' },
  description: 'AJN Studio is the product identity behind AJN PDF, its public guides and original product updates created by Anjan.',
  alternates: { canonical: '/ajn-studio' },
};

export default function AjnStudioLayout({ children }: { children: React.ReactNode }) { return children; }
