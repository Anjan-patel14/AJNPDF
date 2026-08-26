import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function UnlockAuthorizationPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Authorised access"
      title="PDF Unlock Authorization Policy"
      summary="Unlock PDF is designed only for documents whose current password is known and whose owner has authorised password removal."
      sections={[
        {
          title: 'Required conditions',
          bullets: [
            'You must know and enter the document’s current valid password.',
            'You must own the document or have explicit permission from the owner or authorised administrator.',
            'You must confirm authorisation before processing begins.'],
        },
        {
          title: 'What AJN PDF does not do',
          bullets: [
            'No password dictionaries, guessing, brute force or cryptographic bypass.',
            'No removal of encryption without successful password validation.',
            'No retention or logging of the submitted password.'],
        },
        {
          title: 'User responsibility',
          paragraphs: ['You are responsible for confirming that unlocking the file is lawful and permitted by any contract, workplace policy, confidentiality obligation or licence that applies to the document.'],
        }]}
    />
  );
}
