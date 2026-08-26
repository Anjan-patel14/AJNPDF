import { GuideArticle } from '@/components/blog/guide-article';
import { guideMetadata } from '@/lib/guide-metadata';

export const metadata = guideMetadata('pdf-accessibility-basics', 'PDF accessibility basics before you share a document', 'Readable text, sensible document order and meaningful structure make PDFs easier to use with keyboard, zoom and assistive technology.');

export default function PdfAccessibilityBasicsGuide() {
  return <GuideArticle
    slug="pdf-accessibility-basics"
    eyebrow="Accessibility guide"
    title="PDF accessibility basics before you share a document"
    summary="Readable text, sensible document order and meaningful structure make PDFs easier to use with keyboard, zoom and assistive technology."
    readTime="6 minute guide"
    datePublished="2026-08-13"
    sections={[
      { title: 'Start with real text where possible', paragraphs: ['A PDF made only from page images is harder to search, select and navigate with assistive technology. If a document contains only images, use an appropriate accessibility remediation workflow and review the resulting text carefully.', 'When creating a new document, exporting from a structured source is usually better than printing everything to an image.'] },
      { title: 'Check reading order and structure', paragraphs: ['Visual placement does not always match the order a screen reader will follow. Headings, lists, tables and form labels need meaningful structure in documents intended for broad accessibility.', 'Simple browser PDF utilities cannot automatically repair every tagging or reading-order problem.'] },
      { title: 'Use readable contrast and scalable content', paragraphs: ['Text should remain legible when users zoom, and important information should not depend on colour alone. Avoid very small text and low-contrast annotations.', 'For forms, make labels clear and leave enough visual space around interactive controls.'] },
      { title: 'Validate with the tools your audience uses', paragraphs: ['Open the final document in more than one viewer, test keyboard navigation where relevant and use a dedicated PDF accessibility checker for formal compliance work.', 'AJN PDF can help with individual file tasks, but accessibility conformance is a document-authoring and validation responsibility that goes beyond a single conversion step.'] }]}
    checklist={['Prefer real text over image-only pages', 'Check reading order', 'Keep contrast and zoom readable', 'Use a dedicated accessibility checker for formal compliance']}
    relatedTools={[
      { href: '/pdf-text', title: 'PDF to Text', description: 'Check whether a PDF contains extractable text.' }
    ]}
  />;
}
