import type { ServiceTool } from './tools-data';
import { getToolPolicy } from './tool-policy';
import { CONVERSION_TOOLS } from './conversion-tools';

export interface ToolEditorial {
  overview: string;
  details: string;
  tips: string[];
  limitations: string[];
  faqs: Array<{ question: string; answer: string }>;
}


const CONVERSION_IDS = new Set(CONVERSION_TOOLS.map((tool) => tool.id));

function conversionEditorial(tool: ServiceTool, processing: string, limitation: string): ToolEditorial {
  const [sourceLabel, outputLabel] = tool.name.includes(' to ') ? tool.name.split(' to ', 2) : ['source file', 'result'];
  const isRecognition = /|Scanned|Image to Text|Image to Word|Handwriting/i.test(tool.name);
  const isImage = tool.cat === 'img' || /JPG|JPEG|PNG|WEBP|TIFF|BMP|GIF|SVG|HEIC|AVIF|Image/i.test(tool.name);
  const isOffice = /Word|DOCX?|Excel|XLSX?|PowerPoint|PPTX?|ODT|RTF/i.test(tool.name);
  const overview = `${tool.name} converts ${sourceLabel.toLowerCase()} content into ${outputLabel.toLowerCase()} through a guided AJN PDF workflow. It is intended for users who need a clear download, format validation and an honest explanation of what may change during conversion.`;
  const details = `${processing} AJN PDF validates the selected format, applies the available conversion options, creates a separate output and returns it without replacing the source. ${isRecognition ? ' processing recognizes visible characters and should be reviewed when scans are faint, skewed or handwritten.' : isImage ? 'Resolution and quality settings can affect clarity, processing time and file size.' : isOffice ? 'Fonts, advanced layout objects, macros, formulas and animations may not translate exactly between document formats.' : 'Structured content is converted into a readable representation that may simplify advanced layout.'}`;
  const tips = [
    `Use a clear ${sourceLabel} source and keep the original until the ${outputLabel} result has been checked.`,
    isRecognition ? 'Select the correct  language and use a sharp, high-contrast scan.' : isImage ? 'Choose a moderate resolution first, then increase it only when the output needs more detail.' : 'Open the result in the application that will be used by the recipient.',
    'Use a descriptive output filename and verify the downloaded file before sharing it.'];
  const limitations = [
    limitation,
    isRecognition ? 'Recognition accuracy depends on language data, scan quality, handwriting, tables and page structure.' : isOffice ? 'The conversion prioritizes a usable result but cannot guarantee pixel-perfect editing fidelity for every file.' : 'Unusual embedded objects, damaged files and unsupported codecs can prevent conversion.'];
  return {
    overview,
    details,
    tips,
    limitations,
    faqs: [
      { question: `What files can I use with ${tool.name}?`, answer: `The upload control lists the extensions accepted by ${tool.name}. Files that do not match the selected converter are rejected before processing.` },
      { question: `Are files stored after ${tool.name} finishes?`, answer: processing },
      { question: `Will ${tool.name} preserve the exact original layout?`, answer: limitations[1] },
      { question: `What should I check after using ${tool.name}?`, answer: `Open the downloaded ${outputLabel} file, confirm that every expected page or section is present, and compare important text, images, tables and formatting with the source.` }],
  };
}

