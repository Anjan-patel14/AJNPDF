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

type ToolSeoOverride = { title: string; description: string };

const CATEGORY_TERMS = {
  conversion: ['online file converter', 'convert files online', 'document converter online'],
  image: ['image to pdf online', 'convert image to pdf', 'image pdf tool'],
  pdf: ['online PDF tools', 'edit PDF online', 'PDF utility tools'],
} as const;

export const PUBLIC_TOOL_SEO_OVERRIDES: Record<string, ToolSeoOverride> = {
  'add-image-to-pdf': {
    title: 'Add Image to PDF Online - Insert Images into PDF | AJN PDF',
    description: 'Add images to PDF pages in your browser, position them visually, preview the result and download a new PDF without uploading the source file.',
  },
  'add-text': {
    title: 'Add Text to PDF Online - Write on PDF | AJN PDF',
    description: 'Add new text to PDF pages in your browser, position it visually and download a new copy while keeping the original source file unchanged.',
  },
  'compare-pdf': {
    title: 'Compare PDF Online - View PDF Differences | AJN PDF',
    description: 'Compare two PDF files in your browser with a side-by-side workflow designed to help review visible document differences without uploading the files.',
  },
  'compress-pdf': {
    title: 'Compress PDF Online - Reduce PDF File Size | AJN PDF',
    description: 'Reduce PDF file size in your browser with practical compression controls. Results depend on the document, and already optimized PDFs may shrink only slightly.',
  },
  'crop-pdf': {
    title: 'Crop PDF Online - Trim PDF Page Margins | AJN PDF',
    description: 'Crop PDF pages in your browser with visual controls, trim unwanted page areas and download a new PDF while keeping the source file unchanged.',
  },
  'delete-pdf-pages': {
    title: 'Delete PDF Pages Online - Remove Pages from PDF | AJN PDF',
    description: 'Remove selected PDF pages in your browser, review the page selection and download a new PDF without uploading the source document.',
  },
  'edit-pdf': {
    title: 'Edit PDF Online Free - Change Text & Sign PDF | AJN PDF',
    description: 'Edit PDF online in your browser with AJN PDF. Replace text, dates, names and numbers, match fonts, add images and signatures, highlight content, and manage pages locally.',
  },
  'extract-images': {
    title: 'Extract Images from PDF Online - Save PDF Images | AJN PDF',
    description: 'Extract supported images from PDF files in your browser and download the results without sending the source PDF to a remote processing service.',
  },
  'flatten-pdf': {
    title: 'Flatten PDF Online - Create a Flattened PDF Copy | AJN PDF',
    description: 'Create a flattened PDF copy in your browser for supported document content and download the result while preserving the original source file.',
  },
  'image-to-pdf': {
    title: 'Image to PDF Online - Convert Images to PDF | AJN PDF',
    description: 'Convert supported images to PDF in your browser, reorder and rotate images, choose page settings and download one PDF without uploading the images.',
  },
  'jpeg-to-pdf': {
    title: 'JPEG to PDF Online - Convert JPEG Images to PDF | AJN PDF',
    description: 'Convert JPEG images to PDF in your browser, arrange image order, choose page settings and download one PDF without uploading the source images.',
  },
  'jpg-to-pdf': {
    title: 'JPG to PDF Online - Convert JPG Images to PDF | AJN PDF',
    description: 'Convert JPG images to PDF in your browser, reorder or rotate images, choose page settings and download one PDF without uploading the source images.',
  },
  'merge-pdf': {
    title: 'Merge PDF Online - Combine PDF Files | AJN PDF',
    description: 'Combine multiple PDF files in your browser, arrange them in the order you want and download one merged PDF without uploading the source documents.',
  },
  'organize-pdf': {
    title: 'Organize PDF Online - Reorder PDF Pages | AJN PDF',
    description: 'Reorder, rotate, remove or duplicate PDF pages in your browser with a visual workspace, then download a new organized PDF copy.',
  },
  'page-number': {
    title: 'Add Page Numbers to PDF Online | AJN PDF',
    description: 'Add page numbers to PDF pages in your browser, choose placement and formatting options, preview the result and download a new numbered PDF.',
  },
  'pdf-metadata': {
    title: 'Edit PDF Metadata Online - Title, Author & Details | AJN PDF',
    description: 'Review and update supported PDF metadata fields in your browser, then download a new PDF copy while keeping the original document unchanged.',
  },
  'pdf-zip-extract': {
    title: 'Extract PDF ZIP Online - Unpack PDF Files | AJN PDF',
    description: 'Open supported ZIP archives containing PDF files in your browser, review extracted items and work with the results without uploading the archive.',
  },
  'png-to-pdf': {
    title: 'PNG to PDF Online - Convert PNG Images to PDF | AJN PDF',
    description: 'Convert PNG images to PDF in your browser, preserve supported transparency, arrange pages and download one PDF without uploading the source images.',
  },
  'protect-pdf': {
    title: 'Protect PDF Online - Add Password to PDF | AJN PDF',
    description: 'Add password protection to an authorized PDF with AJN PDF’s server-assisted security processor. Check the live Status page for service availability.',
  },
  'repair-pdf': {
    title: 'Repair PDF Online - Recover a Damaged PDF | AJN PDF',
    description: 'Attempt recovery of a PDF with AJN PDF’s server-assisted repair processor. Results depend on the file, and current availability is shown on Status.',
  },
  'rotate-pdf': {
    title: 'Rotate PDF Online - Rotate PDF Pages | AJN PDF',
    description: 'Rotate all or selected PDF pages in your browser, preview the page orientation and download a new PDF without uploading the source document.',
  },
  'sign-pdf': {
    title: 'Sign PDF Online - Add an Electronic Signature | AJN PDF',
    description: 'Add and position a visual electronic signature on PDF pages in your browser, preview the result and download a new signed PDF copy.',
  },
  'split-pdf': {
    title: 'Split PDF Online - Extract PDF Pages | AJN PDF',
    description: 'Split a PDF in your browser, extract selected pages or create smaller documents, then download the results without uploading the source PDF.',
  },
  'unlock-pdf': {
    title: 'Unlock PDF Online - Remove PDF Password | AJN PDF',
    description: 'Unlock a PDF only when you know the valid password and are authorized to do so. This server-assisted workflow depends on live service availability.',
  },
  'watermark-pdf': {
    title: 'Watermark PDF Online - Add Text Watermark | AJN PDF',
    description: 'Add a visible text watermark to PDF pages in your browser, control placement and appearance, preview the result and download a new PDF copy.',
  },
  'webp-to-pdf': {
    title: 'WebP to PDF Online - Convert WebP Images to PDF | AJN PDF',
    description: 'Convert WebP images to PDF in your browser, arrange image order, choose page settings and download one PDF without uploading the source images.',
  },
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.map(normalize).filter(Boolean))];
}

