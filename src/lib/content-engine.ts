export type ContentBrief = {
  slug: string;
  cluster: 'core-pdf' | 'conversion' | 'image' | 'security' | 'comparison';
  intent: 'informational' | 'commercial' | 'transactional-support';
  title: string;
  primaryKeyword: string;
  supportingQuestions: string[];
  relatedTools: string[];
  status: 'published' | 'planned';
};

export const CONTENT_BRIEFS: ContentBrief[] = [
  {
    slug: 'how-to-merge-pdfs-online-safely',
    cluster: 'core-pdf',
    intent: 'informational',
    title: 'How to merge PDFs online safely',
    primaryKeyword: 'how to merge pdf online safely',
    supportingQuestions: ['How do I keep page order correct?', 'How should I validate the downloaded PDF?'],
    relatedTools: ['merge-pdf', 'organize-pdf', 'compress-pdf'],
    status: 'published',
  },
  {
    slug: 'reduce-pdf-size-keep-quality',
    cluster: 'core-pdf',
    intent: 'transactional-support',
    title: 'How to reduce PDF size while keeping text readable',
    primaryKeyword: 'compress pdf without losing quality',
    supportingQuestions: ['Which compression level should I choose?', 'Why do image-heavy PDFs stay large?'],
    relatedTools: ['compress-pdf', 'pdf-to-grayscale-pdf'],
    status: 'published',
  },
  {
    slug: 'image-to-pdf-jpg-vs-png',
    cluster: 'image',
    intent: 'informational',
    title: 'Image to PDF: when to use JPG, PNG or another source format',
    primaryKeyword: 'jpg vs png for pdf',
    supportingQuestions: ['Which image resolution is enough?', 'How should page size and orientation be chosen?'],
    relatedTools: ['jpg-to-pdf', 'png-to-pdf', 'multiple-images-to-one-pdf'],
    status: 'published',
  },
  {
    slug: 'document-security-aes256',
    cluster: 'security',
    intent: 'informational',
    title: 'PDF passwords, encryption and permissions explained',
    primaryKeyword: 'PDF password encryption permissions',
    supportingQuestions: ['What is the difference between user and owner passwords?', 'Can printing and copying be restricted?'],
    relatedTools: ['protect-pdf', 'unlock-pdf'],
    status: 'published',
  },
  {
    slug: 'why-pdf-compression-limited',
    cluster: 'core-pdf',
    intent: 'transactional-support',
    title: 'Why some PDF files cannot be compressed much further',
    primaryKeyword: 'why pdf will not compress more',
    supportingQuestions: ['Why did my PDF shrink only a little?', 'What content makes PDFs large?'],
    relatedTools: ['compress-pdf', 'pdf-to-grayscale-pdf'],
    status: 'published',
  },
  {
    slug: 'pdf-vs-docx',
    cluster: 'conversion',
    intent: 'informational',
    title: 'PDF vs DOCX: when to use each format',
    primaryKeyword: 'pdf vs docx',
    supportingQuestions: ['Which format is easier to edit?', 'Why can conversion change layout?'],
    relatedTools: ['pdf-to-word', 'word-to-pdf'],
    status: 'published',
  },
  {
    slug: 'pdf-accessibility-basics',
    cluster: 'core-pdf',
    intent: 'informational',
    title: 'PDF accessibility basics before you share a document',
    primaryKeyword: 'pdf accessibility basics',
    supportingQuestions: ['Why does real text matter?', 'How should PDF accessibility be validated?'],
    relatedTools: ['pdf-text'],
    status: 'published',
  },
];

export const CONTENT_QUALITY_GATE = [
  'The page answers a real user task that is supported by a working AJN PDF tool.',
  'Examples and limitations match the actual processing engine.',
  'The article links to a focused tool and at least two relevant supporting pages.',
  'The title, heading and introduction satisfy the same search intent without keyword stuffing.',
  'Screenshots or examples are AJN-owned and are updated when the workflow changes.',
  'The page is reviewed for accuracy before it is added to the sitemap.',
] as const;