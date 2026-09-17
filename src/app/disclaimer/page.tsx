import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'Read the AJN PDF disclaimer covering document-output review, processing limitations, signatures, compliance and third-party services.',
  alternates: { canonical: '/disclaimer' },
};

export default function DisclaimerPage() {
  return (
    <LegalPageShell
      eyebrow="Important notice"
      title="Disclaimer"
      effectiveDate="September 17, 2026"
      summary="AJN PDF provides technical document utilities, not legal, financial, medical, accessibility-certification or records-management advice."
      sections={[
        {
          title: 'Review every output',
          paragraphs: [
            'Always open and review the downloaded file before deleting the original, sending it to another person or submitting it to an authority. Keep an unchanged backup.',
          ],
        },
        {
          title: 'Processing and conversion accuracy',
          paragraphs: [
            'Editing, conversion, compression, page-copy and repair results depend on the source PDF, embedded fonts, images, forms, annotations and browser or server workflow. Text, images, metadata, accessibility structure and page layout may be incomplete or changed.',
          ],
        },
        {
          title: 'Signatures and compliance',
          paragraphs: [
            'The Sign PDF tool places a visual electronic signature image or text. It is not a certificate-backed digital signature. AJN PDF does not certify PDF/A, PDF/UA, legal admissibility or regulatory compliance unless a tool explicitly states that an independent validator has confirmed it.',
          ],
        },
        {
          title: 'External services',
          paragraphs: [
            'Advertising, analytics, hosting, content delivery and other third-party services operate under their own terms and privacy practices. AJN PDF does not control their availability.',
          ],
        },
      ]}
    />
  );
}
