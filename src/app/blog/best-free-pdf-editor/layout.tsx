import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Best Free PDF Editor Guide',
  description: 'A practical guide to choosing and using a free online PDF editor.',
  alternates: { canonical: '/blog/best-free-pdf-editor' },
  openGraph: { type: 'article', url: '/blog/best-free-pdf-editor', title: 'Best Free PDF Editor Guide', description: 'A practical guide to choosing and using a free online PDF editor.' },
};

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
