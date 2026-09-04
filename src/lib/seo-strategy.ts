import type { ServiceTool } from './tools-data';
import { getPublicToolCategory } from './tools-data';

export type SearchIntent = 'transactional' | 'informational' | 'comparison' | 'troubleshooting';

export type ToolSeoProfile = {
  primaryKeyword: string;
  secondaryKeywords: string[];
  questionKeywords: string[];
  audience: string[];
  intent: SearchIntent;
  title: string;
  description: string;
  categoryLabel: string;
};

const CATEGORY_TERMS = {
  conversion: ['online file converter', 'convert files online', 'document converter online'],
  image: ['online image tools', 'edit images online', 'image utility tools'],
  pdf: ['online PDF tools', 'edit PDF online', 'PDF utility tools'],
} as const;

const RECOGNITION_MARKERS = ['ocr', 'scanned', 'searchable', 'image-to-text', 'image-to-word', 'handwriting'];

const PRIORITY_TITLES: Record<string, string> = {'edit-pdf': 'Edit PDF Online Free - Change Text & Sign PDF | AJN PDF',
  'merge-pdf': 'Merge PDF Online - Combine PDF Files | AJN PDF',
  'split-pdf': 'Split PDF Online - Extract PDF Pages | AJN PDF',
  'compress-pdf': 'Compress PDF Online - Reduce PDF Size | AJN PDF',
  'protect-pdf': 'Protect PDF Online - Add a PDF Password | AJN PDF',
  'unlock-pdf': 'Unlock PDF Online - Remove PDF Password | AJN PDF',
  'organize-pdf': 'Organize PDF Online - Reorder PDF Pages | AJN PDF','add-text': 'Add Text to PDF Online - Write on PDF | AJN PDF',
  'sign-pdf': 'Sign PDF Online - Add an Electronic Signature | AJN PDF',
  'repair-pdf': 'Repair PDF Online - Recover a Damaged PDF | AJN PDF',
  'rotate-pdf': 'Rotate PDF Online - Rotate PDF Pages | AJN PDF',
  'crop-pdf': 'Crop PDF Online - Trim PDF Pages | AJN PDF',
  'watermark-pdf': 'Watermark PDF Online - Add Text Watermark | AJN PDF',
};

const PRIORITY_DESCRIPTIONS: Record<string, string> = {'edit-pdf': 'Edit PDF online in your browser with AJN PDF. Replace text, dates, names and numbers, match fonts, add images and signatures, highlight content, and manage pages locally.',
  'merge-pdf': 'Combine multiple PDF files in the order you choose, remove files before processing, and download one merged PDF.',
  'split-pdf': 'Split a PDF into smaller files, extract selected pages, or separate sections of a document with clear page controls.',
  'compress-pdf': 'Reduce PDF file size with practical compression controls. Already optimized PDFs may shrink only slightly.',
  'protect-pdf': 'Add password protection to an authorized PDF and download a protected copy.',
  'unlock-pdf': 'Remove PDF encryption when you know the valid password and are authorized to create an unlocked copy.',
  'organize-pdf': 'Reorder, rotate, remove or duplicate PDF pages with a visual workspace, then download the updated document.','add-text': 'Add new text directly to PDF pages, position it visually, and download a new copy without changing the original file.',
  'sign-pdf': 'Place a visual electronic signature on a PDF, position it on the page, and download a new signed copy.',
  'repair-pdf': 'Attempt safe recovery of a PDF with minor structural damage and download a separate repaired copy.',
  'rotate-pdf': 'Rotate all or selected PDF pages clockwise, counter-clockwise or 180 degrees and download a new copy.',
  'crop-pdf': 'Trim PDF page margins or crop selected pages with visual controls while keeping the original file unchanged.',
  'watermark-pdf': 'Add a visible text watermark to selected PDF pages with position, rotation, size and opacity controls.',
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.map(normalize).filter(Boolean))];
}

function isRecognitionTool(tool: ServiceTool): boolean {
  const id = tool.id.toLowerCase();
  const name = normalize(tool.name);
  return RECOGNITION_MARKERS.some((marker) => id.includes(marker) || name.includes(marker.replace(/-/g, ' ')));
}

function isConversionTool(tool: ServiceTool): boolean {
  return tool.id.includes('-to-') || tool.tag === 'convert' || getPublicToolCategory(tool) === 'conversion';
}

function buildTitle(tool: ServiceTool): string {
  const priority = PRIORITY_TITLES[tool.id];
  if (priority) return priority;

  const base = `${tool.name} Online`;
  const category = getPublicToolCategory(tool);
  const suffix = isRecognitionTool(tool)
    ? 'OCR Tool'
    : isConversionTool(tool)
      ? 'File Converter'
      : category === 'image'
        ? 'Image Tool'
        : 'PDF Tool';
  const candidate = `${base} - ${suffix} | AJN PDF`;
  return candidate.length <= 62 ? candidate : `${base} | AJN PDF`;
}

