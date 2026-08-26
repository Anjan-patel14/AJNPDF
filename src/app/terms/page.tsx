import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Terms of Use"
      summary="These terms govern use of AJN PDF’s public web tools. By using the service, you agree to use only files you own or are authorised to process and to accept the technical limitations described on each tool page."
      sections={[
        {
          title: 'Permitted use',
          bullets: [
            'Use AJN PDF only for lawful documents and purposes.',
            'You must own the file or have permission from the owner to edit, convert, protect, unlock, sign or otherwise process it.',
            'You remain responsible for reviewing every downloaded output before relying on it.'],
        },
        {
          title: 'Prohibited use',
          bullets: [
            'Do not use the service to bypass access controls without authorisation, guess passwords, infringe copyright, distribute malware or process illegal content.',
            'Do not overload, scrape, reverse engineer, interfere with or attempt unauthorised access to the website or online workflows.',
            'Do not present a visual signature created by AJN PDF as a certificate-backed digital signature unless it has been independently signed by a valid digital-signature system.'],
        },
        {
          title: 'Tool limitations',
          paragraphs: [
            'PDF, Office,  and image formats can contain features that are not preserved by every conversion. Fonts, forms, links, accessibility tags, charts, animations, tables and layout may change.  may contain recognition errors. Repair may not recover severely damaged files.',
            'AJN PDF does not guarantee that every output will be suitable for legal filing, archival compliance, accessibility certification, publishing or professional print production.'],
        },
        {
          title: 'Availability',
          paragraphs: [
            'Tool availability and limits can depend on the device, file complexity, format and required online workflow. We may temporarily disable a workflow when its output, security or infrastructure is not reliable.'],
        },
        {
          title: 'No warranty and limitation',
          paragraphs: [
            'AJN PDF is provided on an “as available” basis. To the maximum extent permitted by applicable law, AJN Studio is not responsible for data loss, missed deadlines, lost profits or indirect damages arising from use of the tools. Keep an original backup before processing any file.'],
        },
        {
          title: 'Changes',
          paragraphs: [
            'We may update these terms when tools, processing methods, advertising practices or legal requirements change. The effective date at the top of this page identifies the current version.'],
        }]}
    />
  );
}
