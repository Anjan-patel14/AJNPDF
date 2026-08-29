import type { Metadata } from 'next';

const PDF_TOOLS_DESCRIPTION =
  'Browse focused PDF tools to merge, split, compress, organize, edit, sign, protect, unlock and repair PDF files online.';

export const metadata: Metadata = {
  title: 'Free Online PDF Tools - Merge, Split, Compress & Sign',
  description: PDF_TOOLS_DESCRIPTION,
  alternates: { canonical: '/pdf-tools' },
  openGraph: {
    title: 'Free Online PDF Tools - Merge, Split, Compress & Sign | AJN PDF',
    description: PDF_TOOLS_DESCRIPTION,
    url: '/pdf-tools',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Online PDF Tools - Merge, Split, Compress & Sign | AJN PDF',
    description: PDF_TOOLS_DESCRIPTION,
  },
};

export default function PDFToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
