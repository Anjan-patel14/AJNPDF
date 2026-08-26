import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'PDF Unlock Authorization Policy', description: 'AJN PDF requires a valid current password and owner authorization to unlock PDFs.', alternates: { canonical: '/unlock-authorization-policy' } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
