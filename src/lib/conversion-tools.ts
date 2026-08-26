import { BookOpen, Code2, FileArchive, FileImage, FileJson, FileSpreadsheet, FileText, Globe2, ImageIcon, Mail, Presentation } from 'lucide-react';
import type { ServiceTool } from './tools-data';

const commonBenefits = ['Clear input validation', 'Automatic output download', 'Temporary files deleted after processing'];

function tool(
  id: string,
  name: string,
  desc: string,
  icon: ServiceTool['icon'],
  category: 'pdf' | 'img',
  keywords: string[],
  limitation?: string,
): ServiceTool {
  return {
    id,
    name,
    desc,
    icon,
    tag: 'convert',
    cat: category,
    mode: category === 'img' ? 'Image' : 'PDF',
    color: category === 'img' ? 'text-emerald-600' : 'text-blue-600',
    perfIndex: limitation ? 'Best effort' : 'Production',
    benefits: commonBenefits,
    useCases: ['Document conversion', 'File compatibility', 'Sharing and archiving'],
    instructions: ['Choose the source file', 'Review conversion options', 'Convert and download the result'],
    keywords,
  };
}

export const CONVERSION_TOOLS: ServiceTool[] = [
  // Image -> PDF
  tool('image-to-pdf', 'Image to PDF', 'Combine supported image formats into one PDF document.', FileImage, 'img', ['image to pdf', 'photos to pdf', 'multiple images pdf']),
  tool('jpg-to-pdf', 'JPG to PDF', 'Convert one or more JPG images into a PDF document.', FileImage, 'img', ['jpg to pdf', 'photo to pdf', 'jpeg pdf']),
  tool('jpeg-to-pdf', 'JPEG to PDF', 'Convert one or more JPEG images into a PDF document.', FileImage, 'img', ['jpeg to pdf', 'jpeg image pdf']),
  tool('webp-to-pdf', 'WEBP to PDF', 'Convert WEBP images into a shareable PDF document.', FileImage, 'img', ['webp to pdf', 'web image pdf']),
  tool('tiff-to-pdf', 'TIFF to PDF', 'Convert single-page or multipage TIFF files into PDF.', FileImage, 'img', ['tiff to pdf', 'tif pdf', 'multipage tiff pdf']),
  tool('bmp-to-pdf', 'BMP to PDF', 'Convert bitmap images into a PDF document.', FileImage, 'img', ['bmp to pdf', 'bitmap pdf']),
  tool('gif-to-pdf', 'GIF to PDF', 'Convert GIF frames into PDF pages.', FileImage, 'img', ['gif to pdf', 'animated gif pdf'], 'Animated GIF frames become individual PDF pages.'),
  tool('svg-to-pdf', 'SVG to PDF', 'Render SVG artwork into a PDF document.', Code2, 'img', ['svg to pdf', 'vector image pdf']),
  tool('heic-to-pdf', 'HEIC to PDF', 'Convert HEIC and HEIF photos into PDF pages.', FileImage, 'img', ['heic to pdf', 'iphone photo pdf'], 'HEIC support depends on the HEIF converter available for the current deployment.'),

  // PDF -> image
  tool('pdf-to-image', 'PDF to Image', 'Render PDF pages as PNG images. Multi-page results are downloaded together as a ZIP.', ImageIcon, 'img', ['pdf to image', 'pdf pages images']),
  tool('pdf-to-jpg', 'PDF to JPG', 'Render PDF pages as JPG images. Multi-page results are downloaded together as a ZIP.', ImageIcon, 'img', ['pdf to jpg', 'pdf jpeg']),
  tool('pdf-to-jpeg', 'PDF to JPEG', 'Render PDF pages as JPEG images. Multi-page results are downloaded together as a ZIP.', ImageIcon, 'img', ['pdf to jpeg', 'pdf jpg']),
  tool('pdf-to-png', 'PDF to PNG', 'Render PDF pages as high-quality PNG images. Multi-page results are downloaded together as a ZIP.', ImageIcon, 'img', ['pdf to png', 'pdf image']),
  tool('pdf-to-webp', 'PDF to WEBP', 'Render PDF pages as compact WEBP images. Multi-page results are downloaded together as a ZIP.', ImageIcon, 'img', ['pdf to webp', 'web image from pdf']),
  tool('pdf-to-tiff', 'PDF to TIFF', 'Convert PDF pages into a multipage TIFF file.', ImageIcon, 'img', ['pdf to tiff', 'pdf tif']),
  tool('pdf-to-bmp', 'PDF to BMP', 'Render PDF pages as BMP images. Multi-page results are downloaded together as a ZIP.', ImageIcon, 'img', ['pdf to bmp', 'pdf bitmap']),
  tool('pdf-to-gif', 'PDF to GIF', 'Convert PDF pages into an animated GIF.', ImageIcon, 'img', ['pdf to gif', 'pdf animation']),
  tool('pdf-to-svg', 'PDF to SVG', 'Export PDF pages as SVG files. Multi-page results are downloaded together as a ZIP.', Code2, 'img', ['pdf to svg', 'pdf vector export'], 'Vector fidelity depends on the original PDF content.'),
  tool('pdf-to-avif', 'PDF to AVIF', 'Render PDF pages as AVIF images. Multi-page results are downloaded together as a ZIP.', ImageIcon, 'img', ['pdf to avif', 'avif from pdf'], 'AVIF output requires an available AVIF encoder.'),
  tool('pdf-to-heic', 'PDF to HEIC', 'Render PDF pages as HEIC images. Multi-page results are downloaded together as a ZIP.', ImageIcon, 'img', ['pdf to heic', 'heic from pdf'], 'HEIC output requires an available HEIF encoder.'),
  tool('pdf-pages-to-zip', 'PDF Pages to ZIP', 'Split a PDF into individual one-page PDFs inside a ZIP archive.', FileArchive, 'pdf', ['pdf pages zip', 'split pdf zip', 'individual pdf pages']),

  // PDF -> document
  tool('pdf-to-word', 'PDF to Word', 'Reconstruct selectable PDF text, tables, basic formatting and optional embedded images into an editable DOCX document.', FileText, 'pdf', ['pdf to word', 'pdf docx', 'editable pdf'], 'Complex layouts, uncommon fonts and advanced embedded objects may still require editing.'),
  tool('pdf-to-docx', 'PDF to DOCX', 'Reconstruct selectable PDF text, tables, basic formatting and optional embedded images into an editable DOCX document.', FileText, 'pdf', ['pdf to docx', 'pdf word conversion'], 'Complex layouts, uncommon fonts and advanced embedded objects may still require editing.'),
  tool('pdf-to-txt', 'PDF to TXT', 'Extract selectable text from PDF pages into a TXT file.', FileText, 'pdf', ['pdf to txt', 'extract pdf text']),
  tool('pdf-to-rtf', 'PDF to RTF', 'Convert PDF text into a Rich Text Format document.', FileText, 'pdf', ['pdf to rtf', 'rich text pdf'], 'Preserves text rather than exact page design.'),
  tool('pdf-to-odt', 'PDF to ODT', 'Create an editable OpenDocument text file from PDF text.', FileText, 'pdf', ['pdf to odt', 'open document pdf'], 'Complex layouts may require editing.'),
  tool('pdf-to-html', 'PDF to HTML', 'Convert PDF text into readable HTML sections.', Code2, 'pdf', ['pdf to html', 'pdf web page'], 'Advanced positioning and complex graphics may change.'),
  tool('pdf-to-markdown', 'PDF to Markdown', 'Extract PDF text into a Markdown document.', Code2, 'pdf', ['pdf to markdown', 'pdf md']),
  tool('pdf-to-xml', 'PDF to XML', 'Export PDF page text in a structured XML document.', Code2, 'pdf', ['pdf to xml', 'structured pdf text']),
  tool('pdf-to-json', 'PDF to JSON', 'Export PDF page text and line data as JSON.', FileJson, 'pdf', ['pdf to json', 'pdf data json']),
  tool('pdf-to-csv', 'PDF to CSV', 'Export detected PDF tables into CSV.', FileSpreadsheet, 'pdf', ['pdf to csv', 'pdf table csv'], 'If no structured table is detected, the conversion stops instead of fabricating a table.'),
  tool('pdf-to-excel', 'PDF to Excel', 'Export detected PDF tables into an XLSX workbook.', FileSpreadsheet, 'pdf', ['pdf to excel', 'pdf spreadsheet'], 'Complex tables may require correction; unstructured fallback is optional.'),
  tool('pdf-to-xlsx', 'PDF to XLSX', 'Export detected PDF tables into an XLSX workbook.', FileSpreadsheet, 'pdf', ['pdf to xlsx', 'pdf excel'], 'Complex tables may require correction; unstructured fallback is optional.'),
  tool('pdf-to-powerpoint', 'PDF to PowerPoint', 'Convert PDF pages into PPTX with preserve-appearance or editable reconstruction modes.', Presentation, 'pdf', ['pdf to powerpoint', 'pdf pptx'], 'Editable reconstruction is best effort for complex page layouts.'),
  tool('pdf-to-pptx', 'PDF to PPTX', 'Convert PDF pages into PPTX with preserve-appearance or editable reconstruction modes.', Presentation, 'pdf', ['pdf to pptx', 'pdf powerpoint'], 'Editable reconstruction is best effort for complex page layouts.'),
  tool('pdf-to-epub', 'PDF to EPUB', 'Create a reflowable EPUB eBook from extracted PDF text.', BookOpen, 'pdf', ['pdf to epub', 'pdf ebook'], 'Complex page designs become a simpler reflowable reading layout.'),
  tool('pdf-to-mobi', 'PDF to MOBI', 'Create a MOBI eBook from extracted PDF text.', BookOpen, 'pdf', ['pdf to mobi', 'kindle mobi pdf'], 'Requires the Calibre converter to be available for the current deployment.'),
  tool('pdf-to-azw3', 'PDF to AZW3', 'Create an AZW3 Kindle eBook from extracted PDF text.', BookOpen, 'pdf', ['pdf to azw3', 'kindle pdf conversion'], 'Requires the Calibre converter to be available for the current deployment.'),

  // Document -> PDF
  tool('word-to-pdf', 'Word to PDF', 'Convert DOC or DOCX documents into PDF.', FileText, 'pdf', ['word to pdf', 'docx pdf', 'doc pdf'], 'Complex fonts, macros and layouts may render differently.'),
  tool('doc-to-pdf', 'DOC to PDF', 'Convert legacy DOC documents into PDF.', FileText, 'pdf', ['doc to pdf', 'old word pdf'], 'Requires the LibreOffice converter to be available for the current deployment.'),
  tool('docx-to-pdf', 'DOCX to PDF', 'Convert DOCX documents into PDF.', FileText, 'pdf', ['docx to pdf', 'word file pdf'], 'Complex fonts and layouts may render differently.'),
  tool('txt-to-pdf', 'TXT to PDF', 'Turn plain text files into clean PDF documents.', FileText, 'pdf', ['txt to pdf', 'text file pdf']),
  tool('rtf-to-pdf', 'RTF to PDF', 'Convert Rich Text Format files into PDF.', FileText, 'pdf', ['rtf to pdf', 'rich text pdf'], 'Advanced RTF formatting is simplified.'),
  tool('odt-to-pdf', 'ODT to PDF', 'Convert OpenDocument text files into PDF.', FileText, 'pdf', ['odt to pdf', 'open document pdf'], 'Requires the LibreOffice converter to be available for the current deployment.'),
  tool('ods-to-pdf', 'ODS to PDF', 'Convert OpenDocument spreadsheets into PDF.', FileSpreadsheet, 'pdf', ['ods to pdf', 'open document spreadsheet pdf'], 'Requires the LibreOffice converter; print areas and charts may render differently.'),
  tool('odp-to-pdf', 'ODP to PDF', 'Convert OpenDocument presentations into PDF.', Presentation, 'pdf', ['odp to pdf', 'open document presentation pdf'], 'Requires the LibreOffice converter; animations and transitions are not included.'),
  tool('html-to-pdf', 'HTML to PDF', 'Create a readable PDF from an HTML file.', Code2, 'pdf', ['html to pdf', 'web page file pdf'], 'Browser-only scripts and complex external CSS are not executed.'),
  tool('url-to-pdf', 'URL to PDF', 'Create a readable PDF snapshot from a public web URL.', Globe2, 'pdf', ['url to pdf', 'website to pdf', 'web page pdf'], 'JavaScript-heavy pages may not match a full browser screenshot.'),
  tool('markdown-to-pdf', 'Markdown to PDF', 'Render a Markdown file as a clean PDF document.', Code2, 'pdf', ['markdown to pdf', 'md to pdf']),
  tool('xml-to-pdf', 'XML to PDF', 'Format XML content into a readable PDF report.', Code2, 'pdf', ['xml to pdf', 'xml report pdf']),
  tool('json-to-pdf', 'JSON to PDF', 'Format JSON content into a readable PDF report.', FileJson, 'pdf', ['json to pdf', 'json report pdf']),
  tool('csv-to-pdf', 'CSV to PDF', 'Convert CSV rows into a readable PDF report.', FileSpreadsheet, 'pdf', ['csv to pdf', 'spreadsheet text pdf']),
  tool('excel-to-pdf', 'Excel to PDF', 'Convert XLS or XLSX workbooks into PDF.', FileSpreadsheet, 'pdf', ['excel to pdf', 'spreadsheet pdf'], 'Print areas, formulas and charts may render differently.'),
  tool('xls-to-pdf', 'XLS to PDF', 'Convert legacy XLS workbooks into PDF.', FileSpreadsheet, 'pdf', ['xls to pdf', 'old excel pdf'], 'Requires the LibreOffice converter to be available for the current deployment.'),
  tool('xlsx-to-pdf', 'XLSX to PDF', 'Convert XLSX workbooks into PDF.', FileSpreadsheet, 'pdf', ['xlsx to pdf', 'excel file pdf'], 'Print areas, formulas and charts may render differently.'),
  tool('powerpoint-to-pdf', 'PowerPoint to PDF', 'Convert PPT or PPTX presentations into PDF.', Presentation, 'pdf', ['powerpoint to pdf', 'slides pdf'], 'Animations and transitions are not included.'),
  tool('ppt-to-pdf', 'PPT to PDF', 'Convert legacy PPT presentations into PDF.', Presentation, 'pdf', ['ppt to pdf', 'old powerpoint pdf'], 'Requires the LibreOffice converter to be available for the current deployment.'),
  tool('pptx-to-pdf', 'PPTX to PDF', 'Convert PPTX presentations into PDF.', Presentation, 'pdf', ['pptx to pdf', 'powerpoint file pdf'], 'Animations and transitions are not included.'),
  tool('epub-to-pdf', 'EPUB to PDF', 'Convert a reflowable EPUB eBook into PDF.', BookOpen, 'pdf', ['epub to pdf', 'ebook pdf'], 'Page breaks are generated from reflowable eBook content.'),
  tool('mobi-to-pdf', 'MOBI to PDF', 'Convert a MOBI eBook into PDF.', BookOpen, 'pdf', ['mobi to pdf', 'kindle pdf'], 'Requires the Calibre converter to be available for the current deployment.'),
  tool('azw3-to-pdf', 'AZW3 to PDF', 'Convert an AZW3 Kindle eBook into PDF.', BookOpen, 'pdf', ['azw3 to pdf', 'kindle ebook pdf'], 'Requires the Calibre converter to be available for the current deployment.'),
  tool('eml-to-pdf', 'EML to PDF', 'Convert an email message into a readable PDF.', Mail, 'pdf', ['eml to pdf', 'email pdf'], 'Attachments are listed but are not embedded automatically.'),
  tool('msg-to-pdf', 'MSG to PDF', 'Convert an Outlook MSG email into a readable PDF.', Mail, 'pdf', ['msg to pdf', 'outlook email pdf'], 'Attachments are listed but are not embedded automatically.'),
  tool('xps-to-pdf', 'XPS to PDF', 'Convert an XPS document into PDF.', FileArchive, 'pdf', ['xps to pdf', 'microsoft xps pdf'], 'Requires a compatible XPS converter to be available for the current deployment.'),
];
