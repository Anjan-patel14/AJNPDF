import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transparency',
  description: 'Review AJN PDF transparency information about processing methods, limitations and third-party services.',
  alternates: { canonical: '/transparency' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
