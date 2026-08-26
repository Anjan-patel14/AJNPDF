import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Service Status',
  description: 'Check AJN PDF website, on-device workflow and online-tool availability.',
  alternates: { canonical: '/status' },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
