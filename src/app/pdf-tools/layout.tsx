import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Free PDF & Image Tools',
  description: 'Browse AJN PDF tools for PDF editing, file conversion, image processing and document utilities.',
  alternates: { canonical: '/pdf-tools' },
  openGraph: {
    title: 'All Free PDF & Image Tools | AJN PDF',
    description: 'Browse online PDF, image and conversion tools from AJN PDF.',
    url: '/pdf-tools',
  },
};

export default function PDFToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
