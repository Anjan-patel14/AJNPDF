import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AJN Media Admin',
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminMediaLayout({ children }: { children: React.ReactNode }) { return children; }
