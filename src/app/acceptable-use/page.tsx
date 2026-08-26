import { LegalPageShell } from '@/components/legal/legal-page-shell';

export default function AcceptableUsePage() {
  return (
    <LegalPageShell
      eyebrow="Usage policy"
      title="Acceptable Use Policy"
      summary="This policy defines the lawful and authorised uses of AJN PDF and its online file workflows."
      sections={[
        {
          title: 'Allowed use',
          bullets: [
            'Process documents you own or are authorised to handle.',
            'Use tools for personal, educational, professional and business workflows that comply with applicable law.',
            'Test outputs before relying on them and retain an original backup.'],
        },
        {
          title: 'Prohibited content and conduct',
          bullets: [
            'Unauthorised password removal, access-control bypass or attempts to guess or brute-force credentials.',
            'Malware, harmful code, illegal content, harassment, fraud, intellectual-property infringement or privacy violations.',
            'Automated abuse, denial-of-service activity, excessive requests, probing, scraping or attempts to evade technical limits.',
            'Using AJN PDF to falsely represent document authenticity, digital-signature status, archival compliance or official certification.'],
        },
        {
          title: 'Enforcement',
          paragraphs: ['AJN PDF may block requests, remove public content, disable a tool or report unlawful activity when reasonably necessary to protect users, infrastructure or legal rights.'],
        }]}
    />
  );
}
