import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browser-Native PDF Processing',
  description: 'Understand how browser-native document processing can improve privacy and speed.',
  alternates: { canonical: '/blog/browser-native-architecture' },
  openGraph: { type: 'article', url: '/blog/browser-native-architecture', title: 'Browser-Native PDF Processing', description: 'Understand how browser-native document processing can improve privacy and speed.' },
};

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
