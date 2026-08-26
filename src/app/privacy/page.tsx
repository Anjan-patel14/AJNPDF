import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      summary="This policy explains how AJN PDF handles files during on-device and online workflows, how advertising consent works, and what information is not intentionally retained."
      sections={[
        {
          title: 'On-device and online workflows',
          paragraphs: [
            'Many AJN PDF tools handle supported documents within the active browser session. For those workflows, the selected file is not intentionally uploaded by AJN PDF.',
            'Advanced conversion, protection, unlocking and repair workflows may upload the selected file temporarily over HTTPS to complete the requested action. Each request uses an isolated temporary working area that is scheduled for cleanup after the result is returned.'],
        },
        {
          title: 'Information we may receive',
          bullets: [
            'Basic infrastructure information such as IP address, browser type, requested URL, timestamp and error status may appear in operational logs.',
            'Cookie, analytics and advertising choices may be stored in the browser so the website can respect the selected preference.',
            'We do not require an account for the public tools and do not intentionally collect filenames, passwords or document contents for analytics.'],
        },
        {
          title: 'Passwords and document content',
          paragraphs: [
            'Passwords submitted to Protect PDF or Unlock PDF are used only for the active request. The application must not log, store or include passwords in analytics or error messages.',
            'Do not use confidential material until you understand the file-handling details shown for the selected workflow.'],
        },
        {
          title: 'Analytics, advertising and cookies',
          paragraphs: [
            'After optional consent, AJN PDF may record anonymous page paths, tool-funnel events, aggregate conversion outcomes and Core Web Vitals. Product analytics excludes uploaded contents, filenames, passwords, extracted  text and persisted raw IP addresses.',
            'If a GA4 measurement ID is configured, Google Analytics may receive optional website interaction events. AJN PDF uses Google AdSense on eligible public content pages only after the applicable consent flow. Google and its partners may use cookies or similar technologies according to the user consent configuration and their own policies.',
            'Advertisements are not placed inside upload, processing or download cards. Legal and error pages are not intended to display ads.'],
        },
        {
          title: 'Retention and deletion',
          bullets: [
            'On-device working files are cleared when the page state is reset, refreshed or closed, subject to normal browser behaviour.',
            'Temporary online-request files are scheduled for deletion after the result is returned, and abandoned temporary work areas are cleaned automatically.',
            'Admin-published AJN Discover images and captions remain until edited or deleted by an administrator. A user may request removal of correspondence or public media by emailing the address below.'],
        },
        {
          title: 'Children and sensitive information',
          paragraphs: ['AJN PDF is a general document utility and is not designed to collect children’s personal information. Avoid submitting highly sensitive personal, medical, financial or identity documents to an online workflow unless it is necessary and you are authorised to do so.'],
        }]}
    />
  );
}
