import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Security and AES-256',
  description: 'Learn what AES-256 PDF encryption means and how document password protection works.',
  alternates: { canonical: '/blog/document-security-aes256' },
  openGraph: { type: 'article', url: '/blog/document-security-aes256', title: 'PDF Security and AES-256', description: 'Learn what AES-256 PDF encryption means and how document password protection works.' },
};

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
