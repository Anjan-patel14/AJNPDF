import type { Metadata } from 'next';
import { ProductLanding } from '@/components/products/product-landing';
import { AJN_DESKTOP_DOWNLOAD_URL } from '@/lib/plans';

export const metadata: Metadata = { title: { absolute: 'AJN Desktop - PDF Tools for Desktop | AJN PDF' }, description: 'AJN Desktop product page for private and offline PDF workflows.' };

export default function DesktopPage() {
  return <ProductLanding eyebrow="AJN Desktop" title="PDF work on your desktop." description="A desktop-focused AJN experience for local PDF tasks, larger files and workflows that benefit from staying close to the device." features={['Local-first desktop workflow design','Merge, split, organize and edit PDF roadmap','Desktop file picker and drag-and-drop experience','Account entitlement ready for Premium','Windows-first release surface with room for macOS later','Download links remain hidden until a signed build is configured']} primaryLabel={AJN_DESKTOP_DOWNLOAD_URL ? 'Download AJN Desktop' : undefined} primaryHref={AJN_DESKTOP_DOWNLOAD_URL || undefined} secondaryLabel="Use AJN PDF on the web" secondaryHref="/pdf-tools" note={AJN_DESKTOP_DOWNLOAD_URL ? 'Use only the signed release linked by AJN PDF.' : 'No desktop installer is advertised until a signed production build URL is configured.'} />;
}
