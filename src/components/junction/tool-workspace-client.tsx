'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { PlatformLoader } from '../platform-loader';
import { BUILD_PUBLIC_TOOLS } from '@/lib/build-public-tools';
import { CONVERSION_TOOLS } from '../../lib/conversion-tools';
import ServerConversionTool from './ServerConversionTool';
import OfficeConversionTool from './OfficeConversionTool';
import MergePdf from './MergePdf';
import { notFound } from 'next/navigation';

/** AJN Universal Tool Connector — one production processor per capability. */
const BROWSER_IMAGE_TO_PDF_IDS = new Set([
  'image-to-pdf',
  'jpg-to-pdf',
  'jpeg-to-pdf',
  'png-to-pdf',
  'webp-to-pdf',
]);

const SERVER_CONVERSION_IDS = new Set([...CONVERSION_TOOLS.map((tool) => tool.id), 'png-to-pdf']);

// Old AJN URLs stay useful, but execute the same canonical backend processor.
// This prevents duplicate pages from drifting into broken or fake implementations.
const SERVER_ALIASES: Record<string, string> = {
  'word-pdf': 'word-to-pdf',
  'excel-pdf': 'excel-to-pdf',
  'ppt-pdf': 'powerpoint-to-pdf',
  'pdf-word': 'pdf-to-word',
  'pdf-excel': 'pdf-to-excel',
  'pdf-ppt': 'pdf-to-powerpoint',
  'jpg-pdf': 'jpg-to-pdf',
  'pdf-jpg': 'pdf-to-jpg',
  'heic-pdf': 'heic-to-pdf',
  'html-pdf': 'html-to-pdf',
  'xml-pdf': 'xml-to-pdf',
  'json-pdf': 'json-to-pdf',
  'txt-pdf': 'txt-to-pdf',
  'pdf-epub': 'pdf-to-epub',
  'pdf-text': 'pdf-to-txt',
};

const TOOL_COMPONENTS: Record<string, any> = {
  // Core PDF suite
  'split-pdf': dynamic(() => import('./SplitPdf'), { ssr: false }),
  'compress-pdf': dynamic(() => import('./CompressPdf'), { ssr: false }),
  'rotate-pdf': dynamic(() => import('./RotatePdf'), { ssr: false }),
  'delete-pdf-pages': dynamic(() => import('./DeletePages'), { ssr: false }),
  'organize-pdf': dynamic(() => import('./OrganizePdf'), { ssr: false }),
  'crop-pdf': dynamic(() => import('./CropPdf'), { ssr: false }),
  'watermark-pdf': dynamic(() => import('./WatermarkPdf'), { ssr: false }),
  'page-number': dynamic(() => import('./AddNumbers'), { ssr: false }),
  'flatten-pdf': dynamic(() => import('./FlattenPdf'), { ssr: false }),
  'protect-pdf': dynamic(() => import('./ProtectPdf'), { ssr: false }),
  'unlock-pdf': dynamic(() => import('./UnlockPdf'), { ssr: false }),
  'repair-pdf': dynamic(() => import('./RepairPdf'), { ssr: false }),
  'compare-pdf': dynamic(() => import('./ComparePdf'), { ssr: false }),
  'add-text': dynamic(() => import('./AddText'), { ssr: false }),
  'add-image-to-pdf': dynamic(() => import('./AddImageToPdf'), { ssr: false }),

  // Browser-only image -> PDF conversions. These routes never require Cloud Run.
  'image-to-pdf': dynamic(() => import('./ImagesToPdf'), { ssr: false }),
  'jpg-to-pdf': dynamic(() => import('./ImagesToPdf'), { ssr: false }),
  'jpeg-to-pdf': dynamic(() => import('./ImagesToPdf'), { ssr: false }),
  'png-to-pdf': dynamic(() => import('./ImagesToPdf'), { ssr: false }),
  'webp-to-pdf': dynamic(() => import('./ImagesToPdf'), { ssr: false }),

  // Formats without a proven production processor remain unavailable rather than faked.
  'ppt-word': dynamic(() => import('./UnavailableTool'), { ssr: false }),
  'psd-pdf': dynamic(() => import('./UnavailableTool'), { ssr: false }),
  'remove-bg': dynamic(() => import('./UnavailableTool'), { ssr: false }),
  'upscale-image': dynamic(() => import('./UnavailableTool'), { ssr: false }),
  'blur-face': dynamic(() => import('./UnavailableTool'), { ssr: false }),
  'smart-read': dynamic(() => import('./UnavailableTool'), { ssr: false }),
  'pdf-a': dynamic(() => import('./UnavailableTool'), { ssr: false }),

  // Image tools that are intentionally browser-native.
  'extract-images': dynamic(() => import('./ExtractImages'), { ssr: false }),
  'photo-editor': dynamic(() => import('./PhotoEditor'), { ssr: false }),
  'crop-image': dynamic(() => import('./CropImage'), { ssr: false }),
  'rotate-image': dynamic(() => import('./RotateImage'), { ssr: false }),
  'watermark-image': dynamic(() => import('./WatermarkImage'), { ssr: false }),
  'flip-image': dynamic(() => import('./FlipImage'), { ssr: false }),
  'convert-image': dynamic(() => import('./ConvertImage'), { ssr: false }),
  'meme-generator': dynamic(() => import('./MemeMaker'), { ssr: false }),
  'image-reducer': dynamic(() => import('./ReduceImage'), { ssr: false }),
  'image-resizer': dynamic(() => import('./ResizeImage'), { ssr: false }),

  // Signing
  'sign-pdf': dynamic(() => import('./SignPdfStudio'), { ssr: false }),

  // Other local utilities
  'pdf-zip-extract': dynamic(() => import('./PdfToZip'), { ssr: false }),
  'zip-extractor': dynamic(() => import('./ZipExtractor'), { ssr: false }),
  'pdf-metadata': dynamic(() => import('./PdfMetadata'), { ssr: false }),
  'subtitle-generator': dynamic(() => import('./SubtitleGenerator'), { ssr: false }),
};

