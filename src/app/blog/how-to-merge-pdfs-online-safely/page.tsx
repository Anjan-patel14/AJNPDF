import { GuideArticle } from '@/components/blog/guide-article';
import { guideMetadata } from '@/lib/guide-metadata';

export const metadata = guideMetadata('how-to-merge-pdfs-online-safely', 'How to merge PDFs online safely', 'A reliable merge workflow checks file-handling mode, page order, output quality and the sensitivity of the documents before downloading the result.');

export default function MergePdfSafetyGuide() {
  return <GuideArticle
    slug="how-to-merge-pdfs-online-safely"
    eyebrow="PDF workflow guide"
    title="How to merge PDFs online safely"
    summary="A reliable merge workflow checks file-handling mode, page order, output quality and the sensitivity of the documents before downloading the result."
    readTime="5 minute guide"
    sections={[
      { title: 'Confirm the file-handling mode', paragraphs: ['AJN PDF classifies Merge PDF as a browser workflow. The selected PDFs are combined in the current browser session without uploading the selected PDFs for conversion.', 'Browser processing reduces network transfer, but users should still work on a trusted device and avoid leaving sensitive files open on a shared computer.'], note: 'Use the browser Network panel when you need to independently verify that a local tool does not upload the selected file during that action.' },
      { title: 'Review every source file', paragraphs: ['Open the documents before merging. Confirm that they are readable, not unexpectedly password protected and arranged in the order you want.', 'Remove duplicate files and check whether confidential pages should be excluded before creating one combined document.'], bullets: ['Verify the page count of each source PDF', 'Use clear filenames before selection', 'Remove duplicates from the queue', 'Avoid mixing unrelated confidential records'] },
      { title: 'Arrange and process once', paragraphs: ['Place files in the intended order, start the merge once and wait for the completed result. Repeated clicks can create confusing duplicate downloads even when the tool blocks duplicate processing.', 'Large documents require more browser memory. If a device becomes slow, merge smaller groups and combine the intermediate results.'] },
      { title: 'Validate the downloaded PDF', paragraphs: ['Open the downloaded file in an independent PDF viewer. Check the first page, last page, page count, bookmarks where relevant and any pages containing forms or unusual fonts.', 'A successful download is not enough—the output must also match the expected document order and content.'] }]}
    checklist={['Use a trusted browser and device', 'Confirm document order before processing', 'Open the downloaded result independently', 'Delete local copies you no longer need']}
    relatedTools={[
      { href: '/merge-pdf', title: 'Merge PDF', description: 'Combine multiple PDFs in a browser workflow.' },
      { href: '/organize-pdf', title: 'Organize PDF', description: 'Reorder or prepare pages before merging.' },
      { href: '/split-pdf', title: 'Split PDF', description: 'Separate pages that should not be included.' }]}
  />;
}
