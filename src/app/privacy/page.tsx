import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how AJN PDF handles browser-based and temporary online PDF processing, analytics, advertising consent, cookies, retention and privacy requests.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      effectiveDate="September 17, 2026"
      summary="This policy explains how AJN PDF handles files during on-device and online workflows, how advertising consent works, and what information is not intentionally retained."
      sections={[
        {
          title: 'On-device and online workflows',
          paragraphs: [
            'Many AJN PDF tools handle supported documents within the active browser session. For those workflows, the selected file is not intentionally uploaded by AJN PDF.',
            'Protection, unlocking, repair and other workflows that explicitly identify online processing may upload the selected file temporarily over HTTPS to complete the requested action. Temporary working areas are scheduled for cleanup after the result is returned.',
          ],
        },
        {
          title: 'Information we may receive',
          bullets: [
            'Basic infrastructure information such as IP address, browser type, requested URL, timestamp and error status may appear in operational logs.',
            'Cookie, analytics and advertising choices may be stored in the browser so the website can respect the selected preference.',
            'We do not require an account for the public tools and do not intentionally collect filenames, passwords or document contents for product analytics.',
          ],
        },
        {
          title: 'Passwords and document content',
          paragraphs: [
            'Passwords submitted to Protect PDF or Unlock PDF are used only for the active request. The application must not intentionally include passwords in analytics, public logs or user-facing error messages.',
            'Do not use confidential material until you understand the file-handling details shown for the selected workflow.',
          ],
        },
        {
          title: 'Analytics, advertising and cookies',
          paragraphs: [
            'After the applicable consent choice, AJN PDF may record page paths, tool-funnel events, aggregate conversion outcomes and Core Web Vitals. Product analytics is designed to exclude uploaded document contents, filenames, passwords and extracted document text.',
            'If Google Analytics is configured, Google may receive optional website interaction events. AJN PDF uses Google AdSense only on eligible public content pages and only when the applicable consent flow permits advertising. Google and its partners may use cookies or similar technologies according to the consent configuration and their own policies.',
            'Advertisements are not intended to appear inside upload, processing, result or download controls. Legal, account, admin and error pages are not intended to display ads.',
          ],
        },
        {
          title: 'Retention and deletion',
          bullets: [
            'On-device working files are cleared when the page state is reset, refreshed or closed, subject to normal browser behaviour.',
            'Temporary online-request files are scheduled for deletion after the result is returned, and abandoned temporary work areas are cleaned automatically.',
            'You may request deletion of correspondence or other personal information you have directly provided to AJN PDF by using the official contact page.',
          ],
        },
        {
          title: 'Children and sensitive information',
          paragraphs: [
            'AJN PDF is a general document utility and is not designed to collect children’s personal information. Avoid submitting highly sensitive personal, medical, financial or identity documents to an online workflow unless it is necessary and you are authorised to do so.',
          ],
        },
        {
          title: 'Privacy requests',
          paragraphs: [
            'For privacy, data-deletion or consent questions, use the official AJN PDF contact page. Include only the information needed to identify your request and do not email document passwords or confidential source files.',
          ],
        },
      ]}
    />
  );
}
