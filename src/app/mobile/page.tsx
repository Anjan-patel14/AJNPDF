import type { Metadata } from 'next';
import { ProductLanding } from '@/components/products/product-landing';
import { AJN_ANDROID_URL, AJN_IOS_URL } from '@/lib/plans';

export const metadata: Metadata = { title: { absolute: 'AJN Mobile - PDF Tools for Android and iOS | AJN PDF' }, description: 'AJN Mobile product page for PDF workflows on phones and tablets.' };

export default function MobilePage() {
  const primaryHref = AJN_ANDROID_URL || AJN_IOS_URL || undefined;
  const primaryLabel = AJN_ANDROID_URL ? 'Get Android build' : AJN_IOS_URL ? 'Get iOS build' : undefined;
  return <ProductLanding eyebrow="AJN Mobile" title="PDF tools built for mobile." description="A mobile-first AJN experience for opening, organizing, signing and sharing PDFs from phones and tablets." features={['Responsive PDF workflows for small screens','Android Trusted Web Activity build path included in R21','PWA install support through the AJN PDF web manifest','Share-sheet friendly result downloads','Account and Premium entitlement ready','Store badges stay hidden until real published URLs are configured']} primaryLabel={primaryLabel} primaryHref={primaryHref} secondaryLabel="Open web app" secondaryHref="/pdf-tools" note={primaryHref ? 'Only configured release links are shown.' : 'Android/iOS store links are not advertised until a real signed release is configured.'} />;
}
