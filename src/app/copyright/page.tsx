import { LegalPageShell } from '@/components/legal/legal-page-shell';
import { AJN_BRAND } from '@/lib/brand';

export default function CopyrightPage() {
  return (
    <LegalPageShell
      eyebrow="Copyright"
      title="Copyright Policy"
      summary="Users retain their rights in documents they process. AJN PDF does not receive ownership of uploaded content."
      sections={[
        {
          title: 'User content',
          paragraphs: ['You represent that you own the content or have permission to process it. Converting or editing a file does not remove copyright, licence or confidentiality obligations.'],
        },
        {
          title: 'AJN PDF materials',
          paragraphs: ['The AJN PDF brand, original interface, written guidance and application source are protected by applicable intellectual-property rights and any licence terms included with the repository.'],
        },
        {
          title: 'Copyright complaints',
          paragraphs: [`A notice should identify the protected work, the allegedly infringing URL, the complainant’s contact information, a good-faith statement and a statement that the information is accurate and authorised. Send notices to ${AJN_BRAND.contactEmail}.`],
        }]}
    />
  );
}
