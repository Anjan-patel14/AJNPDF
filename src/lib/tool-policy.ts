import { CONVERSION_TOOLS } from './conversion-tools';
import { MERGE_PDF_LIMITS, SERVER_LIMIT_DEFAULTS } from './tool-limit-constants';
export type ToolMaturity = 'stable' | 'limited' | 'backend' | 'hidden';
export type ProcessingMode = 'browser' | 'temporary-server';

export interface ToolPolicy {
  maturity: ToolMaturity;
  processingMode: ProcessingMode;
  maxFiles: number;
  maxFileSizeMb: number;
  publicByDefault: boolean;
  limitation?: string;
}

// R21 production allowlist: AJN PDF is deliberately PDF-only. Image utilities
// remain in source for migration to the AJN image/Buzz product but are not
// public AJN PDF routes, navigation items or sitemap entries.
export const PRODUCTION_PUBLIC_TOOL_IDS = new Set([
  'add-image-to-pdf',
  'add-text',
  'compare-pdf',
  'compress-pdf',
  'crop-pdf',
  'delete-pdf-pages',
  'extract-images',
  'flatten-pdf',
  'merge-pdf',
  'organize-pdf',
  'page-number',
  'pdf-metadata',
  'pdf-zip-extract',
  'protect-pdf',
  'repair-pdf',
  'rotate-pdf',
  'sign-pdf',
  'split-pdf',
  'unlock-pdf',
  'watermark-pdf',
]);

const stableBrowserIds = new Set([
  'merge-pdf', 'split-pdf', 'rotate-pdf', 'delete-pdf-pages', 'organize-pdf',
  'crop-pdf', 'watermark-pdf', 'page-number', 'flatten-pdf', 'compare-pdf',
  'add-text', 'add-image-to-pdf', 'pdf-metadata', 'pdf-zip-extract', 'sign-pdf',
  // Source-only image processors retained for AJN IMG/Buzz migration.
  'image-reducer', 'image-resizer', 'crop-image', 'rotate-image', 'watermark-image',
  'flip-image', 'convert-image', 'meme-generator', 'photo-editor',
]);

const limitedBrowser: Record<string, string> = {
  'compress-pdf': 'Target-size compression rasterizes pages and can reduce text searchability, links, forms, and accessibility at very small targets.',
  'extract-images': 'Unusual inline, masked, or vector images may not be extracted.',
  'heic-pdf': 'HEIC support depends on browser decoding and the bundled converter.',
  'word-pdf': 'Best for DOCX files with simple layouts; complex Word formatting can change.',
  'pdf-word': 'Creates editable text but does not preserve every original layout element.',
  'excel-pdf': 'Complex charts, formulas, and print areas may render differently.',
  'pdf-excel': 'Uses text positioning and is not advanced table recognition.',
  'ppt-pdf': 'Creates a readable PDF but does not guarantee pixel-perfect slide rendering.',
  'ppt-word': 'Extracts slide text and notes; it does not reproduce slide design.',
  'html-pdf': 'Supports basic HTML content; complex external CSS and scripts are not guaranteed.',
  'pdf-epub': 'Creates a basic text-focused eBook and may not preserve advanced layout.',
};

const legacyAliasIds = new Set([
  'word-pdf', 'pdf-word', 'excel-pdf', 'pdf-excel', 'ppt-pdf', 'jpg-pdf',
  'pdf-jpg', 'heic-pdf', 'html-pdf', 'xml-pdf', 'json-pdf', 'txt-pdf']);

const conversionBackendIds = new Set(CONVERSION_TOOLS.map((tool) => tool.id));
const backendIds = new Set(['protect-pdf', 'unlock-pdf', 'repair-pdf', 'png-to-pdf', ...conversionBackendIds]);

const hiddenIds = new Set([
  'pdf-ppt', 'pdf-a', 'pdf-ua', 'smart-read', 'psd-pdf',
  'upscale-image', 'remove-bg', 'blur-face']);

export function getToolPolicy(id: string): ToolPolicy {
  if (!PRODUCTION_PUBLIC_TOOL_IDS.has(id)) {
    return {
      maturity: 'hidden', processingMode: 'browser', maxFiles: 1, maxFileSizeMb: 25,
      publicByDefault: false,
      limitation: hiddenIds.has(id)
        ? 'Hidden until its output and claims pass production validation.'
        : 'Not part of the current AJN PDF public catalog.',
    };
  }
  if (legacyAliasIds.has(id)) {
    return {
      maturity: 'hidden', processingMode: 'browser', maxFiles: 1, maxFileSizeMb: 75,
      publicByDefault: false, limitation: 'Legacy route redirected to the canonical conversion tool.',
    };
  }
  if (stableBrowserIds.has(id)) {
    return {
      maturity: 'stable', processingMode: 'browser', maxFiles: id === 'merge-pdf' ? MERGE_PDF_LIMITS.maxFiles : 1,
      maxFileSizeMb: id === 'merge-pdf' ? MERGE_PDF_LIMITS.maxFileSizeMb : 50, publicByDefault: true,
    };
  }
  if (id in limitedBrowser) {
    const visibleLimited = new Set(['compress-pdf', 'extract-images']);
    return {
      maturity: 'limited', processingMode: 'browser', maxFiles: 1, maxFileSizeMb: 40,
      publicByDefault: visibleLimited.has(id), limitation: limitedBrowser[id],
    };
  }
  if (backendIds.has(id)) {
    return {
      maturity: 'backend', processingMode: 'temporary-server',
      maxFiles: 1,
      maxFileSizeMb: SERVER_LIMIT_DEFAULTS.maxFileSizeMb,
      publicByDefault: true,
      limitation: 'This advanced workflow uses a temporary online request. Temporary request files are scheduled for cleanup after the result is returned.',
    };
  }
  return {
    maturity: 'hidden', processingMode: 'browser', maxFiles: 1, maxFileSizeMb: 25,
    publicByDefault: false, limitation: hiddenIds.has(id) ? 'Hidden until its output and claims pass production validation.' : 'Not included in the public tool set.',
  };
}

export function isToolPublic(id: string): boolean {
  return getToolPolicy(id).publicByDefault;
}

export const PHASE1_BACKEND_TOOL_IDS = backendIds;
