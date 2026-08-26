import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function DisclaimerPage() {
  return (
    <LegalPageShell
      eyebrow="Important notice"
      title="Disclaimer"
      summary="AJN PDF provides technical document utilities, not legal, financial, medical, accessibility-certification or records-management advice."
      sections={[
        {
          title: 'Review every output',
          paragraphs: ['Always open and review the downloaded file before deleting the original, sending it to another person or submitting it to an authority. Keep an unchanged backup.'],
        },
        {
          title: 'Conversion and  accuracy',
          paragraphs: ['Conversion and  results depend on the source file, scan quality, fonts and browser. Text, tables, images, metadata, accessibility structure and page layout may be incomplete or changed.'],
        },
        {
          title: 'Signatures and compliance',
          paragraphs: ['The Sign PDF tool places a visual electronic signature image or text. It is not a certificate-backed digital signature. AJN PDF does not certify PDF/A, PDF/UA, legal admissibility or regulatory compliance unless a tool explicitly states that an independent validator has confirmed it.'],
        },
        {
          title: 'External services',
          paragraphs: ['Advertisements, hosting, content delivery and other third-party services operate under their own terms and privacy practices. AJN PDF does not control their availability.'],
        }]}
    />
  );
}
