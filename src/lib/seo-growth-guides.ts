export type SeoGrowthPillarId = 'merge-pdf' | 'compress-pdf' | 'edit-pdf' | 'split-pdf';

export type SeoGrowthGuideSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  note?: string;
};

export type SeoGrowthGuide = {
  slug: string;
  pillar: SeoGrowthPillarId;
  eyebrow: string;
  title: string;
  metaTitle: string;
  summary: string;
  readTime: string;
  primaryKeyword: string;
  related: string[];
  sections: SeoGrowthGuideSection[];
  checklist: string[];
};

export type SeoGrowthPillar = {
  label: string;
  headline: string;
  summary: string;
  browserNote: string;
  bestFor: string[];
  beforeDownload: string[];
};

export const SEO_GROWTH_PILLARS: Record<SeoGrowthPillarId, SeoGrowthPillar> = {
  "merge-pdf": {
    "label": "Merge PDF",
    "headline": "Merge PDF online for complete document bundles",
    "summary": "Combine multiple PDFs in the browser, control the final reading order and create one downloadable document without installing another application.",
    "browserNote": "Merge PDF is a browser workflow for supported files. The source PDFs are combined in the active browser session.",
    "bestFor": [
      "Applications with supporting documents",
      "Reports assembled from several PDFs",
      "Scanned bundles that need one file"
    ],
    "beforeDownload": [
      "Confirm the file order",
      "Check total page count",
      "Review pages with forms, signatures or unusual layouts"
    ]
  },
  "compress-pdf": {
    "label": "Compress PDF",
    "headline": "Compress PDF online with practical quality controls",
    "summary": "Reduce PDF file size for email, uploads and storage while keeping readability and important document behavior in view.",
    "browserNote": "Compress PDF is a browser workflow for supported files. Compression happens in the active browser session.",
    "bestFor": [
      "Email attachment limits",
      "Application portal upload limits",
      "Large scan and image-heavy PDFs"
    ],
    "beforeDownload": [
      "Check small text and signatures",
      "Compare the final file size",
      "Test links or searchability when they matter"
    ]
  },
  "edit-pdf": {
    "label": "Edit PDF",
    "headline": "Edit PDF online with browser-based text and page tools",
    "summary": "Make practical corrections to names, dates, numbers and visible text, add images or signatures, and validate the exported PDF before use.",
    "browserNote": "Edit PDF renders, analyzes and exports supported PDFs in the browser. Exact font reuse is not possible for every embedded or subset font.",
    "bestFor": [
      "Short text corrections",
      "Adding text, images or visual signatures",
      "Manual edits on difficult or scanned pages"
    ],
    "beforeDownload": [
      "Review font match and baseline",
      "Remember Whiteout is not secure redaction",
      "Open the exported copy in another viewer"
    ]
  },
  "split-pdf": {
    "label": "Split PDF",
    "headline": "Split PDF online and extract only the pages you need",
    "summary": "Create smaller PDFs from selected pages or ranges in the browser, with clear range validation and output checks.",
    "browserNote": "Split PDF is a browser workflow for supported files. Selected pages are copied into new PDFs in the active browser session.",
    "bestFor": [
      "Extracting certificates or forms",
      "Separating a large PDF for email",
      "Creating logical sections from one document"
    ],
    "beforeDownload": [
      "Check actual page numbers",
      "Open every generated output",
      "Keep the original until all parts are verified"
    ]
  }
};