function isConversionTool(tool: ServiceTool): boolean {
  return tool.id.includes('-to-') || tool.tag === 'convert' || getPublicToolCategory(tool) === 'conversion';
}

function buildFallbackTitle(tool: ServiceTool): string {
  const base = `${tool.name} Online`;
  const category = getPublicToolCategory(tool);
  const suffix = isConversionTool(tool) ? 'File Converter' : category === 'image' ? 'Image Tool' : 'PDF Tool';
  const candidate = `${base} - ${suffix} | AJN PDF`;
  return candidate.length <= 62 ? candidate : `${base} | AJN PDF`;
}

function buildFallbackDescription(tool: ServiceTool): string {
  const cleanDesc = tool.desc.trim().replace(/\s+/g, ' ').replace(/\.$/, '');
  const task = isConversionTool(tool)
    ? 'convert supported files into the requested output format'
    : `complete the ${tool.name.toLowerCase()} workflow with clear file controls`;
  return `${cleanDesc}. ${tool.name} helps you ${task}. Review the downloaded result before replacing the source file.`;
}

export function getToolSeoProfile(tool: ServiceTool): ToolSeoProfile {
  const category = getPublicToolCategory(tool);
  const normalizedName = normalize(tool.name);
  const isConversion = isConversionTool(tool);
  const categoryLabel = category === 'conversion' ? 'File Conversion' : category === 'image' ? 'Image Tools' : 'PDF Tools';
  const override = PUBLIC_TOOL_SEO_OVERRIDES[tool.id];
  const primaryKeyword = `${normalizedName} online`;
  const secondaryKeywords = unique([
    `free ${normalizedName}`,
    `${normalizedName} without signup`,
    `${normalizedName} tool`,
    ...tool.keywords,
    ...CATEGORY_TERMS[category],
    ...(isConversion ? [`${normalizedName} converter`] : []),
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
  const rawDescription = (override?.description || buildFallbackDescription(tool)).replace(/\s+/g, ' ').trim();
  const description = rawDescription.length <= 158
    ? rawDescription
    : `${rawDescription.slice(0, 158).replace(/\s+\S*$/, '')}.`;

  return {
    primaryKeyword,
    secondaryKeywords,
    questionKeywords,
    audience,
    intent: 'transactional',
    title: override?.title || buildFallbackTitle(tool),
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
    jobs: ['edit PDFs', 'compare document versions', 'edit PDF metadata', 'prepare signed copies'],
    priorityQueries: ['edit pdf online', 'compare pdf online', 'edit pdf metadata', 'sign pdf online'],
  },
  {
    id: 'small-business',
    label: 'Small businesses and operations teams',
    jobs: ['compress documents', 'watermark distributed PDFs', 'organize pages', 'extract images'],
    priorityQueries: ['compress pdf online', 'watermark pdf online', 'organize pdf online', 'extract images from pdf'],
  },
  {
    id: 'image-to-pdf',
    label: 'Image-to-PDF users',
    jobs: ['convert JPG images', 'convert PNG images', 'convert WebP images', 'arrange images into PDF pages'],
    priorityQueries: ['jpg to pdf online', 'png to pdf online', 'webp to pdf online', 'image to pdf online'],
  },
] as const;

export const SEARCH_INTENT_CLUSTERS = [
  { cluster: 'Core PDF actions', intent: 'transactional', examples: ['merge pdf', 'split pdf', 'compress pdf', 'organize pdf'] },
  { cluster: 'PDF editing and signing', intent: 'transactional', examples: ['edit pdf', 'add text to pdf', 'sign pdf', 'watermark pdf'] },
  { cluster: 'Document security', intent: 'transactional', examples: ['protect pdf', 'unlock pdf', 'repair pdf'] },
  { cluster: 'Image to PDF', intent: 'transactional', examples: ['jpg to pdf', 'png to pdf', 'webp to pdf', 'image to pdf'] },
  { cluster: 'How-to guidance', intent: 'informational', examples: ['how to merge pdf safely', 'how to compress pdf', 'how to sign a pdf online'] },
  { cluster: 'Tool evaluation', intent: 'comparison', examples: ['best free pdf tools', 'online pdf tool comparison', 'browser pdf editor comparison'] },
] as const;
