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

/** AJN Universal Tool Connector — browser-native processors take precedence over server fallbacks. */
const BROWSER_CONVERSION_IDS = new Set([
  'image-to-pdf',
  'jpg-to-pdf',
  'jpeg-to-pdf',
  'png-to-pdf',
  'webp-to-pdf',
  'heic-to-pdf',
  'pdf-to-jpg',
  'pdf-to-png',
  'txt-to-pdf',
  'html-to-pdf',
  'markdown-to-pdf',
  'json-to-pdf',
  'xml-to-pdf',
]);

const SERVER_CONVERSION_IDS = new Set(CONVERSION_TOOLS.map((tool) => tool.id));

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
  'edit-pdf': dynamic(() => import('./PdfEditorLab'), { ssr: false }),
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

  // Browser-only image/PDF conversions.
  'image-to-pdf': dynamic(() => import('./ImagesToPdf'), { ssr: false }),
  'jpg-to-pdf': dynamic(() => import('./ImagesToPdf'), { ssr: false }),
  'jpeg-to-pdf': dynamic(() => import('./ImagesToPdf'), { ssr: false }),
  'png-to-pdf': dynamic(() => import('./ImagesToPdf'), { ssr: false }),
  'webp-to-pdf': dynamic(() => import('./ImagesToPdf'), { ssr: false }),
  'heic-to-pdf': dynamic(() => import('./HeicToPdf'), { ssr: false }),
  'pdf-to-jpg': dynamic(() => import('./PdfToJpg'), { ssr: false }),
  'pdf-to-png': dynamic(() => import('./PdfToJpg'), { ssr: false }),

  // Browser-only text/markup conversions.
  'txt-to-pdf': dynamic(() => import('./TxtToPdf'), { ssr: false }),
  'json-to-pdf': dynamic(() => import('./JsonToPdf'), { ssr: false }),
  'xml-to-pdf': dynamic(() => import('./XmlToPdf'), { ssr: false }),
  'html-to-pdf': dynamic(() => import('./TextMarkupToPdf'), { ssr: false }),
  'markdown-to-pdf': dynamic(() => import('./TextMarkupToPdf'), { ssr: false }),

  // Formats without a proven production processor remain unavailable rather than faked.
  'ppt-word': dynamic(() => import('./UnavailableTool'), { ssr: false }),
  'psd-pdf': dynamic(() => import('./UnavailableTool'), { ssr: false }),
  'remove-bg': dynamic(() => import('./UnavailableTool'), { ssr: false }),
  'upscale-image': dynamic(() => import('./UnavailableTool'), { ssr: false }),
  'blur-face': dynamic(() => import('./UnavailableTool'), { ssr: false }),
  'smart-read': dynamic(() => import('./UnavailableTool'), { ssr: false }),
  'pdf-a': dynamic(() => import('./UnavailableTool'), { ssr: false }),

  'extract-images': dynamic(() => import('./ExtractImages'), { ssr: false }),
  'sign-pdf': dynamic(() => import('./SignPdfStudio'), { ssr: false }),
  'pdf-zip-extract': dynamic(() => import('./PdfToZip'), { ssr: false }),
  'pdf-metadata': dynamic(() => import('./PdfMetadata'), { ssr: false }),
};

interface ToolWorkspaceClientProps { id: string; }

export function ToolWorkspaceClient({ id }: ToolWorkspaceClientProps) {
  const toolData = BUILD_PUBLIC_TOOLS.find((tool) => tool.id === id);
  if (!toolData) notFound();

  const serverToolId = BROWSER_CONVERSION_IDS.has(id)
    ? null
    : (SERVER_ALIASES[id] || (SERVER_CONVERSION_IDS.has(id) ? id : null));

  const fidelityIds = new Set([
    'word-to-pdf','doc-to-pdf','docx-to-pdf','excel-to-pdf','xls-to-pdf','xlsx-to-pdf',
    'powerpoint-to-pdf','ppt-to-pdf','pptx-to-pdf','odt-to-pdf','ods-to-pdf','odp-to-pdf',
    'pdf-to-word','pdf-to-docx','pdf-to-excel','pdf-to-xlsx','pdf-to-csv','pdf-to-powerpoint','pdf-to-pptx',
  ]);

  if (serverToolId && fidelityIds.has(serverToolId)) {
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
