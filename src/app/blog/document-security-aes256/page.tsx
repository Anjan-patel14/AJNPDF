import { GuideArticle } from '@/components/blog/guide-article';
import { guideMetadata } from '@/lib/guide-metadata';

export const metadata = guideMetadata('document-security-aes256', 'PDF passwords and AES-256 explained', 'Password protection can restrict opening and selected actions, but it must be configured carefully and does not replace device security, access control or responsible sharing.');

export default function PdfSecurityGuide() {
  return <GuideArticle
    slug="document-security-aes256"
    eyebrow="PDF security guide"
    title="PDF passwords and AES-256 explained"
    summary="Password protection can restrict opening and selected actions, but it must be configured carefully and does not replace device security, access control or responsible sharing."
    readTime="7 minute guide"
    sections={[
      { title: 'Open and owner passwords have different roles', paragraphs: ['A user or open password is required to open the protected PDF. An owner password controls permissions such as printing, copying, editing, annotations and form filling.', 'Use different strong passwords when both roles are needed. Store them in a trusted password manager because AJN PDF does not provide password recovery or guessing.'] },
      { title: 'What AES-256 means in AJN PDF', paragraphs: ['Protect PDF uses pikepdf with AES-256 encryption and PDF revision 6. The output should be tested in the PDF viewers your recipients actually use because permission support can vary.', 'Encryption protects the document only while the password remains secret. A recipient who can view the document may still capture its visible content through other means.'], note: 'Do not describe a PDF password as digital signing. A visual signature image and certificate-based digital signature are different features.' },
      { title: 'Authorised unlocking only', paragraphs: ['Unlock PDF requires the current valid password and an authorization confirmation. The product does not attempt dictionary attacks, brute-force recovery or password guessing.', 'Only remove protection from a document you own or are permitted to modify.'] },
      { title: 'Validate the protected output', paragraphs: ['Open the output without a password to confirm access is blocked, then test the intended open password. Check printing, copying and editing restrictions in a compatible desktop viewer.', 'Also verify that the temporary processing workspace is cleaned and that passwords never appear in analytics or application logs.'] }]}
    checklist={['Use unique open and owner passwords', 'Verify permissions in a desktop PDF viewer', 'Share passwords through a separate secure channel', 'Keep an unencrypted source in protected storage']}
    relatedTools={[
      { href: '/protect-pdf', title: 'Protect PDF', description: 'Create an AES-256 password-protected PDF.' },
      { href: '/unlock-pdf', title: 'Unlock PDF', description: 'Remove protection using the current valid password.' },
      { href: '/security', title: 'Security controls', description: 'Review validation, cleanup and authorization rules.' }]}
  />;
}