const CUSTOM: Record<string, Partial<ToolEditorial>> = {
  'edit-pdf': {
    overview: 'Edit PDF is AJN PDF’s full browser editing workspace for practical document corrections. Use it to change dates, names, numbers and amounts, replace visible text, add new text, insert images or signatures, highlight content, and manage pages without sending the PDF to a file-processing server.',
    details: 'Smart Replace reads the PDF text layer with PDF.js, captures the selected text position, size, baseline, width and available font information, then creates a replacement at the same location. When a PDF uses scanned content, unusual glyphs or a font that cannot be reproduced cleanly, Manual Edit provides Whiteout plus Add Text so the visible document can still be corrected. AJN PDF keeps edit operations in the browser and creates a new downloadable PDF with pdf-lib; the source file is not overwritten.',
    tips: [
      'Click detected text when changing a date, name, number or amount so position and font metrics can be reused.',
      'Use Manual Whiteout plus Add Text for scans, flattened text or unusual embedded fonts.',
      'Check font match, baseline, spacing and alignment in the live preview before downloading.',
      'Keep the original PDF until the edited download has been opened and verified.'
    ],
    limitations: [
      'PDF files are not Word documents. Some PDFs use subset, proprietary, vector or glyph-based fonts that cannot be reproduced exactly; AJN PDF uses the closest available visual match and shows the match status.',
      'Image-only scanned text has no normal PDF text layer. Manual editing still works, while automatic OCR is a separate capability.',
      'Whiteout is a visual cover and should not be treated as secure redaction of sensitive underlying PDF content.'
    ],
    faqs: [
      { question: 'Can I edit existing text in a PDF with AJN PDF?', answer: 'For PDFs with a usable text layer, click detected text to create a smart replacement that keeps its position, size, baseline and available font characteristics. Difficult PDFs can use Manual Whiteout plus Add Text.' },
      { question: 'Can I change a date, name or amount in a PDF?', answer: 'Yes. These short corrections are a primary Edit PDF workflow. Select the existing text, enter the new value, review the font and alignment match, then download the new PDF.' },
      { question: 'Does Edit PDF upload my document to a processing server?', answer: 'The Edit PDF processor is browser-only. PDF rendering, text analysis, editing state and PDF export run in the active browser session. Local crash recovery uses IndexedDB on the same device.' },
      { question: 'Will the replacement use exactly the same font?', answer: 'AJN PDF analyzes the PDF font reference, family, size, style, baseline and width. Exact reuse is not possible for every embedded or subset font, so the editor reports Visual Match, Family Match or Fallback instead of silently claiming a perfect match.' }
    ],
  },

  'merge-pdf': {
    overview: 'Merge PDF combines two or more PDF documents into one file in the exact order you choose. It is useful for joining reports, scanned pages, forms, invoices, assignments, and supporting documents before sharing or archiving them.',
    details: 'AJN PDF reads the selected documents, copies their pages into a new PDF, and preserves the original page sequence. You can reorder the uploaded files, remove an item before processing, choose pages from each document, and set a clear output filename. The original files are not modified.',
    tips: ['Place files in their final reading order before merging.', 'Open password-protected files with the correct password before using them.', 'Check mixed portrait and landscape pages in the downloaded result.'],
    limitations: ['Digital signatures on source PDFs may no longer validate after pages are copied into a new file.', 'Interactive forms, bookmarks, and unusual embedded attachments may not be preserved in every document.'],
  },
  'split-pdf': {
    overview: 'Split PDF extracts selected pages or divides one document into smaller PDF files. Use it to separate chapters, forms, invoices, certificates, or confidential sections without editing the original document.',
    details: 'You can enter page ranges such as 1-3,5,8-10, split every page, or divide the document at fixed intervals. AJN PDF validates the requested ranges against the real page count and can package multiple outputs into a ZIP file for easier download.',
    tips: ['Use commas to combine separate pages and ranges.', 'Preview the total number of output files before processing.', 'Keep the original PDF until you confirm every extracted page is present.'],
    limitations: ['Splitting does not remove content hidden inside a selected page.', 'Bookmarks and document-level attachments may not be copied into every output file.'],
  },
  'compress-pdf': {
    overview: 'Compress PDF reduces file size so documents are easier to email, upload, and store. AJN PDF offers selectable quality settings rather than using one aggressive compression level for every document.',
    details: 'The balanced mode aims to reduce image data while keeping ordinary screen readability. Strong compression may rasterize pages to achieve a smaller result. When rasterization is used, searchable text, links, form fields, and accessibility information can be reduced or lost, so the downloaded file should always be reviewed.',
    tips: ['Choose a target smaller than the original PDF.', 'Very small targets can reduce page clarity.', 'Check the downloaded PDF before deleting the original.'],
    limitations: ['Already optimized PDFs may become only slightly smaller.', 'Strong compression can reduce text searchability and link functionality.'],
  },
  'rotate-pdf': {
    overview: 'Rotate PDF corrects pages that were scanned or saved sideways or upside down. You can rotate all pages or only selected pages without changing their visible content.',
    details: 'The tool changes the page rotation value and creates a new PDF. It supports clockwise, counter-clockwise, and 180-degree rotation. Mixed documents can be corrected page by page before download.',
    tips: ['Check pages with tables and signatures after rotation.', 'Use page thumbnails to avoid rotating pages that are already correct.', 'Keep the original document as a backup.'],
    limitations: ['Rotation changes page orientation but does not deskew a tilted scan.', 'Content cropped outside the page boundary cannot be recovered by rotating.'],
  },
  'organize-pdf': {
    overview: 'Organize PDF helps you arrange pages visually before creating a clean final document. It is designed for reports, portfolios, scanned bundles, and documents assembled from several sources.',
    details: 'Drag pages into a new order, rotate pages, remove unwanted pages, or duplicate a page when the tool supports it. The downloaded PDF follows the final visible order shown in the workspace.',
    tips: ['Review the first and last page after reordering.', 'Use clear page thumbnails when working with similar scanned pages.', 'Download and open the result before discarding the source.'],
    limitations: ['Reordering pages can invalidate existing digital signatures.', 'Document bookmarks may not automatically follow the new page order.'],
  },
  'watermark-pdf': {
    overview: 'Watermark PDF places visible text or an image on selected pages. Common uses include marking drafts, adding a company name, identifying confidential copies, or placing a logo on distributed documents.',
    details: 'Choose the watermark content, position, rotation, size, colour, and opacity. A lighter opacity keeps the underlying document readable, while a repeated watermark provides broader coverage. The result is a new PDF and the source remains unchanged.',
    tips: ['Use moderate opacity so text remains readable.', 'Preview the watermark on both light and dark page areas.', 'Avoid covering signatures, totals, QR codes, or legal clauses.'],
    limitations: ['A visible watermark is not DRM and cannot guarantee that content will not be copied.', 'Complex transparency and unusual page boxes may render differently in some viewers.'],
  },
  'page-number': {
    overview: 'Page Numbers adds consistent numbering to a PDF for reports, manuals, submissions, and printed documents. You can control the starting number, placement, margins, prefix, and suffix.',
    details: 'AJN PDF draws page labels onto the selected pages and creates a new file. Options can skip a cover page, number only a range, or display formats such as “Page 1 of 10”.',
    tips: ['Leave enough margin so numbers are not clipped when printed.', 'Skip the cover page when the document format requires it.', 'Check pages that already contain headers or footers.'],
    limitations: ['Added numbers are visible page content, not dynamic PDF page-label metadata.', 'Existing page numbers are not automatically detected or removed.'],
  },
  'jpg-pdf': {
    overview: 'JPG to PDF converts one or more images into a PDF in your chosen order. It is useful for scanned receipts, photographs of documents, portfolios, forms, and image-based submissions.',
    details: 'Choose page size, orientation, margins, image fit, background colour, and output quality. Each image can be placed on its own page, and the final PDF follows the order shown in the file list.',
    tips: ['Rotate phone photos before conversion.', 'Use contain mode to avoid cropping image edges.', 'Choose A4 or Letter when the PDF will be printed.'],
    limitations: ['Image-based PDFs do not contain searchable text unless  is applied separately.', 'Very large photos may use significant browser memory during conversion.'],
  },
  'pdf-jpg': {
    overview: 'PDF to JPG or PNG renders selected PDF pages as image files. This is useful for previews, slides, social posts, thumbnails, and systems that do not accept PDF uploads.',
    details: 'Select a page range, image format, resolution, and quality. Multiple page images can be downloaded together as a ZIP archive. PNG generally preserves sharp graphics, while JPG usually creates smaller photographic files.',
    tips: ['Use PNG for diagrams, text-heavy pages, and transparency.', 'Use JPG for photographs and smaller downloads.', 'Increase resolution only when the output will be printed or enlarged.'],
    limitations: ['Rendered images are not editable PDF pages and do not contain selectable text.', 'Higher resolution increases processing time, memory use, and output size.'],
  },
  'pdf-text': {
    overview: 'PDF to Text extracts text that already exists inside a PDF. It is useful for copying paragraphs, searching document content, creating notes, and moving text into another editor.',
    details: 'The tool reads the PDF text layer and keeps basic line breaks where possible. It does not perform optical character recognition on photographed or scanned pages that contain no embedded text.',
    tips: ['Use  for scanned documents with no selectable text.', 'Review columns, tables, and headers after extraction.', 'Do not assume the extracted reading order is perfect in complex layouts.'],
    limitations: ['Scanned image-only PDFs require .', 'Tables, columns, equations, and decorative layouts may not preserve their original order.'],
  },
  'sign-pdf': {
    overview: 'Sign PDF places a visual electronic signature, typed name, initials, or uploaded signature image onto a PDF. It is intended for documents that accept a visible electronic signature.',
    details: 'You can position and resize the visual signature before exporting a new PDF. The operation adds visible page content; it does not create a certificate-backed cryptographic signature or a PAdES validation record.',
    tips: ['Confirm the recipient accepts visual electronic signatures.', 'Place the signature without covering important text.', 'Keep an unsigned original copy.'],
    limitations: ['This is not certificate-based digital signing.', 'The tool does not verify signer identity or create a trusted timestamp.'],
  },
  'protect-pdf': {
    overview: 'Protect PDF applies password encryption to a document with secure online processing. It is intended for files you are authorised to secure before sharing or storage.',
    details: 'The selected file is uploaded only for this request, protected with the chosen password and permissions, returned to your browser, and temporary request files are scheduled for cleanup. Passwords are not stored or written to application logs.',
    tips: ['Use a long, unique password and share it through a separate channel.', 'Test the protected file in another PDF viewer.', 'Keep an unencrypted backup in a secure location.'],
    limitations: ['Encryption cannot prevent an authorised recipient from photographing or reproducing visible content.', 'This tool requires online availability.'],
  },
  'unlock-pdf': {
    overview: 'Unlock PDF removes encryption only when the current valid password is supplied and the user confirms ownership or authorisation. AJN PDF does not guess, brute-force, or bypass unknown passwords.',
    details: 'AJN PDF securely validates the supplied password, prepares an unprotected copy for download, and schedules temporary request data for cleanup. The original encrypted PDF remains unchanged.',
    tips: ['Use this tool only for documents you own or are authorised to modify.', 'Confirm the downloaded file opens without a password.', 'Store sensitive unlocked copies securely.'],
    limitations: ['The current valid password is required.', 'This tool requires online availability.'],
  },
  'repair-pdf': {
    overview: 'Repair PDF attempts to recover documents with minor structural problems such as damaged cross-reference information or incomplete internal indexing.',
    details: 'AJN PDF securely analyzes the file, rebuilds a clean output when possible, and returns a separate repaired copy. The original file is never overwritten.',
    tips: ['Try opening the result in more than one PDF viewer.', 'Compare the recovered page count with the original.', 'Keep the damaged source in case another recovery method is needed.'],
    limitations: ['Severely truncated, encrypted, or overwritten data may be impossible to recover.', 'Successful opening does not guarantee every embedded object was restored.'],
  },
};

