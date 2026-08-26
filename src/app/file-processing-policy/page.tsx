import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/legal/legal-page-shell';
import { MERGE_PDF_LIMITS, SERVER_LIMIT_DEFAULTS } from '@/lib/tool-limits';
import { PROCESSING_DISCLOSURE } from '@/lib/processing-disclosure';

export const metadata: Metadata = {
  title: 'File Processing Policy',
  description:
    'How AJN PDF handles browser-native and server-backed file processing, current request limits, temporary workspaces and operational safeguards.',
  alternates: { canonical: '/file-processing-policy' },
};

export default function FileProcessingPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="File processing"
      title="File Processing Policy"
      summary={PROCESSING_DISCLOSURE.summary}
      sections={[
        {
          title: 'Browser-native processing',
          bullets: [
            'Supported local workflows read the selected document inside the active browser session.',
            'AJN PDF does not intentionally upload the selected file when the selected workflow is identified as browser-native.',
            'Browser memory, temporary cache and download storage remain subject to the browser, operating system and device.'],
        },
        {
          title: 'Server-backed processing',
          bullets: [
            'When an advanced conversion, repair or security workflow requires online processing, the selected file and required options are transmitted over HTTPS for that active request.',
            'The processing service uses a request workspace to perform the selected operation and return the result.',
            'AJN PDF is a processing service rather than permanent cloud file storage. Temporary request workspaces are subject to the active backend cleanup policy.',
            'The service checks live availability and can enforce lower live file or total-request limits for the active request.'],
        },
        {
          title: 'Current configured limits',
          paragraphs: [
            `The configured production default for server-backed conversion workflows is ${SERVER_LIMIT_DEFAULTS.maxFileSizeMb} MB per file and ${SERVER_LIMIT_DEFAULTS.maxTotalSizeMb} MB across one request. The active backend can enforce a lower live limit when required.`,
            `Merge PDF is a browser-native workflow with a separate policy of up to ${MERGE_PDF_LIMITS.maxFiles} files, ${MERGE_PDF_LIMITS.maxFileSizeMb} MB per file and ${MERGE_PDF_LIMITS.maxTotalSizeMb} MB combined.`,
            'AJN PDF does not publish one universal file-size promise for every tool. Browser-native workflows also depend on RAM, page complexity, image resolution and device capability.'],
        },
        {
          title: 'Availability and dependencies',
          paragraphs: [
            'The public catalogue is generated from a deployment capability manifest. A workflow that depends on an unavailable converter or processing capability can be hidden from public navigation or shown as unavailable rather than returning a fake result.',
            'Conversion quality depends on the original document, fonts, images, page structure and destination format. Reconstructed office documents,  output and repaired PDFs should be reviewed before replacing the source.'],
        },
        {
          title: 'Failures, cancellation and recovery',
          bullets: [
            'A rejected file, unavailable backend, invalid password, timeout or unsupported document should return an explicit error state.',
            'Keep the source file until the downloaded result has been opened and checked.',
            'Retry only after reviewing the displayed reason; repeated requests do not guarantee that a damaged or unsupported source can be recovered.'],
        },
        {
          title: 'Passwords,  text and analytics',
          bullets: [
            'PDF passwords are used only for the active security request and are not intended for analytics events.',
            'Extracted  text and document contents are not intended to be written to anonymous product analytics.',
            'Operational telemetry should describe route, status, duration or failure category rather than document contents.'],
        }]}
    />
  );
}
