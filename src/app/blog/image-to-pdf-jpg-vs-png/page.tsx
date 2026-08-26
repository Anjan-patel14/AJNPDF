import { GuideArticle } from '@/components/blog/guide-article';
import { guideMetadata } from '@/lib/guide-metadata';

export const metadata = guideMetadata('image-to-pdf-jpg-vs-png', 'Image to PDF: when to use JPG, PNG or another source format', 'The best source format depends on whether the image contains photographs, sharp text, diagrams or transparency.');

export default function ImageToPdfFormatGuide() {
  return <GuideArticle
    slug="image-to-pdf-jpg-vs-png"
    eyebrow="Image workflow guide"
    title="Image to PDF: when to use JPG, PNG or another source format"
    summary="The best source format depends on whether the image contains photographs, sharp text, diagrams or transparency."
    readTime="5 minute guide"
    datePublished="2026-08-13"
    sections={[
      { title: 'JPG is efficient for photographs', paragraphs: ['JPEG compression works well for camera images and continuous-tone photographs. It can keep photo files relatively small, but repeated saving can introduce visible compression artifacts.', 'For photographed documents, inspect small text and signatures before converting to PDF.'] },
      { title: 'PNG preserves sharp edges well', paragraphs: ['PNG is lossless and is often a good choice for screenshots, diagrams, UI captures and text-heavy graphics. It can be larger than JPG for photographs.', 'Transparency in the source image may be flattened against the page background during PDF creation depending on the workflow settings.'] },
      { title: 'Page size and image fit matter after format choice', paragraphs: ['A good image source can still produce an awkward PDF if it is cropped or stretched. Choose page size, orientation, margin and contain/cover behaviour based on how the result will be read or printed.', 'Rotate phone photos before conversion so every page has the intended orientation.'] },
      { title: 'Image PDFs are not automatically searchable', paragraphs: ['Placing an image into a PDF does not create selectable text. If search or copy is required, run an  workflow after creating the PDF or use a searchable-PDF conversion designed for the source images.', 'Keep the original images until you have checked the final PDF.'] }]}
    checklist={['JPG for photographs', 'PNG for sharp text and graphics', 'Choose page fit carefully', 'Use  when searchable text is needed']}
    relatedTools={[
      { href: '/jpg-to-pdf', title: 'JPG to PDF', description: 'Create PDF pages from JPG images.' },
      { href: '/png-to-pdf', title: 'PNG to PDF', description: 'Create PDF pages from PNG images.' }]}
  />;
}
