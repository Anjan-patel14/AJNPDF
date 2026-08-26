# src/components/junction — 44 Browser-Only Tool Components

This directory contains both browser workflows and components that call the AJN PDF temporary processing service. Each public tool must display its actual processing mode.

---

## 🚀 Technical Implementation

### Core Dependencies
Ensure these are installed in your root project:
`npm install pdf-lib pdfjs-dist jszip mammoth xlsx`

### Framework Requirements
- **TypeScript**: All files are TypeScript (.tsx/.ts). Ensure your `tsconfig.json` supports `jsx: react-jsx`.
- **Next.js Config**: Add the following to your `next.config.js` to ensure the PDF.js worker resolves correctly:
  ```js
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  }
  ```

### Browser and Temporary Server Architecture
Browser tools run in the current session. Server-assisted tools use the configured API and follow the file-processing policy.

---

## Usage

### Import single tool
```tsx
import MergePdf from '@/components/junction/MergePdf'

export default function Page() {
  return <MergePdf />
}
```

### Import from barrel
```tsx
import { MergePdf, SplitPdf, ReduceImage, PhotoEditor } from '@/components/junction'
```

---

## All 44 Components

### PDF Tools
| Component | Tool |
|-----------|------|
| `MergePdf` | Merge multiple PDFs into one |
| `SplitPdf` | Split PDF into pages or ranges |
| `CompressPdf` | Reduce PDF file size |
| `ProtectPdf` | Add password protection |
| `UnlockPdf` | Remove password protection |
| `RotatePdf` | Rotate pages |
| `DeletePages` | Remove specific pages |
| `OrganizePdf` | Reorder pages |
| `CropPdf` | Trim page margins |
| `WatermarkPdf` | Add text watermark |
| `AddNumbers` | Add page numbers |
| `FlattenPdf` | Flatten form fields |
| `RepairPdf` | Fix corrupted PDFs |
| `ComparePdf` | Diff two PDFs |
| `AddText` | Write text on pages |
| `SignPdf` | Draw & embed signature |
| `SmartRead` | Extract text from PDF |
| `SearchablePdf` | Optimise text layer |
| `AddImageToPdf` | Embed image in PDF |
| `PdfMetadata` | Edit PDF metadata |

### Convert to PDF
| Component | Tool |
|-----------|------|
| `WordToPdf` | .docx → PDF |
| `ExcelToPdf` | .xlsx → PDF |
| `JpgToPdf` | JPG images → PDF |
| `PngToPdf` | PNG images → PDF |
| `PptToPdf` | .pptx → PDF |
| `HtmlToPdf` | HTML → PDF |
| `ZipToPdf` | ZIP of images → PDF |

### Convert from PDF
| Component | Tool |
|-----------|------|
| `PdfToWord` | PDF → .txt |
| `PdfToJpg` | PDF pages → JPG images |
| `PdfToExcel` | PDF → CSV |
| `PdfToPpt` | PDF → .pptx |
| `PdfToZip` | PDF pages → ZIP |

### Image Tools
| Component | Tool |
|-----------|------|
| `ReduceImage` | Compress image |
| `ResizeImage` | Change dimensions |
| `CropImage` | Crop region |
| `RotateImage` | Rotate any angle |
| `WatermarkImage` | Add text watermark |
| `EnhanceImage` | Upscale + sharpen |
| `RemoveBackground` | Remove BG |
| `BlurFace` | Blur regions |
| `PhotoEditor` | Brightness/contrast/filters |
| `MemeMaker` | Add meme text |
| `FlipImage` | Mirror horizontally/vertically |
| `ConvertImage` | Convert image format |
