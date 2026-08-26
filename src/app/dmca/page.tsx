import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function DmcaPage() {
  return (
    <LegalPageShell
      eyebrow="Copyright requests"
      title="DMCA and Takedown"
      summary="AJN PDF reviews complete copyright notices concerning publicly hosted AJN PDF content. The service does not intentionally retain files processed through the public tools."
      sections={[
        {
          title: 'Required notice information',
          bullets: [
            'Identification of the copyrighted work.',
            'The AJN PDF URL or material claimed to be infringing.',
            'Your name, address, email and telephone number.',
            'A good-faith statement and an accuracy/authority statement.',
            'A physical or electronic signature of the authorised complainant.'],
        },
        {
          title: 'Counter-notices',
          paragraphs: ['Where applicable, a user may submit a counter-notice identifying the removed material, explaining the basis for restoration and including the legally required statements and contact details.'],
        },
        {
          title: 'Misrepresentation',
          paragraphs: ['Knowingly submitting a false notice may create legal liability. Consider obtaining professional legal advice before sending a notice or counter-notice.'],
        }]}
    />
  );
}
