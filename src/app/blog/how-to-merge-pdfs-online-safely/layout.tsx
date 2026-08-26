import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Merge PDFs Online Safely',
  description: 'Learn how to combine PDF files safely while protecting sensitive document data.',
  alternates: { canonical: '/blog/how-to-merge-pdfs-online-safely' },
  openGraph: { type: 'article', url: '/blog/how-to-merge-pdfs-online-safely', title: 'How to Merge PDFs Online Safely', description: 'Learn how to combine PDF files safely while protecting sensitive document data.' },
};

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
