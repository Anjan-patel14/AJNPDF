import type { ComponentType } from 'react';
import Image from 'next/image';
import { CONVERSION_ICON_ASSETS } from '@/lib/conversion-icon-assets';
import {
  ArchiveRestore, ArrowDown, Brush, Captions, Crop, Diff, FileDigit, FileImage, FileText, Files, FolderOpen, ImageIcon, Info, KeyRound, Layers3, LayoutGrid, Maximize, Maximize2, PenTool, RefreshCcw, Repeat2, RotateCcw, RotateCw, Scissors, ShieldCheck, Shrink, Smile, Stamp, Trash2, Type, Wand2, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolArtworkProps {
  toolId: string;
  toolName: string;
  className?: string;
  priority?: boolean;
}

type SimpleIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

type Tone = 'violet' | 'blue' | 'emerald' | 'orange' | 'rose' | 'cyan';

const toneClasses: Record<Tone, { shell: string; icon: string; badge: string; arrow: string }> = {
  violet: {
    shell: 'border-0 bg-transparent',
    icon: 'text-violet-600',
    badge: 'border-slate-200 bg-white text-slate-700',
    arrow: 'text-violet-400',
  },
  blue: {
    shell: 'border-0 bg-transparent',
    icon: 'text-blue-600',
    badge: 'border-slate-200 bg-white text-slate-700',
    arrow: 'text-blue-400',
  },
  emerald: {
    shell: 'border-0 bg-transparent',
    icon: 'text-emerald-600',
    badge: 'border-slate-200 bg-white text-slate-700',
    arrow: 'text-emerald-400',
  },
  orange: {
    shell: 'border-0 bg-transparent',
    icon: 'text-orange-600',
    badge: 'border-slate-200 bg-white text-slate-700',
    arrow: 'text-orange-400',
  },
  rose: {
    shell: 'border-0 bg-transparent',
    icon: 'text-rose-600',
    badge: 'border-slate-200 bg-white text-slate-700',
    arrow: 'text-rose-400',
  },
  cyan: {
    shell: 'border-0 bg-transparent',
    icon: 'text-cyan-600',
    badge: 'border-slate-200 bg-white text-slate-700',
    arrow: 'text-cyan-400',
  },
};

const specialIcons: Record<string, SimpleIcon> = {
  'edit-pdf': PenTool,
  'merge-pdf': Files,
  'split-pdf': Scissors,
  'compress-pdf': Shrink,
  'rotate-pdf': RotateCw,
  'delete-pdf-pages': Trash2,
  'organize-pdf': LayoutGrid,
  'crop-pdf': Crop,
  'watermark-pdf': Stamp,
  'page-number': FileDigit,
  'flatten-pdf': Layers3,
  'protect-pdf': ShieldCheck,
  'unlock-pdf': KeyRound,
  'repair-pdf': Wrench,
  'compare-pdf': Diff,
  'add-text': Type,
  'add-image-to-pdf': FileImage,
  'extract-images': ImageIcon,
  'image-reducer': ArrowDown,
  'image-resizer': Maximize2,
  'crop-image': Maximize,
  'rotate-image': RotateCcw,
  'watermark-image': Brush,
  'flip-image': Repeat2,
  'convert-image': RefreshCcw,
  'meme-generator': Smile,
  'photo-editor': Wand2,
  'pdf-metadata': Info,
  'pdf-text': FileText,
  'pdf-zip-extract': ArchiveRestore,
  'sign-pdf': PenTool,
  'subtitle-generator': Captions,
  'zip-extractor': FolderOpen,
};

const formatLabels: Record<string, string> = {
  pdf: 'PDF',
  word: 'WORD',
  doc: 'DOC',
  docx: 'DOCX',
  txt: 'TXT',
  text: 'TXT',
  rtf: 'RTF',
  odt: 'ODT',
  ods: 'ODS',
  odp: 'ODP',
  image: 'IMG',
  jpg: 'JPG',
  jpeg: 'JPEG',
  png: 'PNG',
  webp: 'WEBP',
  tiff: 'TIFF',
  bmp: 'BMP',
  gif: 'GIF',
  svg: 'SVG',
  heic: 'HEIC',
  html: 'HTML',
  url: 'URL',
  markdown: 'MD',
  xml: 'XML',
  json: 'JSON',
  csv: 'CSV',
  excel: 'EXCEL',
  xls: 'XLS',
  xlsx: 'XLSX',
  powerpoint: 'SLIDES',
  ppt: 'PPT',
  pptx: 'PPTX',
  epub: 'EPUB',
  mobi: 'MOBI',
  azw3: 'AZW3',
  eml: 'EML',
  msg: 'MSG',
  zip: 'ZIP',
  'scanned-pdf': 'SCAN',
  'camera-scan': 'CAM',
  receipt: 'RCT',
  'document-scanner': 'SCAN',
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
 * AJN PDF R8.3 plain-white professional icon system.
 * Every public tool receives either a dedicated action glyph or a source→target
 * format pair. It replaces the 107 raster card artworks with lightweight vector UI.
 */
export function ToolArtwork({ toolId, toolName, className, priority = false }: ToolArtworkProps) {
  const tone = toneFor(toolId);
  const colors = toneClasses[tone];
  const conversion = specialIcons[toolId] ? null : getConversion(toolId);
  const conversionAsset = CONVERSION_ICON_ASSETS[toolId];
  const Icon = specialIcons[toolId] ?? FileImage;

  return (
    <span
      className={cn('ajn-tool-artwork ajn-simple-tool-icon relative flex shrink-0 items-center justify-center overflow-hidden rounded-[10px]', colors.shell, className)}
      title={toolName}
      aria-hidden="true"
      data-tool-icon={toolId}
      data-tool-icon-source={conversionAsset ? 'ajn-conversion-asset' : 'vector'}
    >
      {conversionAsset ? (
        <Image
          src={conversionAsset}
          alt=""
          fill
          sizes="64px"
          priority={priority}
          className="object-contain p-[2px]"
        />
      ) : conversion ? (
        <ConversionGlyph from={conversion.from} to={conversion.to} tone={tone} />
      ) : (
        <Icon className={cn('h-[46%] w-[46%]', colors.icon)} strokeWidth={1.9} />
      )}
    </span>
  );
}
