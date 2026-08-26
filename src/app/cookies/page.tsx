import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function CookiesPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy choices"
      title="Cookie Policy"
      summary="AJN PDF uses limited browser storage for essential preferences and may enable anonymous analytics or advertising only after the applicable optional consent choice."
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
