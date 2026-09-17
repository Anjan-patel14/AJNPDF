import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import ScanToPdf from '@/components/junction/ScanToPdf';

export const metadata: Metadata = {
  title: 'Scan to PDF',
  description: 'Use your device camera or gallery to create a PDF in your browser.',
  robots: { index: false, follow: true },
};

export default function ScannerPage() {
  return (
    <>
      <Navbar />
      <ScanToPdf />
      <MainFooter />
    </>
  );
}
