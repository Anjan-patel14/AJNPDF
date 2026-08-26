import type { Metadata } from 'next';
import { ProductLanding } from '@/components/products/product-landing';
import { AJN_BUZZ_URL } from '@/lib/plans';

export const metadata: Metadata = { title: { absolute: 'AJN IMG - Image Tools by AJN | AJN PDF' }, description: 'AJN image utilities are separated from AJN PDF and connected to the AJN Buzz image experience.' };

export default function ImageProductPage() {
  return <ProductLanding eyebrow="AJN IMG" title="Image tools have their own blue workspace." description="AJN PDF is now focused on PDFs. Resize, reduce, crop, rotate, watermark, flip and format-convert image workflows belong in the separate AJN image/Buzz product." accent="image" features={['Image Reducer','Image Resizer','Crop Image','Rotate Image','Watermark Image','Flip Image','Convert Image']} primaryLabel={AJN_BUZZ_URL ? 'Open AJN Buzz' : undefined} primaryHref={AJN_BUZZ_URL || undefined} secondaryLabel="Back to PDF tools" secondaryHref="/pdf-tools" note={AJN_BUZZ_URL ? 'This link is controlled by NEXT_PUBLIC_AJN_BUZZ_URL.' : 'Set NEXT_PUBLIC_AJN_BUZZ_URL to enable the production redirect button. AJN PDF does not expose these image processors publicly.'} />;
}