function buildNaturalDescription(tool: ServiceTool, isRecognition: boolean, isConversion: boolean): string {
  const priority = PRIORITY_DESCRIPTIONS[tool.id];
  if (priority) return priority;

  const cleanDesc = tool.desc.trim().replace(/\s+/g, ' ').replace(/\.$/, '');
  const task = isRecognition
    ? 'recognize visible text in supported scanned files'
    : isConversion
      ? 'convert supported files into the requested output format'
      : `complete the ${tool.name.toLowerCase()} workflow with clear file controls`;
  const review = isRecognition
    ? 'Review recognized text before using it in important work.'
    : 'Review the downloaded result before replacing the source file.';
  return `${cleanDesc}. ${tool.name} helps you ${task}. ${review}`;
}

export function getToolSeoProfile(tool: ServiceTool): ToolSeoProfile {
  const category = getPublicToolCategory(tool);
  const normalizedName = normalize(tool.name);
  const isRecognition = isRecognitionTool(tool);
  const isConversion = isConversionTool(tool);
  const categoryLabel = category === 'conversion' ? 'File Conversion' : category === 'image' ? 'Image Tools' : 'PDF Tools';
  const primaryKeyword = `${normalizedName} online`;
  const secondaryKeywords = unique([
    `free ${normalizedName}`,
    `${normalizedName} without signup`,
    `${normalizedName} tool`,
    ...tool.keywords,
    ...CATEGORY_TERMS[category],
    ...(isConversion ? [`${normalizedName} converter`] : []),
    ...(isRecognition ? ['online OCR tool', 'extract text from scanned document'] : []),
  ]).slice(0, 18);
  const questionKeywords = unique([
    `how to ${normalizedName} online`,
    `how do i ${normalizedName}`,
    `best way to ${normalizedName}`,
    `how to use ${normalizedName}`,
  ]);
  const audience = category === 'image'
    ? ['creators', 'students', 'marketing teams', 'small businesses']
    : ['students', 'professionals', 'business teams', 'legal and finance users'];
  const description = buildNaturalDescription(tool, isRecognition, isConversion).replace(/\s+/g, ' ').slice(0, 158).trim();

  return {
    primaryKeyword,
    secondaryKeywords,
    questionKeywords,
    audience,
    intent: 'transactional',
    title: buildTitle(tool),
    description,
    categoryLabel,
  };
}

export const ICP_SEGMENTS = [
  {
    id: 'students',
    label: 'Students and applicants',
    jobs: ['merge assignments', 'compress application files', 'organize pages', 'sign forms'],
    priorityQueries: ['merge pdf online', 'compress pdf for application', 'organize pdf pages', 'sign pdf online'],
  },
  {
    id: 'professionals',
    label: 'Professionals and office teams',
    jobs: ['protect confidential PDFs', 'repair damaged PDFs', 'compare document versions', 'edit PDF metadata'],
    priorityQueries: ['protect pdf with password', 'repair pdf online', 'compare pdf online', 'edit pdf metadata'],
  },
  {
    id: 'small-business',
    label: 'Small businesses and operations teams',
    jobs: ['compress documents', 'watermark distributed PDFs', 'protect files', 'extract images'],
    priorityQueries: ['compress pdf online', 'watermark pdf online', 'protect pdf online', 'extract images from pdf'],
  },
  {
    id: 'creators',
    label: 'Creators and marketing teams',
    jobs: ['resize images', 'reduce image size', 'crop images', 'watermark image assets'],
    priorityQueries: ['resize image online', 'reduce image size', 'crop image online', 'watermark image online'],
  },
] as const;

export const SEARCH_INTENT_CLUSTERS = [
  { cluster: 'Core PDF actions', intent: 'transactional', examples: ['merge pdf', 'split pdf', 'compress pdf', 'organize pdf'] },
  { cluster: 'PDF editing and signing', intent: 'transactional', examples: ['add text to pdf', 'sign pdf', 'watermark pdf', 'crop pdf'] },
  { cluster: 'Document security', intent: 'transactional', examples: ['protect pdf', 'unlock pdf', 'repair pdf'] },
  { cluster: 'Image workflows', intent: 'transactional', examples: ['resize image', 'reduce image size', 'crop image', 'convert image'] },
  { cluster: 'How-to guidance', intent: 'informational', examples: ['how to merge pdf safely', 'how to compress pdf', 'how to sign a pdf online'] },
  { cluster: 'Tool evaluation', intent: 'comparison', examples: ['best free pdf tools', 'online pdf tool comparison', 'pdf editor comparison'] },
] as const;
