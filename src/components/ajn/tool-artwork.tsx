import type { ComponentType, ReactNode } from 'react';
import Image from 'next/image';
import { CONVERSION_ICON_ASSETS } from '@/lib/conversion-icon-assets';
import {
  ArchiveRestore,
  ArrowDown,
  ArrowRight,
  Brush,
  Captions,
  Crop,
  Diff,
  FileDigit,
  FileImage,
  FileSignature,
  FileText,
  Files,
  FolderOpen,
  ImageIcon,
  Info,
  KeyRound,
  Layers3,
  LayoutGrid,
  Maximize,
  Maximize2,
  PenTool,
  RefreshCcw,
  Repeat2,
  RotateCcw,
  RotateCw,
  ScanLine,
  Scissors,
  ShieldCheck,
  Shrink,
  Smile,
  Stamp,
  Trash2,
  Type,
  Wand2,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolArtworkProps {
  toolId: string;
  toolName: string;
  className?: string;
  priority?: boolean;
}

type SimpleIcon = ComponentType<{ className?: string; strokeWidth?: number }>;
type Tone = 'violet' | 'blue' | 'emerald' | 'orange' | 'rose' | 'cyan';

export const PUBLIC_PDF_TOOL_ICON_IDS = [
  'scan-to-pdf',
  'edit-pdf',
  'add-image-to-pdf',
  'add-text',
  'compare-pdf',
  'compress-pdf',
  'crop-pdf',
  'delete-pdf-pages',
  'extract-images',
  'image-to-pdf',
  'jpg-to-pdf',
  'jpeg-to-pdf',
  'png-to-pdf',
  'webp-to-pdf',
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
] as const;

const toneClasses: Record<Tone, { shell: string; icon: string; badge: string; arrow: string }> = {
  violet: {
    shell: 'border-0 bg-transparent',
    icon: 'text-violet-600',
    badge: 'border-violet-200 bg-violet-50 text-violet-700',
    arrow: 'text-violet-500',
  },
  blue: {
    shell: 'border-0 bg-transparent',
    icon: 'text-blue-600',
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
    arrow: 'text-blue-500',
  },
  emerald: {
    shell: 'border-0 bg-transparent',
    icon: 'text-emerald-600',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    arrow: 'text-emerald-500',
  },
  orange: {
    shell: 'border-0 bg-transparent',
    icon: 'text-orange-500',
    badge: 'border-orange-200 bg-orange-50 text-orange-700',
    arrow: 'text-orange-500',
  },
  rose: {
    shell: 'border-0 bg-transparent',
    icon: 'text-rose-500',
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    arrow: 'text-rose-500',
  },
  cyan: {
    shell: 'border-0 bg-transparent',
    icon: 'text-cyan-600',
    badge: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    arrow: 'text-cyan-500',
  },
};

const PUBLIC_ACTION_ICONS: Record<string, { icon: SimpleIcon; tone: Tone }> = {
  'edit-pdf': { icon: PenTool, tone: 'blue' },
  'add-image-to-pdf': { icon: FileImage, tone: 'blue' },
  'add-text': { icon: Type, tone: 'rose' },
  'compare-pdf': { icon: Diff, tone: 'blue' },
  'compress-pdf': { icon: Shrink, tone: 'rose' },
  'crop-pdf': { icon: Crop, tone: 'blue' },
  'delete-pdf-pages': { icon: Trash2, tone: 'rose' },
  'extract-images': { icon: ImageIcon, tone: 'cyan' },
  'flatten-pdf': { icon: Layers3, tone: 'violet' },
  'merge-pdf': { icon: Files, tone: 'orange' },
  'organize-pdf': { icon: LayoutGrid, tone: 'violet' },
  'page-number': { icon: FileDigit, tone: 'emerald' },
  'pdf-metadata': { icon: Info, tone: 'blue' },
  'pdf-zip-extract': { icon: ArchiveRestore, tone: 'orange' },
  'protect-pdf': { icon: ShieldCheck, tone: 'blue' },
  'repair-pdf': { icon: Wrench, tone: 'orange' },
  'rotate-pdf': { icon: RotateCw, tone: 'blue' },
  'sign-pdf': { icon: FileSignature, tone: 'emerald' },
  'split-pdf': { icon: Scissors, tone: 'rose' },
  'unlock-pdf': { icon: KeyRound, tone: 'rose' },
  'watermark-pdf': { icon: Stamp, tone: 'rose' },
};

const PUBLIC_IMAGE_TO_PDF: Record<string, { label: string; tone: Tone; icon?: SimpleIcon }> = {
  'image-to-pdf': { label: 'IMG', tone: 'blue', icon: ImageIcon },
  'jpg-to-pdf': { label: 'JPG', tone: 'violet' },
  'jpeg-to-pdf': { label: 'JPEG', tone: 'emerald' },
  'png-to-pdf': { label: 'PNG', tone: 'violet' },
  'webp-to-pdf': { label: 'WebP', tone: 'emerald' },
};

const fallbackIcons: Record<string, SimpleIcon> = {
  'image-reducer': ArrowDown,
  'image-resizer': Maximize2,
  'crop-image': Maximize,
  'rotate-image': RotateCcw,
  'watermark-image': Brush,
  'flip-image': Repeat2,
  'convert-image': RefreshCcw,
  'meme-generator': Smile,
  'photo-editor': Wand2,
  'pdf-text': FileText,
  'subtitle-generator': Captions,
  'zip-extractor': FolderOpen,
};

const formatLabels: Record<string, string> = {
  pdf: 'PDF', word: 'WORD', doc: 'DOC', docx: 'DOCX', txt: 'TXT', text: 'TXT',
  rtf: 'RTF', odt: 'ODT', ods: 'ODS', odp: 'ODP', image: 'IMG', jpg: 'JPG',
  jpeg: 'JPEG', png: 'PNG', webp: 'WEBP', tiff: 'TIFF', bmp: 'BMP', gif: 'GIF',
  svg: 'SVG', heic: 'HEIC', html: 'HTML', url: 'URL', markdown: 'MD', xml: 'XML',
  json: 'JSON', csv: 'CSV', excel: 'EXCEL', xls: 'XLS', xlsx: 'XLSX',
  powerpoint: 'SLIDES', ppt: 'PPT', pptx: 'PPTX', epub: 'EPUB', mobi: 'MOBI',
  azw3: 'AZW3', eml: 'EML', msg: 'MSG', zip: 'ZIP', 'scanned-pdf': 'SCAN',
  'camera-scan': 'CAM', receipt: 'RCT', 'document-scanner': 'SCAN',
  'handwriting-image': 'WRITE',
};

function toneFor(toolId: string): Tone {
  const tones: Tone[] = ['violet', 'blue', 'emerald', 'orange', 'rose', 'cyan'];
  let hash = 0;
  for (const char of toolId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return tones[hash % tones.length];
}

function labelFor(part: string): string {
  return formatLabels[part] ?? part.replaceAll('-', ' ').slice(0, 5).toUpperCase();
}

function getConversion(toolId: string): { from: string; to: string } | null {
  if (toolId === 'pdf-pages-to-zip') return { from: 'PDF', to: 'ZIP' };
  if (!toolId.includes('-to-')) return null;
  const [rawFrom, rawTo] = toolId.split('-to-', 2);
  return { from: labelFor(rawFrom), to: labelFor(rawTo) };
}

function PdfActionGlyph({ Icon, tone }: { Icon: SimpleIcon; tone: Tone }) {
  const colors = toneClasses[tone];
  return (
    <span className="relative block h-full w-full" aria-hidden="true">
      <span className="absolute left-[5%] top-[4%] h-[78%] w-[70%] rounded-[20%] border border-slate-200 bg-white shadow-[0_4px_12px_rgba(15,23,42,.10)]">
        <span className="absolute left-[13%] top-[12%] text-[6px] font-black tracking-[-.04em] text-slate-400">PDF</span>
        <span className="absolute left-[13%] top-[30%] h-[5%] w-[38%] rounded-full bg-slate-200" />
        <span className="absolute left-[13%] top-[41%] h-[5%] w-[31%] rounded-full bg-slate-200" />
        <Icon className={cn('absolute bottom-[10%] right-[8%] h-[43%] w-[43%]', colors.icon)} strokeWidth={2.15} />
      </span>
      <span className="absolute bottom-[2%] right-[1%] flex h-[34%] min-w-[34%] items-center justify-center rounded-[25%] bg-rose-500 px-[3px] text-[6px] font-black tracking-[-.04em] text-white shadow-[0_3px_8px_rgba(244,63,94,.28)]">
        PDF
      </span>
    </span>
  );
}

function ScanPdfGlyph() {
  return (
    <span className="relative block h-full w-full" aria-hidden="true">
      <span className="absolute left-[11%] top-[5%] h-[20%] w-[78%] rounded-[28%] bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_3px_8px_rgba(37,99,235,.30)]" />
      <span className="absolute left-[16%] top-[29%] h-[63%] w-[68%] rounded-[18%] border border-blue-100 bg-white shadow-[0_5px_12px_rgba(15,23,42,.12)]">
        <span className="absolute left-[22%] top-[22%] h-[6%] w-[56%] rounded-full bg-slate-300" />
        <span className="absolute left-[22%] top-[37%] h-[6%] w-[46%] rounded-full bg-slate-300" />
        <span className="absolute left-[22%] top-[52%] h-[6%] w-[52%] rounded-full bg-slate-300" />
      </span>
      <ScanLine className="absolute bottom-[3%] left-[15%] h-[52%] w-[70%] text-cyan-500" strokeWidth={2.3} />
    </span>
  );
}

function ImageToPdfGlyph({ label, tone, Icon }: { label: string; tone: Tone; Icon?: SimpleIcon }) {
  const colors = toneClasses[tone];
  const SourceIcon = Icon;
  return (
    <span className="relative block h-full w-full" aria-hidden="true">
      <span className={cn(
        'absolute left-[2%] top-[15%] flex h-[58%] w-[46%] items-center justify-center rounded-[20%] border bg-white shadow-[0_4px_10px_rgba(15,23,42,.10)]',
        colors.badge,
      )}>
        {SourceIcon ? (
          <SourceIcon className={cn('h-[48%] w-[48%]', colors.icon)} strokeWidth={2.1} />
        ) : (
          <span className="text-[7px] font-black tracking-[-.05em]">{label}</span>
        )}
      </span>
      <ArrowRight className="absolute left-[43%] top-[35%] z-10 h-[22%] w-[22%] text-blue-500" strokeWidth={2.7} />
      <span className="absolute bottom-[8%] right-[1%] flex h-[55%] w-[45%] items-center justify-center rounded-[20%] border border-rose-200 bg-gradient-to-br from-rose-400 to-rose-600 text-[7px] font-black text-white shadow-[0_4px_10px_rgba(244,63,94,.24)]">
        PDF
      </span>
    </span>
  );
}

function ConversionGlyph({ from, to, tone }: { from: string; to: string; tone: Tone }) {
  const colors = toneClasses[tone];
  return (
    <span className="flex h-full w-full flex-col items-center justify-center gap-0.5" aria-hidden="true">
      <span className={cn('ajn-format-tile', colors.badge)}>{from}</span>
      <ArrowDown className={cn('h-2.5 w-2.5 shrink-0', colors.arrow)} strokeWidth={2.25} />
      <span className={cn('ajn-format-tile', colors.badge)}>{to}</span>
    </span>
  );
}

/**
 * AJN PDF public icon system.
 * All 27 public PDF workflows have an explicit semantic icon. Public tools never
 * rely on the generic fallback. Conversion assets remain available for hidden or
 * future conversion tools outside the current public PDF catalog.
 */
export function ToolArtwork({ toolId, toolName, className, priority = false }: ToolArtworkProps) {
  const publicConversion = PUBLIC_IMAGE_TO_PDF[toolId];
  const publicAction = PUBLIC_ACTION_ICONS[toolId];
  const tone = publicAction?.tone ?? publicConversion?.tone ?? toneFor(toolId);
  const colors = toneClasses[tone];
  const conversion = getConversion(toolId);
  const conversionAsset = CONVERSION_ICON_ASSETS[toolId];
  const FallbackIcon = fallbackIcons[toolId] ?? FileImage;

  let source = 'fallback-vector';
  let artwork: ReactNode;

  if (toolId === 'scan-to-pdf') {
    source = 'scanner-vector';
    artwork = <ScanPdfGlyph />;
  } else if (publicConversion) {
    source = 'image-pdf-vector';
    artwork = <ImageToPdfGlyph label={publicConversion.label} tone={publicConversion.tone} Icon={publicConversion.icon} />;
  } else if (publicAction) {
    source = 'pdf-action-vector';
    artwork = <PdfActionGlyph Icon={publicAction.icon} tone={publicAction.tone} />;
  } else if (conversionAsset) {
    source = 'ajn-conversion-asset';
    artwork = (
      <Image
        src={conversionAsset}
        alt=""
        fill
        sizes="64px"
        priority={priority}
        className="object-contain p-[2px]"
      />
    );
  } else if (conversion) {
    source = 'generated-conversion';
    artwork = <ConversionGlyph from={conversion.from} to={conversion.to} tone={tone} />;
  } else {
    artwork = <FallbackIcon className={cn('h-[46%] w-[46%]', colors.icon)} strokeWidth={1.9} />;
  }

  return (
    <span
      className={cn(
        'ajn-tool-artwork ajn-simple-tool-icon relative flex shrink-0 items-center justify-center overflow-hidden rounded-[10px]',
        colors.shell,
        className,
      )}
      title={toolName}
      aria-hidden="true"
      data-tool-icon={toolId}
      data-tool-icon-source={source}
    >
      {artwork}
    </span>
  );
}
