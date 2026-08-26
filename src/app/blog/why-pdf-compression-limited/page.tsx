import { GuideArticle } from '@/components/blog/guide-article';
import { guideMetadata } from '@/lib/guide-metadata';

export const metadata = guideMetadata('why-pdf-compression-limited', 'Why some PDF files cannot be compressed much further', 'A PDF can already contain optimized images, subset fonts and compressed object streams, leaving very little redundant data to remove.');

export default function PdfCompressionLimitsGuide() {
  return <GuideArticle
    slug="why-pdf-compression-limited"
    eyebrow="Troubleshooting guide"
    title="Why some PDF files cannot be compressed much further"
    summary="A PDF can already contain optimized images, subset fonts and compressed object streams, leaving very little redundant data to remove."
    readTime="5 minute guide"
    datePublished="2026-08-13"
    sections={[
      { title: 'Many PDFs are compressed when they are created', paragraphs: ['Office applications, scanners and design tools often compress image streams and internal objects during export. Running another compressor may find only small savings.', 'That is normal and should not be hidden behind an unrealistic compression guarantee.'] },
      { title: 'Image content sets a practical floor', paragraphs: ['High-resolution photographs and scanned pages can dominate file size. Reducing them further means changing resolution, quality or colour information.', 'The right trade-off depends on whether the PDF is for screen reading, printing, archiving or a strict upload limit.'] },
      { title: 'Fonts, forms and embedded objects also matter', paragraphs: ['Documents can contain embedded fonts, attachments, form resources and metadata. Some content is essential for correct rendering and should not simply be removed.', 'Aggressive optimization can therefore create compatibility problems even when the byte count looks attractive.'] },
      { title: 'Measure success by the task, not a percentage promise', paragraphs: ['If the goal is to fit a portal limit, the useful result is a readable file below that threshold. If the source is already smaller than the limit, further compression may not be valuable.', 'Always open the result and check the pages that matter most.'] }]}
    checklist={['Check the original file size', 'Know the target upload limit', 'Inspect image-heavy pages', 'Do not expect a fixed percentage reduction']}
    relatedTools={[
      { href: '/compress-pdf', title: 'Compress PDF', description: 'Reduce PDF size using the available compression workflow.' },
      { href: '/pdf-to-grayscale-pdf', title: 'PDF to Grayscale', description: 'Use grayscale when colour is unnecessary.' },
      { href: '/limits', title: 'AJN PDF limits', description: 'Review current documented processing limits.' }]}
  />;
}