interface ToolWorkspaceClientProps { id: string; }

export function ToolWorkspaceClient({ id }: ToolWorkspaceClientProps) {
  const toolData = BUILD_PUBLIC_TOOLS.find(t => t.id === id);
  if (!toolData) notFound();

  const serverToolId = BROWSER_IMAGE_TO_PDF_IDS.has(id) ? null : (SERVER_ALIASES[id] || (SERVER_CONVERSION_IDS.has(id) ? id : null));
  const r19FidelityIds = new Set([
    'word-to-pdf','doc-to-pdf','docx-to-pdf','excel-to-pdf','xls-to-pdf','xlsx-to-pdf',
    'powerpoint-to-pdf','ppt-to-pdf','pptx-to-pdf','odt-to-pdf','ods-to-pdf','odp-to-pdf',
    'pdf-to-word','pdf-to-docx','pdf-to-excel','pdf-to-xlsx','pdf-to-csv','pdf-to-powerpoint','pdf-to-pptx']);
  if (serverToolId && r19FidelityIds.has(serverToolId)) {
    return (
      <Suspense fallback={<PlatformLoader message="Preparing fidelity workspace..." />}>
        <div className="h-full flex flex-col"><OfficeConversionTool toolId={serverToolId} /></div>
      </Suspense>
    );
  }
  if (serverToolId) {
    return (
      <Suspense fallback={<PlatformLoader message="Preparing conversion workspace..." />}>
        <div className="h-full flex flex-col"><ServerConversionTool toolId={serverToolId} /></div>
      </Suspense>
    );
  }

  const ToolComponent = id === 'merge-pdf' ? MergePdf : TOOL_COMPONENTS[id];
  if (!ToolComponent) notFound();
  return (
    <Suspense fallback={<PlatformLoader message="Preparing tool workspace..." />}>
      <div className="h-full flex flex-col"><ToolComponent /></div>
    </Suspense>
  );
}
