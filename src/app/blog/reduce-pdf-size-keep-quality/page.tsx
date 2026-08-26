import { GuideArticle } from '@/components/blog/guide-article';
import { guideMetadata } from '@/lib/guide-metadata';

export const metadata = guideMetadata('reduce-pdf-size-keep-quality', 'How to reduce PDF size while keeping text readable', 'A useful compression workflow reduces unnecessary image and object data without promising the same savings for every PDF.');

export default function ReducePdfSizeGuide() {
  return <GuideArticle
    slug="reduce-pdf-size-keep-quality"
    eyebrow="Compression guide"
    title="How to reduce PDF size while keeping text readable"
    summary="A useful compression workflow reduces unnecessary image and object data without promising the same savings for every PDF."
    readTime="6 minute guide"
    datePublished="2026-08-13"
    sections={[
      { title: 'Start with the reason the file is large', paragraphs: ['Scanned pages and high-resolution photographs usually contribute more to PDF size than ordinary selectable text. A PDF that mainly contains vectors and text may already be compact.', 'Knowing what is inside the document helps you choose sensible compression instead of repeatedly lowering quality.'] },
      { title: 'Use the lightest compression that solves the problem', paragraphs: ['If you only need to fit an upload limit, reduce the file enough to meet that target and stop. Stronger compression can make small text, signatures and screenshots harder to read.', 'Open the result at normal zoom and inspect image-heavy pages before replacing the source file.'], bullets: ['Check small text and signatures', 'Compare the original and result size', 'Keep the original until review is complete'] },
      { title: 'Understand why some PDFs barely shrink', paragraphs: ['Modern PDF creators often compress images, fonts and internal streams when the file is first saved. There may be little redundant data left for another compressor to remove.', 'A small reduction is not automatically a failure. It can mean the source is already efficiently encoded.'] },
      { title: 'Consider workflow changes for scanned documents', paragraphs: ['For large scans, better source scanning settings may give a better result than repeatedly compressing a finished PDF. Choose a practical scan resolution, crop blank borders and avoid unnecessary full-colour capture when grayscale is sufficient.', ' can make text searchable, but it does not automatically guarantee a smaller file.'] }]}
    checklist={['Keep the original PDF', 'Use the lowest compression needed', 'Inspect image-heavy pages', 'Confirm the final upload limit']}
    relatedTools={[
      { href: '/compress-pdf', title: 'Compress PDF', description: 'Reduce PDF size with practical compression controls.' },
      { href: '/pdf-to-grayscale-pdf', title: 'PDF to Grayscale', description: 'Use grayscale where colour is not required.' }]}
  />;
}
