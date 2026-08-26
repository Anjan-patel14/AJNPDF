import { LegalPageShell } from '@/components/legal/legal-page-shell';
import { AJN_BRAND } from '@/lib/brand';

export default function DataDeletionPage() {
  return (
    <LegalPageShell
      eyebrow="Data rights"
      title="Data Deletion Requests"
      summary="AJN PDF does not operate a user document library in Phase 1. This page explains what can be deleted and how to request removal of information you directly provided."
      sections={[
        {
          title: 'Files processed in the browser',
          paragraphs: ['For on-device workflows, AJN PDF does not intentionally create an uploaded copy. Reset or close the tool page and remove the downloaded file from your device if desired.'],
        },
        {
          title: 'Files processed temporarily',
          paragraphs: ['Online workflows schedule temporary input and output files for cleanup after delivery. If a request fails, abandoned temporary work areas are subject to automatic cleanup.'],
        },
        {
          title: 'Correspondence and support data',
          paragraphs: [`Email ${AJN_BRAND.contactEmail} from the same address used to contact us and describe the information you want removed. We may retain limited records when required for security, fraud prevention, legal obligations or dispute resolution.`],
        },
        {
          title: 'Browser preferences',
          paragraphs: ['Cookie and interface choices can be cleared using the privacy controls or the browser’s site-data settings.'],
        }]}
    />
  );
}