export function getToolEditorial(tool: ServiceTool): ToolEditorial {
  const policy = getToolPolicy(tool.id);
  const custom = CUSTOM[tool.id] || {};
  const processing = policy.processingMode === 'browser'
    ? 'This workflow handles supported files within the active session. Keep the page open until your result is ready.'
    : 'This workflow uploads the selected file only for the active request. Temporary request files are scheduled for cleanup after the result is returned.';

  if (CONVERSION_IDS.has(tool.id)) {
    return conversionEditorial(tool, processing, policy.limitation || 'Conversion quality depends on the source format and the available processing engine.');
  }

  const overview = custom.overview || `${tool.name} provides a focused workflow for this task. ${tool.desc} Review the available controls before processing, then check the downloaded result before replacing the source file.`;
  const details = custom.details || `${processing} Follow the on-screen options, review the selected file and settings, then open the downloaded result in a trusted viewer before replacing the original.`;
  const limitations = custom.limitations || [
    policy.limitation || 'Complex documents can contain forms, scripts, embedded files, fonts, and viewer-specific features that may not be preserved by every browser-based operation.',
    'Always keep the source file until the downloaded result has been checked.'];

  const tips = custom.tips || [
    ...tool.instructions.map((item) => `${item}.`),
    'Use a clear output filename and verify the downloaded result.'];

  return {
    overview,
    details,
    tips,
    limitations,
    faqs: custom.faqs || [
      {
        question: `Is ${tool.name} free to use?`,
        answer: `Yes. The current AJN PDF production version provides ${tool.name} without a subscription. File safety requirements are enforced automatically by the workflow; the AJN PDF limits page documents the current processing policy.`,
      },
      {
        question: `Does AJN PDF store files used with ${tool.name}?`,
        answer: processing,
      },
      {
        question: `Will ${tool.name} preserve every PDF feature?`,
        answer: limitations[0],
      }],
  };
}
