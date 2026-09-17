import type { ComponentType } from 'react';
import {
  ArchiveRestore,
  Crop,
  Diff,
  FileImage,
  FileText,
  Files,
  ImagePlus,
  Info,
  KeyRound,
  Layers3,
  ListOrdered,
  PenTool,
  RotateCw,
  Scissors,
  ShieldCheck,
  Shrink,
  Stamp,
  Trash2,
  Type,
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

const icons: Record<string, SimpleIcon> = {
  'edit-pdf': PenTool,
  'add-image-to-pdf': ImagePlus,
  'add-text': Type,
  'compare-pdf': Diff,
  'compress-pdf': Shrink,
  'crop-pdf': Crop,
  'delete-pdf-pages': Trash2,
  'extract-images': FileImage,
  'flatten-pdf': Layers3,
  'image-to-pdf': FileImage,
  'jpeg-to-pdf': FileImage,
  'jpg-to-pdf': FileImage,
  'merge-pdf': Files,
  'organize-pdf': Layers3,
  'page-number': ListOrdered,
  'pdf-metadata': Info,
  'pdf-zip-extract': ArchiveRestore,
  'png-to-pdf': FileImage,
  'protect-pdf': ShieldCheck,
  'repair-pdf': Wrench,
  'rotate-pdf': RotateCw,
  'sign-pdf': PenTool,
  'split-pdf': Scissors,
  'unlock-pdf': KeyRound,
  'watermark-pdf': Stamp,
  'webp-to-pdf': FileImage,
};

function iconTone(toolId: string) {
  if (toolId === 'compress-pdf' || toolId === 'delete-pdf-pages') return 'text-rose-600';
  if (toolId === 'protect-pdf' || toolId === 'unlock-pdf' || toolId === 'repair-pdf') return 'text-emerald-600';
  return 'text-blue-600';
}

/**
 * Simple production icon system for AJN PDF.
 * Uses lightweight Lucide line icons only: no raster artwork, no decorative
 * badges, and no conversion artwork that can compete with the tool name.
 */
export function ToolArtwork({ toolId, toolName, className }: ToolArtworkProps) {
  const Icon = icons[toolId] ?? FileText;

  return (
    <span
      className={cn(
        'ajn-tool-artwork ajn-simple-tool-icon relative flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
      title={toolName}
      aria-hidden="true"
      data-tool-icon={toolId}
      data-tool-icon-source="lucide"
    >
      <Icon className={cn('h-[46%] w-[46%]', iconTone(toolId))} strokeWidth={1.9} />
    </span>
  );
}