export const SEO_GROWTH_GUIDES: SeoGrowthGuide[] = [
  {
    "slug": "merge-pdf-on-android",
    "pillar": "merge-pdf",
    "eyebrow": "Android PDF guide",
    "title": "How to merge PDF files on Android without installing an app",
    "metaTitle": "Merge PDF on Android Without an App",
    "summary": "Combine PDF files on an Android phone in the browser, arrange them in the right order, and verify the merged result before sharing.",
    "readTime": "6 minute guide",
    "primaryKeyword": "merge pdf on android",
    "related": [
      "merge-pdf",
      "organize-pdf",
      "split-pdf"
    ],
    "sections": [
      {
        "title": "Prepare the PDFs on your phone",
        "paragraphs": [
          "Keep the PDFs you want to combine in one easy-to-find folder such as Downloads or Documents. Open each file once before merging so you can confirm that it is the correct version and that it is readable.",
          "If your phone has several copies with similar names, rename them before starting. A clear sequence such as 01-cover.pdf, 02-form.pdf and 03-proof.pdf makes ordering easier when the browser file picker opens."
        ],
        "bullets": [
          "Confirm every source file opens",
          "Remove duplicate copies",
          "Use clear filenames",
          "Keep the originals until the merged file is checked"
        ]
      },
      {
        "title": "Open Merge PDF in your mobile browser",
        "paragraphs": [
          "Open AJN PDF Merge PDF in a current mobile browser and choose the source PDFs from Android storage. The Merge PDF workflow is designed to process supported PDFs in the active browser session rather than requiring a separate Android application.",
          "Large documents can use significant phone memory. Close unnecessary browser tabs first when you are combining many pages or image-heavy scans."
        ],
        "note": "Browser processing avoids installing another PDF app, but the device still needs enough memory to load and rebuild the selected documents."
      },
      {
        "title": "Arrange the documents before merging",
        "paragraphs": [
          "Drag or reorder the selected files into the exact reading sequence you want. Check the first and last document in the queue because these are common places for ordering mistakes.",
          "If one PDF contains pages that should not be included, use Split PDF first, then merge only the extracted pages with the remaining documents."
        ],
        "bullets": [
          "Put a cover page first when required",
          "Keep supporting documents together",
          "Remove accidental duplicates",
          "Review portrait and landscape files"
        ]
      },
      {
        "title": "Download and validate the merged PDF",
        "paragraphs": [
          "After processing finishes, download the new PDF and open it in an independent viewer on the phone. Confirm the page count, document order, first page and last page before sending it by email, messaging app or upload form.",
          "Merging creates a new document. Existing certificate-based signatures, bookmarks or interactive features from source files may not behave exactly as they did before pages were copied."
        ]
      }
    ],
    "checklist": [
      "Use the correct source PDFs",
      "Arrange files before processing",
      "Open the downloaded result",
      "Keep originals until validation is complete"
    ]
  },
  {
    "slug": "merge-pdf-on-iphone",
    "pillar": "merge-pdf",
    "eyebrow": "iPhone PDF guide",
    "title": "How to merge PDF files on iPhone in a browser",
    "metaTitle": "Merge PDF on iPhone in Your Browser",
    "summary": "Combine PDFs from Files on an iPhone, control document order, and create one merged PDF without installing another PDF utility.",
    "readTime": "6 minute guide",
    "primaryKeyword": "merge pdf on iphone",
    "related": [
      "merge-pdf",
      "organize-pdf",
      "compress-pdf"
    ],
    "sections": [
      {
        "title": "Organize files in the iPhone Files app",
        "paragraphs": [
          "Move the PDFs you plan to combine into a folder you can reach quickly from the iOS file picker. Open each document and confirm that it contains the pages you expect.",
          "If filenames are generic, rename them before merging. Descriptive names reduce the chance of selecting an outdated form or duplicate scan."
        ],
        "bullets": [
          "Use one working folder",
          "Check page counts",
          "Rename unclear files",
          "Remove old versions"
        ]
      },
      {
        "title": "Choose the PDFs from Safari or another browser",
        "paragraphs": [
          "Open Merge PDF on AJN PDF and use the file control to select PDFs from On My iPhone, iCloud Drive or another location exposed through the iOS Files picker.",
          "The merge action runs as a browser workflow for supported PDFs. Keep the browser tab open until the new document has been created and downloaded."
        ],
        "note": "If iOS suspends the browser while processing a very large document, return to the tab and retry with fewer files or smaller groups."
      },
      {
        "title": "Set the final reading order",
        "paragraphs": [
          "Arrange the selected PDFs before starting the merge. Think about how the recipient will read the document: cover page, main form, supporting evidence, then appendices is a common sequence.",
          "Mixed page sizes and orientations can remain mixed after merging, so preview the result rather than assuming every page will look identical."
        ],
        "bullets": [
          "Cover or title page",
          "Main document",
          "Supporting documents",
          "Appendices"
        ]
      },
      {
        "title": "Verify the result before sharing",
        "paragraphs": [
          "Open the downloaded file from Safari downloads or the Files app. Check that every source document appears once and that the total page count matches your expectation.",
          "When the merged PDF is for an application or formal submission, verify the upload size limit before sending. Compress the merged copy only if the destination requires a smaller file."
        ]
      }
    ],
    "checklist": [
      "Select the current versions",
      "Confirm final order",
      "Check the merged page count",
      "Verify size before uploading"
    ]
  },
  {
    "slug": "merge-pdf-on-chromebook",
    "pillar": "merge-pdf",
    "eyebrow": "Chromebook PDF guide",
    "title": "How to merge PDF files on a Chromebook",
    "metaTitle": "Merge PDF on Chromebook",
    "summary": "Merge multiple PDFs on ChromeOS using a browser workflow, reorder documents, and download one combined file without desktop PDF software.",
    "readTime": "6 minute guide",
    "primaryKeyword": "merge pdf on chromebook",
    "related": [
      "merge-pdf",
      "organize-pdf",
      "compress-pdf"
    ],
    "sections": [
      {
        "title": "Collect the PDFs in ChromeOS Files",
        "paragraphs": [
          "Place the documents in Downloads, My files or a synced folder that is easy to access from Chrome. Open each PDF first and make sure it is the final copy you intend to combine.",
          "For school or office submissions, use filenames that show the intended order. This reduces mistakes when several similarly named PDFs appear in the picker."
        ],
        "bullets": [
          "Open each PDF once",
          "Use final versions only",
          "Keep files in one folder",
          "Rename ambiguous documents"
        ]
      },
      {
        "title": "Use the browser instead of installing an extension",
        "paragraphs": [
          "Open AJN PDF Merge PDF in Chrome and select the supported PDFs. The browser workflow lets you combine the files without adding a Chrome extension or desktop application.",
          "Extensions can request broad permissions, so using a focused browser workflow can also keep the task simpler. You should still use a trusted Chromebook account and avoid processing confidential documents on a shared device."
        ]
      },
      {
        "title": "Reorder and combine",
        "paragraphs": [
          "Arrange the selected documents in the exact order required by the final PDF. If the queue includes a wrong file, remove it before processing instead of merging first and trying to repair the result later.",
          "For very large scanned PDFs, consider merging smaller groups first if the Chromebook becomes memory constrained."
        ],
        "bullets": [
          "Check the queue from top to bottom",
          "Remove wrong versions",
          "Use Split PDF for unwanted pages",
          "Merge large sets in smaller groups if needed"
        ]
      },
      {
        "title": "Open the downloaded PDF in Chrome",
        "paragraphs": [
          "After download, open the merged file in Chrome's PDF viewer. Check first and last pages, page count, orientation and any pages with forms or signatures.",
          "The merged copy is a new PDF. Keep the original files until the combined result has been accepted by the destination or recipient."
        ]
      }
    ],
    "checklist": [
      "Avoid unnecessary extensions",
      "Arrange the queue carefully",
      "Validate the downloaded PDF",
      "Keep source files as backup"
    ]
  },
  {
    "slug": "merge-pdf-without-installing-software",
    "pillar": "merge-pdf",
    "eyebrow": "Browser PDF guide",
    "title": "How to merge PDFs without installing software",
    "metaTitle": "Merge PDFs Without Installing Software",
    "summary": "Combine PDF documents in a browser workflow when you need one file but do not want to install a desktop application or browser extension.",
    "readTime": "7 minute guide",
    "primaryKeyword": "merge pdf without software",
    "related": [
      "merge-pdf",
      "split-pdf",
      "organize-pdf"
    ],
    "sections": [
      {
        "title": "Decide whether merging is the right operation",
        "paragraphs": [
          "Merging is useful when separate PDFs belong in one continuous document. Common examples include a form plus supporting evidence, several scanned pages, multiple invoices for one record, or chapters that need one download.",
          "If you only need a few pages from one large file, split or extract those pages first. Combining unnecessary pages creates a larger document and can expose information you did not intend to share."
        ],
        "bullets": [
          "Combine related documents only",
          "Extract unwanted pages first",
          "Check confidentiality boundaries",
          "Keep an untouched source copy"
        ]
      },
      {
        "title": "Use a browser-native merge workflow",
        "paragraphs": [
          "Choose a merge tool that clearly explains where processing happens. AJN PDF classifies Merge PDF as a browser workflow for supported PDFs, so the merge operation is performed in the active browser session.",
          "No installation does not mean there are no resource limits. Browser memory, file size and document complexity still affect how smoothly large jobs run."
        ],
        "note": "For sensitive work, use a trusted device and browser profile even when the processing itself stays in the browser."
      },
      {
        "title": "Control order before creating the output",
        "paragraphs": [
          "The most important merge decision is page order. Arrange the source files before processing, then verify that the queue matches the final reading sequence.",
          "If a PDF already contains several pages, those pages keep their internal order when they are copied into the new merged document."
        ],
        "bullets": [
          "Place files in final sequence",
          "Remove duplicates",
          "Check mixed orientations",
          "Use descriptive output filename"
        ]
      },
      {
        "title": "Validate the new document",
        "paragraphs": [
          "Open the downloaded PDF and compare its total page count with the source documents. Review pages containing signatures, forms, unusual fonts or embedded links because page-copy operations can affect advanced PDF features.",
          "Only replace or delete the originals after the new file has been checked and accepted."
        ]
      }
    ],
    "checklist": [
      "Confirm merging is appropriate",
      "Check processing mode",
      "Arrange files before processing",
      "Validate output independently"
    ]
  },
  {
    "slug": "combine-pdf-pages-in-correct-order",
    "pillar": "merge-pdf",
    "eyebrow": "PDF organization guide",
    "title": "How to combine PDF files in the correct page order",
    "metaTitle": "Combine PDF Files in the Correct Order",
    "summary": "Plan the reading sequence before merging PDFs so covers, forms, attachments and supporting documents appear in the intended order.",
    "readTime": "6 minute guide",
    "primaryKeyword": "combine pdf pages in order",
    "related": [
      "merge-pdf",
      "organize-pdf",
      "page-number"
    ],
    "sections": [
      {
        "title": "Define the final document structure",
        "paragraphs": [
          "Before selecting files, write down the intended sequence. A typical application may use a cover page, application form, identity document, certificates and supporting evidence. A report may use title page, contents, main sections and appendices.",
          "Having a simple sequence prevents repeated merging attempts and makes missing documents easier to spot."
        ],
        "bullets": [
          "Cover or title page",
          "Main document",
          "Supporting material",
          "Appendices or evidence"
        ]
      },
      {
        "title": "Prepare each source PDF",
        "paragraphs": [
          "Open every source file and confirm its internal page order. If one file contains pages that are reversed, duplicated or unnecessary, fix that file with Organize PDF or Split PDF before combining everything.",
          "Rename the files with numeric prefixes when the browser picker does not make their purpose obvious."
        ]
      },
      {
        "title": "Arrange the merge queue",
        "paragraphs": [
          "Add the source PDFs to Merge PDF, then move them into the planned sequence. Check the queue from top to bottom immediately before processing.",
          "Remember that merging usually preserves the page order inside each source document. Reordering files does not rearrange pages inside a multi-page source PDF."
        ],
        "bullets": [
          "Compare queue with your planned structure",
          "Remove duplicate uploads",
          "Check multi-page sources separately",
          "Use one clear output filename"
        ]
      },
      {
        "title": "Review navigation after merging",
        "paragraphs": [
          "Open the combined PDF and scan page transitions where one source file ends and the next begins. Check page numbers, headers, blank separator pages and orientation changes.",
          "If the document needs continuous visible page numbers, add them after the merge so the numbering follows the final combined sequence."
        ]
      }
    ],
    "checklist": [
      "Plan sequence first",
      "Fix source-page order before merging",
      "Review every transition",
      "Add final numbering after merge if needed"
    ]
  },
  {
    "slug": "compress-pdf-for-email",
    "pillar": "compress-pdf",
    "eyebrow": "PDF compression guide",
    "title": "How to compress a PDF for email without making it unreadable",
    "metaTitle": "Compress PDF for Email Without Losing Clarity",
    "summary": "Reduce PDF size for email while balancing text clarity, image quality, links and searchability instead of forcing the smallest possible file.",
    "readTime": "7 minute guide",
    "primaryKeyword": "compress pdf for email",
    "related": [
      "compress-pdf",
      "merge-pdf",
      "pdf-metadata"
    ],
    "sections": [
      {
        "title": "Check the email size limit first",
        "paragraphs": [
          "Find the attachment limit for the mail service or recipient system before compressing. You only need to make the PDF small enough to fit comfortably below that limit.",
          "Avoid targeting an unnecessarily tiny file. Aggressive compression can reduce image clarity and may rasterize page content depending on the selected mode."
        ],
        "bullets": [
          "Check current PDF size",
          "Know the attachment limit",
          "Leave room for other attachments",
          "Keep the original PDF"
        ]
      },
      {
        "title": "Start with balanced compression",
        "paragraphs": [
          "Open Compress PDF and choose a moderate setting first. AJN PDF's compression workflow is designed to show practical quality controls rather than silently using the strongest setting for every document.",
          "Text-heavy PDFs that are already optimized may shrink only slightly. Image-heavy scans usually offer more room for size reduction."
        ],
        "note": "A smaller file is not automatically a better file. Readability and required document features matter more than an arbitrary percentage reduction."
      },
      {
        "title": "Inspect important pages",
        "paragraphs": [
          "After compression, zoom into small text, signatures, stamps, charts and scanned identity documents. If these become hard to read, move back to a higher-quality setting.",
          "Strong rasterization can reduce selectable text, links, form behavior and accessibility information, so test any features the recipient needs."
        ],
        "bullets": [
          "Zoom to 100% and 200%",
          "Check signatures and fine print",
          "Test links if important",
          "Confirm searchable text when required"
        ]
      },
      {
        "title": "Attach the verified copy",
        "paragraphs": [
          "Rename the compressed output clearly so it is not confused with the original. Open it once more, confirm the page count and then attach that verified copy to the email.",
          "If the PDF still exceeds the limit, consider whether the document can be split into logical parts instead of repeatedly lowering visual quality."
        ]
      }
    ],
    "checklist": [
      "Know the target size",
      "Use balanced compression first",
      "Inspect fine text and images",
      "Split logically if quality would become unacceptable"
    ]
  },
  {
    "slug": "compress-pdf-on-android",
    "pillar": "compress-pdf",
    "eyebrow": "Android PDF guide",
    "title": "How to compress a PDF on Android without installing an app",
    "metaTitle": "Compress PDF on Android Without an App",
    "summary": "Reduce a PDF file size from an Android browser, choose a sensible quality level, and verify the result before uploading or sending it.",
    "readTime": "6 minute guide",
    "primaryKeyword": "compress pdf on android",
    "related": [
      "compress-pdf",
      "split-pdf",
      "merge-pdf"
    ],
    "sections": [
      {
        "title": "Locate the PDF and note its size",
        "paragraphs": [
          "Use Android Files or your device's file manager to find the PDF. Check the current file size and the destination's upload or attachment limit before processing.",
          "If the document is a scan, open a few pages and note whether small text or signatures are already difficult to read. Compression cannot restore detail that is missing in the source."
        ],
        "bullets": [
          "Check current file size",
          "Check destination limit",
          "Open the source PDF",
          "Keep the original copy"
        ]
      },
      {
        "title": "Open Compress PDF in the browser",
        "paragraphs": [
          "Use AJN PDF Compress PDF from a current Android browser and select the document from device storage. The supported compression workflow runs in the active browser session, so no separate Android PDF utility is required.",
          "Close unused tabs if the PDF contains many high-resolution scanned pages because browser memory is limited on some phones."
        ]
      },
      {
        "title": "Choose quality based on the document",
        "paragraphs": [
          "Use a balanced setting for forms, reports and documents with small text. Stronger compression can be useful for photo-heavy PDFs when the destination values smaller size more than maximum detail.",
          "Do not judge quality only from the file size. Open the result and inspect the content that matters."
        ],
        "bullets": [
          "Balanced for mixed text and images",
          "Stronger compression for large photo scans",
          "Avoid repeated recompression",
          "Keep text legible"
        ]
      },
      {
        "title": "Download and test on the phone",
        "paragraphs": [
          "Open the downloaded PDF in a second viewer or browser tab. Confirm page count, readable text, image clarity and any links or form behavior you need.",
          "If the result is still too large, split the document into logical parts before sacrificing more quality."
        ]
      }
    ],
    "checklist": [
      "Check target size",
      "Close unnecessary tabs",
      "Use a sensible quality level",
      "Open the result before sharing"
    ]
  },
  {
    "slug": "reduce-pdf-size-on-iphone",
    "pillar": "compress-pdf",
    "eyebrow": "iPhone PDF guide",
    "title": "How to reduce PDF file size on iPhone in a browser",
    "metaTitle": "Reduce PDF Size on iPhone",
    "summary": "Compress a PDF from the iPhone Files app using a browser workflow and review readability before sending the smaller copy.",
    "readTime": "6 minute guide",
    "primaryKeyword": "reduce pdf size on iphone",
    "related": [
      "compress-pdf",
      "split-pdf",
      "organize-pdf"
    ],
    "sections": [
      {
        "title": "Confirm why the PDF needs to be smaller",
        "paragraphs": [
          "Check whether you are reducing the PDF for email, a portal upload or storage. Different destinations have different limits, so write down the maximum accepted size before making quality changes.",
          "Keep the source document in Files or iCloud Drive and create a separate compressed copy."
        ],
        "bullets": [
          "Know the size limit",
          "Keep the source file",
          "Check important pages",
          "Use a clear output name"
        ]
      },
      {
        "title": "Select the PDF from Files",
        "paragraphs": [
          "Open AJN PDF Compress PDF in Safari or another current browser, then choose the document through the iOS Files picker. Keep the browser active until the output is ready.",
          "Large image-heavy PDFs can use substantial memory. If Safari reloads the page, retry with fewer pages or split the document first."
        ]
      },
      {
        "title": "Balance size and clarity",
        "paragraphs": [
          "Start with a moderate compression level. Forms, certificates and scanned documents often contain small details that can become unreadable if image quality is reduced too aggressively.",
          "Already optimized PDFs may not shrink much. That is normal and is preferable to degrading the file just to reach a dramatic percentage."
        ],
        "bullets": [
          "Inspect fine print",
          "Check signatures and stamps",
          "Avoid unnecessary recompression",
          "Use stronger settings only when needed"
        ]
      },
      {
        "title": "Save and verify the smaller copy",
        "paragraphs": [
          "Download the result, open it from Safari Downloads or Files, and compare it with the original. Confirm the page count and check several representative pages at normal zoom.",
          "If the destination still rejects the file, consider splitting it into meaningful sections instead of continuing to reduce quality."
        ]
      }
    ],
    "checklist": [
      "Identify the real size limit",
      "Start with moderate compression",
      "Compare source and result",
      "Split rather than over-compress when appropriate"
    ]
  },
  {
    "slug": "reduce-pdf-size-without-installing-software",
    "pillar": "compress-pdf",
    "eyebrow": "Browser PDF guide",
    "title": "How to reduce PDF size without installing software",
    "metaTitle": "Compress PDF Without Installing Software",
    "summary": "Compress a PDF in the browser, understand what can actually be reduced, and preserve useful document quality without adding desktop software.",
    "readTime": "7 minute guide",
    "primaryKeyword": "compress pdf without software",
    "related": [
      "compress-pdf",
      "split-pdf",
      "image-to-pdf"
    ],
    "sections": [
      {
        "title": "Understand what makes a PDF large",
        "paragraphs": [
          "PDF size can come from high-resolution images, repeated graphics, embedded fonts, attachments and other internal streams. A scan made from phone photos often has much more compressible image data than a text-first PDF exported from office software.",
          "Knowing the source helps set realistic expectations. A well-optimized PDF may only become slightly smaller without sacrificing content quality."
        ],
        "bullets": [
          "Photo scans often have more room to shrink",
          "Text-first PDFs may already be efficient",
          "Embedded assets affect size",
          "Keep the original document"
        ]
      },
      {
        "title": "Use a browser compression workflow",
        "paragraphs": [
          "AJN PDF Compress PDF handles supported compression work in the active browser session. This lets you reduce file size without adding a desktop application or browser extension.",
          "Browser-native processing still uses your device's CPU and memory, so very large documents may take longer or require a device with more available resources."
        ]
      },
      {
        "title": "Choose the least destructive setting that works",
        "paragraphs": [
          "Start with a balanced mode and compare the result with your actual target. If it is already below the upload or email limit, there is no benefit in forcing a smaller file.",
          "Stronger compression can rasterize or downsample content. That can affect searchability, links, form fields and accessibility information."
        ],
        "bullets": [
          "Set a practical target",
          "Prefer moderate settings first",
          "Check document features",
          "Do not chase a percentage reduction"
        ]
      },
      {
        "title": "Verify the final PDF independently",
        "paragraphs": [
          "Open the compressed download in another PDF viewer and check page count, text, images, links and forms that matter. Compare a few pages side-by-side with the original.",
          "Keep both files until the smaller copy has been accepted by the system or recipient."
        ]
      }
    ],
    "checklist": [
      "Know what contributes to file size",
      "Use browser processing on a trusted device",
      "Choose minimum necessary compression",
      "Validate important document features"
    ]
  },
  {
    "slug": "compress-pdf-for-job-application",
    "pillar": "compress-pdf",
    "eyebrow": "Application PDF guide",
    "title": "How to compress a PDF for a job application upload",
    "metaTitle": "Compress PDF for a Job Application",
    "summary": "Reduce a resume or application PDF to fit a portal limit while keeping text, certificates and supporting documents readable.",
    "readTime": "7 minute guide",
    "primaryKeyword": "compress pdf for job application",
    "related": [
      "compress-pdf",
      "merge-pdf",
      "split-pdf"
    ],
    "sections": [
      {
        "title": "Read the application portal requirements",
        "paragraphs": [
          "Check the maximum file size, accepted PDF format and whether the portal asks for one combined document or separate uploads. Do this before changing your files.",
          "Keep the original resume, certificates and supporting PDFs untouched so you can create a new application copy without losing quality."
        ],
        "bullets": [
          "Record the size limit",
          "Check whether one or several PDFs are required",
          "Keep original documents",
          "Use professional filenames"
        ]
      },
      {
        "title": "Create the final document before compression",
        "paragraphs": [
          "If the portal requires one PDF, merge the required documents in the correct order first. Compression should usually happen after the final page set is complete so you are not repeatedly recompressing individual files.",
          "Remove pages that are not requested. A shorter document can meet a size limit without reducing image quality as much."
        ]
      },
      {
        "title": "Compress with readability as the priority",
        "paragraphs": [
          "Use a moderate compression setting and check small resume text, certificate numbers, signatures, QR codes and official stamps. These details are more important than achieving the smallest possible output.",
          "If strong compression makes scans fuzzy, return to a higher-quality setting or split supporting documents when the portal permits multiple uploads."
        ],
        "bullets": [
          "Check resume text",
          "Inspect certificates",
          "Keep QR codes readable",
          "Avoid repeated compression"
        ]
      },
      {
        "title": "Test the exact file you will upload",
        "paragraphs": [
          "Open the compressed copy, confirm page count and file size, then upload that exact file. Do not rename or replace it with a different copy after validation.",
          "If the portal performs its own preview, compare that preview with your local PDF before submitting the application."
        ]
      }
    ],
    "checklist": [
      "Follow portal requirements",
      "Merge before compressing when one file is required",
      "Protect text readability",
      "Preview the final upload"
    ]
  },
  {
    "slug": "edit-pdf-without-installing-software",
    "pillar": "edit-pdf",
    "eyebrow": "Browser PDF editor guide",
    "title": "How to edit a PDF without installing software",
    "metaTitle": "Edit PDF Without Installing Software",
    "summary": "Make practical PDF corrections in a browser, understand text-layer limitations, and verify the exported copy without installing desktop software.",
    "readTime": "8 minute guide",
    "primaryKeyword": "edit pdf without software",
    "related": [
      "edit-pdf",
      "add-text",
      "sign-pdf"
    ],
    "sections": [
      {
        "title": "Identify what kind of edit you need",
        "paragraphs": [
          "PDF editing is different from editing a Word document. Short corrections such as a date, name, number or amount are usually easier than rewriting a whole paragraph because PDF text can be stored as positioned glyphs rather than flowing text.",
          "Decide whether you need to replace existing visible text, add new text, place an image or signature, highlight content, or manage pages. Choosing the right edit method prevents unnecessary changes."
        ],
        "bullets": [
          "Replace short existing text",
          "Add new text",
          "Insert image or signature",
          "Manage pages separately"
        ]
      },
      {
        "title": "Use Smart Replace when a text layer is available",
        "paragraphs": [
          "AJN PDF Edit PDF uses PDF.js to detect text positions and available font information. When you click detected text, the editor can reuse position, size, baseline and width information for a visual replacement.",
          "Embedded PDF fonts can be subset or proprietary. Exact font reuse is not guaranteed, so review the editor's match status and the live preview rather than assuming every replacement is identical."
        ],
        "note": "For scanned image-only PDFs, normal text selection may not exist. Manual Whiteout plus Add Text is the practical fallback."
      },
      {
        "title": "Use manual editing for difficult PDFs",
        "paragraphs": [
          "Whiteout can visually cover old content before you add replacement text. It is useful for appearance changes but it is not secure redaction and should not be used to remove sensitive information from the underlying PDF structure.",
          "Add images and visual signatures only after checking their size and placement at normal zoom."
        ],
        "bullets": [
          "Whiteout is visual only",
          "Match alignment carefully",
          "Keep signatures inside intended fields",
          "Use live preview before export"
        ]
      },
      {
        "title": "Export and compare the new PDF",
        "paragraphs": [
          "Download the edited copy and open it in another PDF viewer. Check the changed text, font appearance, baseline, spacing, page count and any images or signatures you added.",
          "Keep the original file. The edited download should be treated as a new PDF until you have confirmed that the result is correct."
        ]
      }
    ],
    "checklist": [
      "Choose the right edit method",
      "Review font match status",
      "Do not treat whiteout as redaction",
      "Open the exported PDF independently"
    ]
  },
  {
    "slug": "edit-pdf-on-android",
    "pillar": "edit-pdf",
    "eyebrow": "Android PDF editor guide",
    "title": "How to edit a PDF on Android in your browser",
    "metaTitle": "Edit PDF on Android in Your Browser",
    "summary": "Use the AJN PDF browser editor on Android for short text corrections, images and signatures, then validate the exported PDF.",
    "readTime": "7 minute guide",
    "primaryKeyword": "edit pdf on android",
    "related": [
      "edit-pdf",
      "sign-pdf",
      "add-text"
    ],
    "sections": [
      {
        "title": "Open the PDF from Android storage",
        "paragraphs": [
          "Save the PDF in a folder that is easy to reach from the browser file picker. Open the source file first and note the exact text or page you need to change.",
          "Editing on a phone screen is easier when you know the target page in advance. For a long PDF, write down the page number before opening the editor."
        ],
        "bullets": [
          "Use the final source file",
          "Know the target page",
          "Keep the original",
          "Close unnecessary browser tabs"
        ]
      },
      {
        "title": "Select existing text when possible",
        "paragraphs": [
          "If the PDF contains a usable text layer, tap detected text and make a short replacement such as a date, name or number. The editor uses available text metrics to place the replacement close to the original position.",
          "Zoom in before confirming the edit. Small phone screens can hide spacing or baseline differences that become obvious on a desktop viewer."
        ]
      },
      {
        "title": "Use manual tools for scans and signatures",
        "paragraphs": [
          "Scanned pages may behave like images rather than selectable text. Use the manual Whiteout and Add Text workflow when normal text detection is unavailable.",
          "For a visual signature, place it inside the intended field and resize it carefully. A visual signature is not the same as a certificate-backed digital signature."
        ],
        "bullets": [
          "Use Whiteout only as a visual cover",
          "Add replacement text separately",
          "Check signature placement",
          "Preview at higher zoom"
        ]
      },
      {
        "title": "Download and inspect the output",
        "paragraphs": [
          "Open the exported PDF in another Android PDF viewer. Check the edited line, surrounding text, page count and any added images or signatures.",
          "If the change does not align well, return to the original and adjust the edit rather than repeatedly editing the exported copy."
        ]
      }
    ],
    "checklist": [
      "Know the page to edit",
      "Zoom before confirming text",
      "Use manual fallback for scans",
      "Validate the export in another viewer"
    ]
  },
  {
    "slug": "edit-pdf-on-chromebook",
    "pillar": "edit-pdf",
    "eyebrow": "Chromebook PDF editor guide",
    "title": "How to edit a PDF on a Chromebook without a desktop app",
    "metaTitle": "Edit PDF on Chromebook Without an App",
    "summary": "Edit practical PDF details on ChromeOS using a browser workspace, with smart text replacement and manual fallback for difficult documents.",
    "readTime": "7 minute guide",
    "primaryKeyword": "edit pdf on chromebook",
    "related": [
      "edit-pdf",
      "add-text",
      "add-image-to-pdf"
    ],
    "sections": [
      {
        "title": "Prepare the PDF in ChromeOS Files",
        "paragraphs": [
          "Keep the source PDF in Downloads, My files or a synced location and open it once in Chrome's PDF viewer. Note the pages and values that need correction.",
          "Create a backup copy before editing important documents. PDF edits create a new output, so the source should remain available for comparison."
        ],
        "bullets": [
          "Open source in Chrome",
          "Note target pages",
          "Keep a backup",
          "Use a descriptive filename"
        ]
      },
      {
        "title": "Use detected text for short corrections",
        "paragraphs": [
          "Open AJN PDF Edit PDF and select the document. When the PDF exposes a text layer, detected text can be selected for a visual replacement using its position, size, baseline and available font characteristics.",
          "ChromeOS is well suited to this workflow because the editor runs in the browser and does not require a traditional desktop PDF application."
        ],
        "note": "Font matching is best effort. Some subset or proprietary PDF fonts cannot be recreated exactly in a browser."
      },
      {
        "title": "Handle scans with manual tools",
        "paragraphs": [
          "If text cannot be selected, the page may be scanned or flattened. Use Whiteout to cover the visible text and Add Text to place a replacement. This changes appearance but does not securely redact underlying sensitive data.",
          "Use the live preview to check alignment, line height and contrast before exporting."
        ],
        "bullets": [
          "Use manual edit for image-only text",
          "Match size and alignment",
          "Avoid claiming whiteout is redaction",
          "Check at 100% zoom"
        ]
      },
      {
        "title": "Compare the exported PDF",
        "paragraphs": [
          "Download the new file and open it in Chrome or another viewer. Compare the edited area with the original and verify that all expected pages remain present.",
          "For formal documents, confirm that the recipient accepts a visually edited PDF and that no existing digital signature has been invalidated."
        ]
      }
    ],
    "checklist": [
      "Back up the source",
      "Use Smart Replace for selectable text",
      "Use manual fallback for scans",
      "Verify the final document"
    ]
  },
  {
    "slug": "change-date-in-pdf-online",
    "pillar": "edit-pdf",
    "eyebrow": "PDF text correction guide",
    "title": "How to change a date in a PDF online",
    "metaTitle": "Change a Date in a PDF Online",
    "summary": "Correct a visible date in a PDF using text detection when available, or manual cover-and-replace tools when the page is scanned or flattened.",
    "readTime": "7 minute guide",
    "primaryKeyword": "change date in pdf online",
    "related": [
      "edit-pdf",
      "add-text",
      "compare-pdf"
    ],
    "sections": [
      {
        "title": "Confirm that changing the date is appropriate",
        "paragraphs": [
          "Only edit a document you own or are authorized to modify. For contracts, certificates, invoices or official records, changing a date can alter the meaning of the document and may require approval from the issuer or other parties.",
          "Keep the original PDF unchanged so the edit can be reviewed and traced."
        ],
        "bullets": [
          "Confirm authorization",
          "Keep the original file",
          "Know the exact replacement date",
          "Check whether approval is required"
        ]
      },
      {
        "title": "Select the existing date",
        "paragraphs": [
          "Open Edit PDF and click the date when it is detected as text. Short values such as dates are well suited to Smart Replace because the editor can reuse the original position, size and baseline information.",
          "Enter the new date in the same format when possible. A replacement with very different length can require spacing or horizontal scaling adjustments."
        ]
      },
      {
        "title": "Use manual cover and replacement when needed",
        "paragraphs": [
          "If the date is part of a scanned image, use a visual Whiteout over the old date and add new text on top. Match font size, colour and alignment as closely as practical.",
          "Whiteout only covers the visible area. It is not secure redaction and should not be used when sensitive underlying content must actually be removed."
        ],
        "bullets": [
          "Match date format",
          "Match text size",
          "Check baseline",
          "Use whiteout only for appearance changes"
        ]
      },
      {
        "title": "Review the edited copy",
        "paragraphs": [
          "Export the PDF and open it in another viewer. Check the new date at normal zoom and compare surrounding text, spacing and page appearance.",
          "Do not overwrite the original until the edited copy has been accepted for its intended use."
        ]
      }
    ],
    "checklist": [
      "Edit only with authorization",
      "Preserve the source",
      "Match the existing date style",
      "Validate the exported copy"
    ]
  },
  {
    "slug": "change-name-or-number-in-pdf",
    "pillar": "edit-pdf",
    "eyebrow": "PDF correction guide",
    "title": "How to change a name or number in a PDF",
    "metaTitle": "Change a Name or Number in a PDF",
    "summary": "Replace a short name, reference number or amount in a PDF while preserving visual alignment and understanding font and scan limitations.",
    "readTime": "7 minute guide",
    "primaryKeyword": "change name in pdf",
    "related": [
      "edit-pdf",
      "add-text",
      "compare-pdf"
    ],
    "sections": [
      {
        "title": "Use the correct source document",
        "paragraphs": [
          "Open the PDF and confirm that you are editing the latest authorized version. For financial, legal, academic or identity documents, make sure you are permitted to change the value.",
          "Write down the exact old and new text before starting. Short corrections are easier to validate when you can compare them directly."
        ],
        "bullets": [
          "Use the current PDF",
          "Confirm authorization",
          "Record old and new values",
          "Keep a backup"
        ]
      },
      {
        "title": "Replace selectable text with Smart Replace",
        "paragraphs": [
          "When the name or number exists in the PDF text layer, select it in Edit PDF. The editor can use the original text position, size, width and available font data to create a visual replacement.",
          "Names can be longer or shorter than the original. Review horizontal fit and spacing carefully so the new value does not overlap nearby content."
        ]
      },
      {
        "title": "Use manual editing for flattened content",
        "paragraphs": [
          "If the visible value is part of an image or cannot be selected, use Whiteout to cover it and Add Text for the replacement. Match text colour, size and alignment manually.",
          "Do not use this visual method as a substitute for secure redaction of confidential information."
        ],
        "bullets": [
          "Check text width",
          "Match colour and size",
          "Avoid overlapping labels",
          "Treat whiteout as visual only"
        ]
      },
      {
        "title": "Compare the result before use",
        "paragraphs": [
          "Download the new PDF and compare the edited location at normal and higher zoom. Verify that the intended value changed and that no nearby text or page content moved unexpectedly.",
          "For amounts or reference numbers, read the replacement character by character before sending the document."
        ]
      }
    ],
    "checklist": [
      "Confirm permission to edit",
      "Check text width and alignment",
      "Review every changed character",
      "Keep the original document"
    ]
  },
  {
    "slug": "split-pdf-on-android",
    "pillar": "split-pdf",
    "eyebrow": "Android PDF guide",
    "title": "How to split a PDF on Android without installing an app",
    "metaTitle": "Split PDF on Android Without an App",
    "summary": "Extract pages or divide a PDF from an Android browser, then verify every output file before uploading or sharing it.",
    "readTime": "6 minute guide",
    "primaryKeyword": "split pdf on android",
    "related": [
      "split-pdf",
      "merge-pdf",
      "organize-pdf"
    ],
    "sections": [
      {
        "title": "Open the source PDF and identify pages",
        "paragraphs": [
          "Use an Android PDF viewer to check the page count and note the pages you need. Decide whether you want a specific range, individual pages or several smaller documents.",
          "Keep the original PDF untouched. Splitting creates new files and does not automatically remove content inside a selected page."
        ],
        "bullets": [
          "Write down page ranges",
          "Check total page count",
          "Keep the source PDF",
          "Confirm confidential boundaries"
        ]
      },
      {
        "title": "Open Split PDF in your browser",
        "paragraphs": [
          "Select the PDF in AJN PDF Split PDF from Android storage. The supported split workflow runs in the active browser session and does not require a separate Android application.",
          "Large PDFs use more memory, so close other browser tabs if the phone is resource constrained."
        ]
      },
      {
        "title": "Choose ranges carefully",
        "paragraphs": [
          "Enter ranges such as 1-3,5,8-10 only after comparing them with the real page count. If the interface offers split-every-page or fixed intervals, preview how many output files will be produced.",
          "Use meaningful groups rather than arbitrary chunks when the files will be emailed or uploaded separately."
        ],
        "bullets": [
          "Check start and end pages",
          "Avoid accidental gaps",
          "Name outputs clearly",
          "Group related pages together"
        ]
      },
      {
        "title": "Open every downloaded output",
        "paragraphs": [
          "When several PDFs are created, open each one or inspect the ZIP contents before sharing. Confirm that no required page is missing and no confidential page was included accidentally.",
          "Keep the original source until the recipient or portal accepts the split files."
        ]
      }
    ],
    "checklist": [
      "Record page ranges",
      "Check ranges against real page count",
      "Open each output",
      "Keep the source file"
    ]
  },
  {
    "slug": "extract-pages-from-pdf",
    "pillar": "split-pdf",
    "eyebrow": "PDF page extraction guide",
    "title": "How to extract selected pages from a PDF",
    "metaTitle": "Extract Selected Pages From a PDF",
    "summary": "Create a new PDF containing only the pages you need while keeping the original file unchanged and checking page ranges carefully.",
    "readTime": "6 minute guide",
    "primaryKeyword": "extract pages from pdf",
    "related": [
      "split-pdf",
      "organize-pdf",
      "delete-pdf-pages"
    ],
    "sections": [
      {
        "title": "List the exact pages you need",
        "paragraphs": [
          "Open the PDF and note the page numbers for the content you want to keep. Watch for printed page numbers that differ from the PDF viewer's page index because covers and front matter can shift the numbering.",
          "If you need several separate ranges in one output, write them down before entering them into the tool."
        ],
        "bullets": [
          "Compare printed and viewer page numbers",
          "Record all required ranges",
          "Check first and last selected page",
          "Keep the source PDF"
        ]
      },
      {
        "title": "Use Split PDF for extraction",
        "paragraphs": [
          "Open Split PDF, select the source document and enter the chosen pages or ranges. The browser workflow validates requested pages against the PDF's actual page count before creating the output.",
          "Extracting pages copies selected pages into a new PDF. It does not edit the original file."
        ]
      },
      {
        "title": "Check document-level features",
        "paragraphs": [
          "Page extraction can affect bookmarks, attachments, forms and existing digital signatures because the selected pages are copied into a new document structure.",
          "If these advanced features matter, test them in the extracted result rather than assuming they will behave exactly like the source."
        ],
        "bullets": [
          "Check bookmarks if required",
          "Test form fields",
          "Review signatures",
          "Verify attachments separately"
        ]
      },
      {
        "title": "Validate the extracted file",
        "paragraphs": [
          "Open the new PDF and verify its page count and content. Check the first and last extracted page and scan for any sensitive content that should not be included.",
          "Use a descriptive filename that explains what the extracted PDF contains."
        ]
      }
    ],
    "checklist": [
      "Use viewer page numbers carefully",
      "Validate page ranges",
      "Test important PDF features",
      "Open the extracted file before sharing"
    ]
  },
  {
    "slug": "split-pdf-for-email",
    "pillar": "split-pdf",
    "eyebrow": "Email PDF guide",
    "title": "How to split a large PDF for email",
    "metaTitle": "Split a Large PDF for Email",
    "summary": "Divide a large PDF into logical smaller files for email when compression alone would reduce quality too much or the document has natural sections.",
    "readTime": "7 minute guide",
    "primaryKeyword": "split pdf for email",
    "related": [
      "split-pdf",
      "compress-pdf",
      "merge-pdf"
    ],
    "sections": [
      {
        "title": "Check whether splitting is better than more compression",
        "paragraphs": [
          "If a PDF is over an email attachment limit, first decide whether the recipient can accept more than one file. Splitting can preserve quality better than repeatedly applying stronger compression.",
          "Natural sections such as Part 1 and Part 2, separate reports or groups of supporting documents are easier for recipients to understand than arbitrary page chunks."
        ],
        "bullets": [
          "Know the attachment limit",
          "Confirm multiple files are acceptable",
          "Identify natural sections",
          "Keep the original PDF"
        ]
      },
      {
        "title": "Plan the page ranges",
        "paragraphs": [
          "Open the PDF and decide where each part should begin and end. Avoid splitting a table, form or chapter in the middle when possible.",
          "Estimate how many parts you need based on the original size and the email limit. Exact output sizes can vary by page content."
        ]
      },
      {
        "title": "Create clearly named parts",
        "paragraphs": [
          "Use Split PDF to extract each range, then name the outputs consistently such as Report-Part-1-of-3.pdf. Clear names help the recipient reconstruct the intended sequence.",
          "If one part is still too large, compress that specific output rather than degrading every part."
        ],
        "bullets": [
          "Use sequential filenames",
          "Keep related pages together",
          "Compress only oversized parts",
          "Do not omit cover or context pages accidentally"
        ]
      },
      {
        "title": "Send and verify every attachment",
        "paragraphs": [
          "Open each output before attaching it. Check page count, first and last page and file size. Make sure the email includes every part before sending.",
          "In the message body, tell the recipient how many parts to expect so missing attachments are obvious."
        ]
      }
    ],
    "checklist": [
      "Choose logical split points",
      "Use sequential filenames",
      "Open every part",
      "Tell the recipient how many files to expect"
    ]
  },
  {
    "slug": "separate-pdf-pages-without-software",
    "pillar": "split-pdf",
    "eyebrow": "Browser PDF guide",
    "title": "How to separate PDF pages without installing software",
    "metaTitle": "Separate PDF Pages Without Software",
    "summary": "Split or extract PDF pages in a browser workflow when you need smaller documents but do not want to install a desktop PDF application.",
    "readTime": "6 minute guide",
    "primaryKeyword": "separate pdf pages without software",
    "related": [
      "split-pdf",
      "delete-pdf-pages",
      "organize-pdf"
    ],
    "sections": [
      {
        "title": "Choose between split, extract and delete",
        "paragraphs": [
          "Use Split PDF when you want one or more new PDFs from selected pages. Use Delete Pages when you want one new copy with certain pages removed. Use Organize PDF when page order and other page-level changes also need attention.",
          "Picking the correct operation keeps the workflow simple and reduces unnecessary processing."
        ],
        "bullets": [
          "Split into several outputs",
          "Extract a selected range",
          "Delete unwanted pages",
          "Organize when order also changes"
        ]
      },
      {
        "title": "Use a browser workflow",
        "paragraphs": [
          "AJN PDF Split PDF processes supported splitting tasks in the active browser session, so a separate desktop program is not required.",
          "Browser processing keeps the task focused, but very large PDFs still depend on available device memory and browser stability."
        ]
      },
      {
        "title": "Enter ranges against the real page count",
        "paragraphs": [
          "Open the source PDF and confirm its actual page count. Enter ranges carefully, especially when printed page numbers differ from the viewer's page index.",
          "Preview the expected number of output files when splitting every page or using fixed intervals."
        ],
        "bullets": [
          "Confirm page count",
          "Check range syntax",
          "Watch printed vs viewer numbering",
          "Use logical groups"
        ]
      },
      {
        "title": "Review the separated files",
        "paragraphs": [
          "Open each generated PDF and confirm that the intended pages are present. Page-level splitting does not remove hidden information inside a selected page, so use appropriate redaction tools when confidentiality is the goal.",
          "Keep the source document until all outputs have been validated."
        ]
      }
    ],
    "checklist": [
      "Choose the correct page operation",
      "Check actual page numbers",
      "Validate all outputs",
      "Do not confuse splitting with secure redaction"
    ]
  },
  {
    "slug": "split-large-pdf-into-smaller-files",
    "pillar": "split-pdf",
    "eyebrow": "Large PDF guide",
    "title": "How to split a large PDF into smaller files",
    "metaTitle": "Split a Large PDF Into Smaller Files",
    "summary": "Divide a long PDF into practical smaller documents by ranges or sections, with clear filenames and output checks for every part.",
    "readTime": "7 minute guide",
    "primaryKeyword": "split large pdf into smaller files",
    "related": [
      "split-pdf",
      "compress-pdf",
      "organize-pdf"
    ],
    "sections": [
      {
        "title": "Decide how the smaller files will be used",
        "paragraphs": [
          "Split by logical sections when people will read the files separately. Split by approximate size only when a system limit is the main constraint. A meaningful structure is easier to manage than equal page counts that cut through chapters or forms.",
          "Write down the desired parts before processing so you can confirm that every source page is assigned once."
        ],
        "bullets": [
          "Split by chapters",
          "Split by document type",
          "Split for upload limits",
          "Avoid gaps and duplicate ranges"
        ]
      },
      {
        "title": "Check page boundaries",
        "paragraphs": [
          "Open the large PDF and identify good break points. Check for blank separator pages, multi-page forms, tables and appendices that should stay together.",
          "If the PDF viewer displays labels such as i, ii, 1, 2, compare them with the actual page index used by the splitting tool."
        ]
      },
      {
        "title": "Create parts in a consistent sequence",
        "paragraphs": [
          "Use Split PDF to create the planned ranges. Name files with a stable pattern such as Manual-Part-01.pdf, Manual-Part-02.pdf and so on.",
          "For a very large browser job, processing a few ranges at a time can reduce memory pressure on lower-powered devices."
        ],
        "bullets": [
          "Use padded sequence numbers",
          "Keep section names descriptive",
          "Process huge jobs in manageable groups",
          "Keep a range checklist"
        ]
      },
      {
        "title": "Audit the full set",
        "paragraphs": [
          "Open the first and last page of every part and compare the combined page counts with the original. Confirm there are no gaps between one part's ending page and the next part's starting page.",
          "Keep the original large PDF as the authoritative backup until the smaller files are accepted."
        ]
      }
    ],
    "checklist": [
      "Plan logical sections",
      "Check every boundary",
      "Use consistent filenames",
      "Verify no pages are missing or duplicated"
    ]
  }
];

export function getSeoGrowthGuidesForTool(toolId: string): SeoGrowthGuide[] {
  return SEO_GROWTH_GUIDES.filter((guide) => guide.pillar === toolId);
}

export function getSeoGrowthGuide(slug: string): SeoGrowthGuide | undefined {
  return SEO_GROWTH_GUIDES.find((guide) => guide.slug === slug);
}

export function isSeoGrowthPillar(toolId: string): toolId is SeoGrowthPillarId {
  return Object.prototype.hasOwnProperty.call(SEO_GROWTH_PILLARS, toolId);
}
