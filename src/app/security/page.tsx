import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/legal/legal-page-shell';
import { PROCESSING_DISCLOSURE } from '@/lib/processing-disclosure';
import { AJN_BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Security Practices',
  description:
    'AJN PDF security practices for browser-native tools, temporary server-backed requests, file validation, passwords and responsible disclosure.',
  alternates: { canonical: '/security' },
};

export default function SecurityPage() {
  return (
    <LegalPageShell
      eyebrow="Security"
      title="Security Practices"
      summary={PROCESSING_DISCLOSURE.summary}
      sections={[
        {
          title: 'Clear file handling',
          bullets: [
            'Browser-native workflows keep supported processing inside the active browser session.',
            'Advanced workflows identify when the selected file requires server-backed processing for the requested operation.',
            'Online tool screens check live availability and applicable limits before accepting a request.'],
        },
        {
          title: 'Temporary request safeguards',
          bullets: [
            'Server-backed processing uses a request workspace for the selected operation rather than permanent cloud-drive storage.',
            'File type, size and request inputs are validated before processing.',
            'HTTPS, origin restrictions, timeouts and workload limits protect the request path.',
            'Temporary request workspaces are subject to the active backend cleanup policy.',
            'PDF passwords are not intended to appear in product analytics or application logs.'],
        },
        {
          title: 'User responsibilities',
          paragraphs: [
            'Use a strong unique password when protecting a PDF, preserve an original copy, and do not process a sensitive document on a shared or untrusted computer. Only unlock a file when you know the current password and have permission.'],
        },
        {
          title: 'Responsible disclosure',
          paragraphs: [
            `Report a reproducible security issue privately to ${AJN_BRAND.contactEmail}. Do not access another user’s data, disrupt the service or publish sensitive exploit details before a reasonable remediation period.`],
        }]}
    />
  );
}
