import { Layout, Shrink, FileText, Scissors, Maximize, Presentation, FileSpreadsheet, LayoutGrid, Trash2, RotateCw, Crop, ImageIcon, Stamp, Code2, FileDigit, FileArchive, FileEdit, Sparkles, ShieldCheck, Wrench, Diff, Layers, FileCode, Wand2, Maximize2, Smartphone, ArchiveRestore, Repeat, TabletSmartphone, Smile, FileJson, Brain, Type, PenTool, FolderOpen, Tag, RefreshCcw, Captions } from 'lucide-react';
import { isToolPublic } from './tool-policy';
import { CONVERSION_TOOLS } from './conversion-tools';

export interface ServiceTool {
  id: string;
  name: string;
  desc: string;
  icon: any;
  tag: string;
  cat: 'pdf' | 'img' | 'ai';
  mode: 'PDF' | 'Image' | 'AI';
  badge?: 'Popular' | 'Smart' | 'New';
  color: string;
  perfIndex: string;
  benefits: string[];
  useCases: string[];
  instructions: string[];
  keywords: string[];
}

export const ALL_TOOLS: ServiceTool[] = [
  // --- 1. PDF TOOLS ---
  {
    id: 'merge-pdf', name: 'Merge PDF', desc: 'Combine multiple PDFs into one file in the order you choose.',
    icon: Layout, tag: 'merge', cat: 'pdf', mode: 'PDF', badge: 'Popular', color: 'text-blue-500', perfIndex: 'Fast',
    benefits: ["Combine files quickly", "Flexible file order"],
    useCases: ["Combining reports"],
    instructions: ["Upload PDFs", "Sort", "Merge"],
    keywords: ["combine", "join", "concatenate", "bundle", "attach", "multiple pdf"]
  },
  {
    id: 'split-pdf', name: 'Split PDF', desc: 'Extract pages or split a PDF into smaller files.',
    icon: Scissors, tag: 'split', cat: 'pdf', mode: 'PDF', badge: 'Popular', color: 'text-purple-500', perfIndex: 'Precise',
    benefits: ["Extract exact pages", "Custom ranges"],
    useCases: ["Separating forms"],
    instructions: ["Upload PDF", "Pick pages", "Split"],
    keywords: ["extract", "separate", "cut", "divide", "break", "range", "pages"]
  },
  {
    id: 'compress-pdf', name: 'Compress PDF', desc: 'Compress a PDF toward the file size you need.',
    icon: Shrink, tag: 'compress', cat: 'pdf', mode: 'PDF', badge: 'Popular', color: 'text-emerald-500', perfIndex: 'Small',
    benefits: ["Save storage", "Clear quality"],
    useCases: ["Smaller resumes"],
    instructions: ["Upload PDF", "Enter target size", "Download"],
    keywords: ["shrink", "reduce", "size", "smaller", "optimization", "kb", "mb"]
  },
  {
    id: 'rotate-pdf', name: 'Rotate PDF', desc: 'Rotate selected pages or the entire PDF.',
    icon: RotateCw, tag: 'edit', cat: 'pdf', mode: 'PDF', color: 'text-amber-500', perfIndex: 'Correct',
    benefits: ["Fix orientation", "Batch rotation"],
    useCases: ["Fixing scans"],
    instructions: ["Upload PDF", "Rotate", "Save"],
    keywords: ["turn", "flip", "orientation", "landscape", "portrait", "upside down"]
  },
  {
    id: 'delete-pdf-pages', name: 'Remove Pages', desc: 'Remove selected pages from a PDF.',
    icon: Trash2, tag: 'edit', cat: 'pdf', mode: 'PDF', color: 'text-red-500', perfIndex: 'Clean',
    benefits: ["Quick deletion", "Visual selector"],
    useCases: ["Cleaning drafts"],
    instructions: ["Upload PDF", "Purge", "Download"],
    keywords: ["delete", "remove", "clean", "trash", "erase", "strip"]
  },
  {
    id: 'organize-pdf', name: 'Organize PDF', desc: 'Reorder PDF pages in a clear visual workflow.',
    icon: LayoutGrid, tag: 'edit', cat: 'pdf', mode: 'PDF', color: 'text-primary', perfIndex: 'Flexible',
    benefits: ["Sort pages visually", "Delete or add pages"],
    useCases: ["Building reports"],
    instructions: ["Upload PDF", "Sort", "Finalize"],
    keywords: ["reorder", "arrange", "manage", "move", "pages", "sequence"]
  },
  {
    id: 'crop-pdf', name: 'Crop PDF', desc: 'Trim margins and adjust the visible page area.',
    icon: Crop, tag: 'edit', cat: 'pdf', mode: 'PDF', color: 'text-orange-500', perfIndex: 'Precise',
    benefits: ["Remove white space", "Focus on text"],
    useCases: ["Adjusting prints"],
    instructions: ["Upload PDF", "Crop", "Download"],
    keywords: ["trim", "cut", "margins", "border", "size", "adjust"]
  },
  {
    id: 'watermark-pdf', name: 'Watermark PDF', desc: 'Add a text watermark to your PDF with a live preview.',
    icon: Stamp, tag: 'edit', cat: 'pdf', mode: 'PDF', color: 'text-slate-600', perfIndex: 'Brand',
    benefits: ["Text watermark", "Transparency control"],
    useCases: ["Protecting drafts"],
    instructions: ["Upload PDF", "Brand", "Save"],
    keywords: ["copyright", "logo", "stamp", "brand", "protect", "overlay", "text"]
  },
  {
    id: 'page-number', name: 'Page Numbers', desc: 'Add page numbers with placement and starting-number controls.',
    icon: FileDigit, tag: 'edit', cat: 'pdf', mode: 'PDF', color: 'text-indigo-500', perfIndex: 'Index',
    benefits: ["Custom start number", "Professional look"],
    useCases: ["Numbered reports"],
    instructions: ["Upload PDF", "Index", "Save"],
    keywords: ["pagination", "index", "footer", "header", "numbers", "numbering"]
  },
  {
    id: 'flatten-pdf', name: 'Flatten PDF', desc: 'Flatten supported interactive form fields into fixed page content.',
    icon: Layers, tag: 'edit', cat: 'pdf', mode: 'PDF', color: 'text-slate-700', perfIndex: 'Permanent',
    benefits: ["Fix supported form values", "Simpler form output"],
    useCases: ["Preparing completed forms"],
    instructions: ["Upload PDF", "Flatten supported form fields", "Download"],
    keywords: ["static", "layer", "forms", "merge layers", "lock"]
  },
  {
    id: 'protect-pdf', name: 'Protect PDF', desc: 'Apply AES-256 password encryption with configurable permissions.',
    icon: ShieldCheck, tag: 'security', cat: 'pdf', mode: 'PDF', color: 'text-blue-600', perfIndex: 'Encrypted',
    benefits: ['AES-256 encryption', 'Permission controls'],
    useCases: ['Protecting confidential files'],
    instructions: ['Upload PDF', 'Set password and permissions', 'Download protected PDF'],
    keywords: ['password protect pdf', 'encrypt pdf', 'aes 256', 'secure pdf']
  },
  {
    id: 'unlock-pdf', name: 'Unlock PDF', desc: 'Remove PDF encryption using the current valid password.',
    icon: ArchiveRestore, tag: 'security', cat: 'pdf', mode: 'PDF', color: 'text-emerald-600', perfIndex: 'Authorized',
    benefits: ['Valid-password decryption', 'No password guessing'],
    useCases: ['Removing a password from an authorized document'],
    instructions: ['Upload encrypted PDF', 'Enter the current password', 'Confirm authorization and download'],
    keywords: ['unlock pdf', 'remove pdf password', 'decrypt pdf', 'authorized pdf']
  },
  {
    id: 'repair-pdf', name: 'Repair PDF', desc: 'Attempt safe recovery of PDFs with minor structural damage.',
    icon: Wrench, tag: 'utility', cat: 'pdf', mode: 'PDF', color: 'text-red-600', perfIndex: 'Recover',
    benefits: ["Fix broken links", "Correct file errors"],
    useCases: ["Damaged files"],
    instructions: ["Upload broken PDF", "Analyze", "Recover"],
    keywords: ["fix", "corrupted", "broken", "recover", "damaged", "restore"]
  },
  {
    id: 'compare-pdf', name: 'Compare PDF', desc: 'Compare two PDF versions side by side and review text-item differences.',
    icon: Diff, tag: 'utility', cat: 'pdf', mode: 'PDF', color: 'text-indigo-600', perfIndex: 'Audit',
    benefits: ["Revision tracking", "Highlight changes"],
    useCases: ["Legal reviewing"],
    instructions: ["Upload Original", "Upload Modified", "Compare"],
    keywords: ["diff", "changes", "compare", "audit", "revision"]
  },
  {
    id: 'add-text', name: 'Add Text', desc: 'Place custom text on selected PDF pages.',
    icon: Type, tag: 'edit', cat: 'pdf', mode: 'PDF', color: 'text-blue-700', perfIndex: 'Direct',
    benefits: ["Text size", "Color selection"],
    useCases: ["Quick edits"],
    instructions: ["Upload PDF", "Type", "Position"],
    keywords: ["write", "text", "edit", "annotate", "type"]
  },
  {
    id: 'add-image-to-pdf', name: 'Add Image', desc: 'Place a logo, signature image or photo on a PDF page.',
    icon: ImageIcon, tag: 'edit', cat: 'pdf', mode: 'PDF', color: 'text-purple-700', perfIndex: 'Retina',
    benefits: ["Embed logos", "Insert photos"],
    useCases: ["Manuals", "Branding"],
    instructions: ["Upload PDF", "Choose Image", "Place"],
    keywords: ["insert", "image", "picture", "photo", "embed"]
  },
  {
    id: 'pdf-metadata', name: 'Edit Metadata', desc: 'Update PDF title, author, subject and metadata fields.',
    icon: Tag, tag: 'edit', cat: 'pdf', mode: 'PDF', color: 'text-slate-500', perfIndex: 'System',
    benefits: ["Clean files", "Easy tags"],
    useCases: ["Publishing"],
    instructions: ["Upload PDF", "Edit fields", "Save"],
    keywords: ["meta", "tags", "author", "title", "subject", "properties", "edit metadata"]
  },

  // --- 2. OFFICE CONVERSION ---
  {
    id: 'word-pdf', name: 'Word to PDF', desc: 'Convert Word documents to high-quality PDF files.',
    icon: FileText, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-blue-600', perfIndex: 'Quick',
    benefits: ["Layout Preservation", "Font Embedding", "Local Sync"],
    useCases: ["Resumes", "Letters"],
    instructions: ["Upload .docx", "Convert", "Download PDF"],
    keywords: ["docx", "doc", "word", "office", "microsoft", "creation"]
  },
  {
    id: 'pdf-word', name: 'PDF to Word', desc: 'Extract PDF content into an editable Word document with known layout limits.',
    icon: FileEdit, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-blue-500', perfIndex: 'Editable',
    benefits: ["Editable Text", "WASM Powered"],
    useCases: ["Editing Reports", "Extracting Data"],
    instructions: ["Upload PDF", "Process", "Download Word"],
    keywords: ["docx", "doc", "editable", "extract text", "word", "convert from pdf"]
  },
  {
    id: 'excel-pdf', name: 'Excel to PDF', desc: 'Convert Excel spreadsheets to PDF documents.',
    icon: FileSpreadsheet, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-emerald-700', perfIndex: 'Clean',
    benefits: ["Fit to Page", "Sheet Mapping"],
    useCases: ["Financial Reports", "Invoices"],
    instructions: ["Upload Excel", "Pick Layout", "Save PDF"],
    keywords: ["xlsx", "xls", "csv", "spreadsheet", "table", "accounting"]
  },
  {
    id: 'pdf-excel', name: 'PDF to Excel', desc: 'Extract positioned PDF text into a spreadsheet for review.',
    icon: FileSpreadsheet, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-emerald-600', perfIndex: 'Data Ready',
    benefits: ["Table Mapping", "Calculation Ready"],
    useCases: ["Data Entry", "Auditing"],
    instructions: ["Upload PDF", "Identify Tables", "Download CSV"],
    keywords: ["xlsx", "csv", "tables", "extract data", "spreadsheet"]
  },
  {
    id: 'ppt-pdf', name: 'PPT to PDF', desc: 'Convert PowerPoint slides to PDF documents.',
    icon: Presentation, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-orange-600', perfIndex: 'Visual',
    benefits: ["High resolution exports", "Choose output quality"],
    useCases: ["Handouts", "Static Previews"],
    instructions: ["Upload PPTX", "Stitch", "Download PDF"],
    keywords: ["pptx", "ppt", "slides", "presentation", "handout"]
  },
  {
    id: 'pdf-ppt', name: 'PDF to PPT', desc: 'Create presentation content from PDF pages when the converter is enabled.',
    icon: Presentation, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-orange-500', perfIndex: 'Creative',
    benefits: ["Layer Recovery", "Editable Objects"],
    useCases: ["Presenting Data", "Re-designing Slides"],
    instructions: ["Upload PDF", "Extract Slides", "Download PPTX"],
    keywords: ["pptx", "slides", "presentation", "editable slides"]
  },
  {
    id: 'ppt-word', name: 'PPT to Word', desc: 'Extract all slide text into a Word document.',
    icon: FileEdit, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-blue-400', perfIndex: 'System',
    benefits: ["Text extraction", "Note recovery"],
    useCases: ["Study guides"],
    instructions: ["Upload PPTX", "Extract", "Save DOCX"],
    keywords: ["slides to word", "pptx to docx", "extract text"]
  },

  // --- 3. MEDIA TOOLS ---
  {
    id: 'jpg-pdf', name: 'JPG to PDF', desc: 'Convert images into a single PDF document easily.',
    icon: ImageIcon, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-amber-600', perfIndex: 'Clear',
    benefits: ["No Blur", "Fast Process"],
    useCases: ["ID Cards", "Photos"],
    instructions: ["Upload Images", "Order Pages", "Save PDF"],
    keywords: ["jpeg", "jpg", "images", "photos", "creation"]
  },
  {
    id: 'png-to-pdf', name: 'PNG to PDF', desc: 'Convert transparent images into PDF documents.',
    icon: ImageIcon, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-blue-400', perfIndex: 'Clear',
    benefits: ["Alpha preservation", "Sharp edges"],
    useCases: ["Logos", "Graphics"],
    instructions: ["Upload PNGs", "Process", "Save PDF"],
    keywords: ["png", "transparent", "images", "creation"]
  },
  {
    id: 'pdf-jpg', name: 'PDF to JPG', desc: 'Export selected PDF pages as JPG or PNG images.',
    icon: ImageIcon, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-amber-500', perfIndex: 'Raster',
    benefits: ["High Resolution", "ZIP Output"],
    useCases: ["Social Sharing", "Snapshots"],
    instructions: ["Upload PDF", "Render", "Download ZIP"],
    keywords: ["jpeg", "jpg", "images", "rasterize", "snapshots"]
  },
  {
    id: 'extract-images', name: 'Extract Images', desc: 'Get all photos from a PDF at once.',
    icon: Sparkles, tag: 'edit', cat: 'pdf', mode: 'PDF', color: 'text-pink-500', perfIndex: 'Precise',
    benefits: ["Original quality", "Batch extraction"],
    useCases: ["Recovering photos"],
    instructions: ["Choose PDF", "Extract images", "Download ZIP"],
    keywords: ["scrape", "pull", "images", "pictures", "assets"]
  },
  {
    id: 'heic-pdf', name: 'HEIC to PDF', desc: 'Convert iPhone photos to standard PDF documents.',
    icon: Smartphone, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-cyan-500', perfIndex: 'iOS Ready',
    benefits: ["Native iOS Support", "Visual signing"],
    useCases: ["iPhone Photos"],
    instructions: ["Upload HEIC", "Transcode", "Save PDF"],
    keywords: ["iphone", "heic", "heif", "apple", "photos"]
  },
  {
    id: 'psd-pdf', name: 'PSD to PDF', desc: 'Turn Photoshop layers into a flat PDF document.',
    icon: Layers, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-blue-900', perfIndex: 'Design',
    benefits: ["Flatten layers", "High fidelity"],
    useCases: ["Portfolios"],
    instructions: ["Upload PSD", "Flatten", "Save PDF"],
    keywords: ["photoshop", "psd", "design", "adobe"]
  },

  // --- 4. IMAGE TOOLS ---
  {
    id: 'image-reducer', name: 'Reduce Image', desc: 'Make your image file size smaller easily.',
    icon: Shrink, tag: 'compress', cat: 'img', mode: 'Image', badge: 'Popular', color: 'text-emerald-500', perfIndex: 'Small',
    benefits: ["Set quality", "Choose size"],
    useCases: ["Web Assets"],
    instructions: ["Load image", "Enter target size", "Download"],
    keywords: ["compress", "shrink", "resize", "kb", "mb", "optimization"]
  },
  {
    id: 'image-resizer', name: 'Resize Image', desc: 'Change the dimensions of any image file.',
    icon: Maximize, tag: 'edit', cat: 'img', mode: 'Image', color: 'text-blue-600', perfIndex: 'Precise',
    benefits: ["Custom px", "Lock aspect"],
    useCases: ["Social posts"],
    instructions: ["Load image", "Set W/H", "Save"],
    keywords: ["resize", "dimensions", "width", "height", "pixels"]
  },
  {
    id: 'crop-image', name: 'Crop Image', desc: 'Cut and trim specific parts of your image.',
    icon: Crop, tag: 'edit', cat: 'img', mode: 'Image', color: 'text-orange-500', perfIndex: 'Precise',
    benefits: ["Manual drag", "Preset ratios"],
    useCases: ["Profile pics"],
    instructions: ["Load image", "Crop", "Save"],
    keywords: ["cut", "trim", "border", "square", "profile"]
  },
  {
    id: 'upscale-image', name: 'Enlarge Image', desc: 'Make images bigger and clearer with smart tools.',
    icon: Maximize2, tag: 'edit', cat: 'img', mode: 'Image', color: 'text-purple-500', perfIndex: 'HD',
    benefits: ["Clarity Boost"],
    useCases: ["Blurry photos"],
    instructions: ["Upload Image", "Select Factor", "Enhance"],
    keywords: ["enlarge", "upscale", "sharpen", "clarity", "high res", "hd"]
  },
  {
    id: 'rotate-image', name: 'Rotate Image', desc: 'Turn your images left, right or any angle.',
    icon: RotateCw, tag: 'edit', cat: 'img', mode: 'Image', color: 'text-emerald-600', perfIndex: 'Quick',
    benefits: ["Free angle", "Fix orientation"],
    useCases: ["Fixing shots"],
    instructions: ["Load image", "Turn", "Save"],
    keywords: ["rotate", "turn", "angle", "orientation"]
  },
  {
    id: 'watermark-image', name: 'Watermark Image', desc: 'Add a logo or text to your photos.',
    icon: Stamp, tag: 'edit', cat: 'img', mode: 'Image', color: 'text-cyan-600', perfIndex: 'Brand',
    benefits: ["Transparent text", "Logo support"],
    useCases: ["Photography"],
    instructions: ["Choose image", "Add watermark", "Download"],
    keywords: ["copyright", "stamp", "brand", "protect"]
  },
  {
    id: 'flip-image', name: 'Flip Image', desc: 'Mirror your image horizontally or vertically.',
    icon: RefreshCcw, tag: 'edit', cat: 'img', mode: 'Image', color: 'text-teal-600', perfIndex: 'Fast',
    benefits: ["Mirror effect", "One-click"],
    useCases: ["Fixing selfies"],
    instructions: ["Load image", "Flip", "Save"],
    keywords: ["mirror", "reverse", "horizontal", "vertical"]
  },
  {
    id: 'convert-image', name: 'Convert Image', desc: 'Switch between JPG, PNG, WEBP and BMP formats.',
    icon: Repeat, tag: 'edit', cat: 'img', mode: 'Image', color: 'text-purple-500', perfIndex: 'Multi',
    benefits: ["Batch format", "Local encode"],
    useCases: ["Web Optimization"],
    instructions: ["Load image", "Pick format", "Save"],
    keywords: ["transcode", "jpg to png", "webp to jpg", "bmp"]
  },
  {
    id: 'remove-bg', name: 'Remove Background', desc: 'Remove photo backgrounds automatically.',
    icon: Sparkles, tag: 'smart', cat: 'img', mode: 'Image', badge: 'Smart', color: 'text-blue-600', perfIndex: '',
    benefits: ["Isolate subject", "Save as PNG"],
    useCases: ["Products"],
    instructions: ["Upload photo", "Isolate", "Save"],
    keywords: ["background", "bg remover", "cutout", "isolate", "transparency"]
  },
  {
    id: 'blur-face', name: 'Blur Face', desc: 'Hide faces or private data in your images.',
    icon: Smile, tag: 'edit', cat: 'img', mode: 'Image', color: 'text-indigo-600', perfIndex: 'Private',
    benefits: ["Manual area", "Anonymize"],
    useCases: ["Protecting ID"],
    instructions: ["Load image", "Select area", "Blur"],
    keywords: ["hide", "censor", "privacy", "pixelate"]
  },
  {
    id: 'meme-generator', name: 'Meme Maker', desc: 'Add funny text to any image quickly.',
    icon: Smile, tag: 'edit', cat: 'img', mode: 'Image', color: 'text-amber-500', perfIndex: 'Fun',
    benefits: ["Classic fonts", "Fast share"],
    useCases: ["Social content"],
    instructions: ["Load image", "Type text", "Save"],
    keywords: ["meme", "funny", "caption", "humor"]
  },
  {
    id: 'photo-editor', name: 'Photo Editor', desc: 'Adjust brightness and apply beautiful filters.',
    icon: Wand2, tag: 'edit', cat: 'img', mode: 'Image', color: 'text-pink-600', perfIndex: 'Studio',
    benefits: ["Fidelity sliders", "Pro filters"],
    useCases: ["Retouching"],
    instructions: ["Load image", "Retouch", "Save"],
    keywords: ["edit", "brightness", "contrast", "filter", "studio"]
  },

  // --- 5. SMART & AI TOOLS ---
        {
    id: 'sign-pdf', name: 'Sign PDF', desc: 'Place a visual electronic signature on a PDF document.',
    icon: PenTool, tag: 'edit', cat: 'pdf', mode: 'PDF', color: 'text-blue-600', perfIndex: 'Auth',
    benefits: ["Easy signatures", "Visual signing"],
    useCases: ["E-Signing"],
    instructions: ["Upload PDF", "Draw", "Embed"],
    keywords: ["visual signature", "electronic signature", "esign", "sign pdf"]
  },
  {
    id: 'pdf-text', name: 'PDF to Text', desc: 'Extract clean text from your PDF documents.',
    icon: Brain, tag: 'ai', cat: 'pdf', mode: 'PDF', badge: 'Smart', color: 'text-purple-500', perfIndex: 'Deep',
    benefits: ["Clean extraction", "Text extraction"],
    useCases: ["Reading help"],
    instructions: ["Upload PDF", "Process", "Copy Text"],
    keywords: ["read", "extract text", "summary", "semantic", "pdf to text"]
  },
  {
    id: 'smart-read', name: 'Smart Read', desc: 'Get all text content from your PDF documents.',
    icon: Brain, tag: 'ai', cat: 'pdf', mode: 'PDF', badge: 'Smart', color: 'text-purple-500', perfIndex: 'Deep',
    benefits: ["Clean extraction", "Text extraction"],
    useCases: ["Reading help"],
    instructions: ["Upload PDF", "Process", "Copy Text"],
    keywords: ["read", "extract text", "summary", "semantic"]
  },

  // --- 6. DATA & TECHNICAL ---
  {
    id: 'html-pdf', name: 'HTML to PDF', desc: 'Save web snippets or .html files as PDF documents.',
    icon: Code2, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-orange-500', perfIndex: 'System',
    benefits: ["CSS preserved", "Browser render"],
    useCases: ["Saving receipts"],
    instructions: ["Upload HTML", "Render", "Save PDF"],
    keywords: ["html", "web", "code", "browser", "creation"]
  },
  {
    id: 'xml-pdf', name: 'XML to PDF', desc: 'Convert structured XML data into readable PDF reports.',
    icon: FileCode, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-slate-600', perfIndex: 'Data',
    benefits: ["Clean layout", "Safe parsing"],
    useCases: ["Data auditing"],
    instructions: ["Upload XML", "Schema map", "Save PDF"],
    keywords: ["xml", "data", "report", "structure"]
  },
  {
    id: 'json-pdf', name: 'JSON to PDF', desc: 'Convert JSON data into clean, formal PDF reports.',
    icon: FileJson, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-slate-500', perfIndex: 'Data',
    benefits: ["Tree mapping", "Clean layout"],
    useCases: ["API docs"],
    instructions: ["Upload JSON", "Render", "Save PDF"],
    keywords: ["json", "data", "api", "report"]
  },
  {
    id: 'txt-pdf', name: 'TXT to PDF', desc: 'Convert simple text files into formal PDF documents.',
    icon: FileText, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-slate-400', perfIndex: 'Fast',
    benefits: ["Clean output"],
    useCases: ["Notepad logs"],
    instructions: ["Upload TXT", "Saturate", "Save PDF"],
    keywords: ["txt", "plain text", "notebad", "document"]
  },
  {
    id: 'pdf-epub', name: 'PDF to eBook', desc: 'Make your PDF readable on Kindle and e-readers.',
    icon: TabletSmartphone, tag: 'convert', cat: 'pdf', mode: 'PDF', color: 'text-teal-600', perfIndex: 'Mobile',
    benefits: ["Reflow logic", "Mobile ready"],
    useCases: ["Reading ebooks"],
    instructions: ["Upload PDF", "Transcode", "Save EPUB"],
    keywords: ["epub", "kindle", "ebook", "reader"]
  },
  {
    id: 'pdf-a', name: 'PDF/A Archive', desc: 'Preserve your PDF for the long term with legal standards.',
    icon: ArchiveRestore, tag: 'edit', cat: 'pdf', mode: 'PDF', color: 'text-blue-900', perfIndex: 'Compliant',
    benefits: ["Long-term", "Legal standard"],
    useCases: ["Government docs"],
    instructions: ["Upload PDF", "Standardize", "Save PDF/A"],
    keywords: ["archival", "pdfa", "legal", "storage"]
  },
  {
    id: 'pdf-zip-extract', name: 'PDF to ZIP', desc: 'Save every PDF page as a separate file in a ZIP.',
    icon: FileArchive, tag: 'edit', cat: 'pdf', mode: 'PDF', color: 'text-slate-700', perfIndex: 'Bulk',
    benefits: ["Auto splitting", "ZIP bundle"],
    useCases: ["Asset management"],
    instructions: ["Upload PDF", "Deflate", "Download ZIP"],
    keywords: ["zip", "archive", "bundle", "pages to zip"]
  },
  {
    id: 'zip-extractor', name: 'ZIP Extractor', desc: 'Unpack archives and get PDF/Image files locally.',
    icon: FolderOpen, tag: 'utility', cat: 'pdf', mode: 'PDF', color: 'text-amber-700', perfIndex: 'Local',
    benefits: ["No upload", "Fast extraction"],
    useCases: ["Cleaning folders"],
    instructions: ["Upload ZIP", "Extract", "Preview"],
    keywords: ["unzip", "unpack", "extract", "archive"]
  },
  {
    id: 'subtitle-generator', name: 'Subtitle Creator', desc: 'Generate timed .SRT or .VTT subtitles from text.',
    icon: Captions, tag: 'utility', cat: 'ai', mode: 'AI', color: 'text-indigo-600', badge: 'New', perfIndex: 'Precise',
    benefits: ["Auto-Timing", "Standard Formats", "Easy Edit"],
    useCases: ["Video captioning", "Translation"],
    instructions: ["Upload or Paste Text", "Calibrate Timing", "Download .SRT"],
    keywords: ["subtitles", "srt", "vtt", "caption", "video", "timing"]
  },
  ...CONVERSION_TOOLS
];


/** Public directory: tested on-device tools plus explicitly enabled online workflows. */
export const PUBLIC_TOOLS: ServiceTool[] = ALL_TOOLS.filter((tool) => isToolPublic(tool.id));


export type PublicToolCategory = 'conversion' | 'image' | 'pdf';

/** Mutually exclusive public navigation categories. */
export function getPublicToolCategory(tool: ServiceTool): PublicToolCategory {
  if (tool.cat === 'img') return 'image';
  if (tool.tag === 'convert') return 'conversion';
  return 'pdf';
}

export const PUBLIC_TOOL_COUNTS = PUBLIC_TOOLS.reduce<Record<PublicToolCategory, number>>(
  (counts, tool) => {
    counts[getPublicToolCategory(tool)] += 1;
    return counts;
  },
  { conversion: 0, image: 0, pdf: 0 },
);
