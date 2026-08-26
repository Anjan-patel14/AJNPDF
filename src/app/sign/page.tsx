import type { Metadata } from 'next';
import { ProductLanding } from '@/components/products/product-landing';

export const metadata: Metadata = { title: { absolute: 'AJN Sign - Electronic PDF Signing | AJN PDF' }, description: 'Sign PDFs visually and access AJN electronic-signature API package capabilities.' };

export default function SignPage() {
  return <ProductLanding eyebrow="AJN Sign" title="Sign PDFs with clear electronic-signature boundaries." description="Use the live Sign PDF workspace for visual electronic signatures. AJN API also exposes an authenticated electronic-signature package with evidence metadata; certificate-backed PAdES is not claimed unless implemented separately." features={['Draw, type or upload a visual signature in the Sign PDF workspace','Place and resize the signature on the selected page','Authenticated API v1 electronic-signature package endpoint','Evidence package support in the backend API','No claim of certificate-backed digital signing','Recipient-request workflows can be added later without changing the current signing contract']} primaryLabel="Sign a PDF" primaryHref="/sign-pdf" secondaryLabel="AJN API signing" secondaryHref="/developers" />;
}
