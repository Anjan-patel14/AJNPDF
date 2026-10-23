import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function CookiesPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy choices"
      title="Cookie Policy"
      effectiveDate="October 15, 2026"
      summary="This policy explains how AJN PDF may use browser storage, cookies, analytics and advertising technologies, and how visitors can manage optional choices. Actual technologies depend on the services enabled for the current deployment."
      sections={[
        {
          title: 'Essential storage',
          bullets: [
            'Language, theme, cookie choice and similar interface preferences may be stored in localStorage or cookies.',
            'Essential storage is used to remember the selected settings and maintain website functionality.'],
        },
        {
          title: 'Optional analytics and advertising',
          paragraphs: [
            'After optional consent, AJN PDF may collect privacy-minimized page, tool-funnel and Core Web Vitals events. These events do not include uploaded file contents, filenames or passwords.',
            'Google Analytics may be enabled only when a valid GA4 measurement ID is configured. Google AdSense may use cookies or similar identifiers on eligible pages where permitted. AJN PDF separates ad units from document controls.'],
        },
        {
          title: 'Third-party cookies and advertising',
          paragraphs: [
            'When advertising or analytics providers are enabled, those providers may set or read cookies or use similar technologies subject to the visitor’s location, consent status, browser settings and the provider’s own policies.',
            'Rejecting optional technologies may reduce measurement or personalized advertising but should not be used to block essential PDF tool functionality. The exact effect depends on the current configuration and browser.',
          ],
        },
        {
          title: 'Managing choices',
          paragraphs: [
            'You can reject optional analytics and advertising through the website consent controls where available and can remove stored data through your browser settings. Blocking all browser storage may affect preferences but should not prevent use of core local tools.'],
        },
        {
          title: 'No file storage cookie',
          paragraphs: [
            'AJN PDF does not store uploaded PDF or image files inside cookies. Files selected for browser tools remain in browser memory, while online workflows use temporary request storage as described in the File Processing Policy.'],
        }]}
    />
  );
}
