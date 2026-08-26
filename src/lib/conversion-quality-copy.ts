const QUALITY_LIMITATIONS: Record<string, string> = {
  'pdf-to-word': 'Creates editable, layout-aware Word content. Fixed-position designs, unusual fonts and highly complex tables may still need adjustment.',
  'pdf-to-docx': 'Creates editable, layout-aware Word content. Fixed-position designs, unusual fonts and highly complex tables may still need adjustment.',
  'pdf-to-excel': 'Extracts structured tables into real worksheets. If no table is detected, AJN PDF stops instead of creating a misleading spreadsheet.',
  'pdf-to-xlsx': 'Extracts structured tables into real worksheets. If no table is detected, AJN PDF stops instead of creating a misleading spreadsheet.',
  'pdf-to-csv': 'Extracts structured tables. If no table is detected, AJN PDF stops instead of turning arbitrary paragraph lines into CSV rows.',
  'pdf-to-powerpoint': 'Each PDF page becomes a slide image to preserve visual appearance. The slide content is not claimed to be fully editable.',
  'pdf-to-pptx': 'Each PDF page becomes a slide image to preserve visual appearance. The slide content is not claimed to be fully editable.',
  'pdf-to-avif': 'Available only when the production image has a real AVIF encoder. AJN PDF never returns another format renamed as AVIF.',
  'pdf-to-heic': 'Available only when the production image has a real HEIC encoder. AJN PDF never returns another format renamed as HEIC.',
  'xps-to-pdf': 'Uses the production XPS renderer and validates the generated PDF. Complex XPS effects and embedded fonts can render differently.',
};

export function conversionQualityLimitation(toolId: string, fallback?: string | null): string {
  return QUALITY_LIMITATIONS[toolId] || fallback || '';
}
