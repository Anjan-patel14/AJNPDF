import { getPublicToolCategory, type ServiceTool } from './tools-data';
import { BUILD_PUBLIC_TOOLS } from './build-public-tools';

const GUIDE_MAP: Record<string, { href: string; title: string }[]> = {
  conversion: [
    { href: '/blog/pdf-vs-docx', title: 'PDF vs DOCX: when to use each format' },
    { href: '/blog/browser-native-architecture', title: 'How online conversion processing works' }
  ],
  image: [
    { href: '/blog/image-to-pdf-jpg-vs-png', title: 'Image to PDF: JPG vs PNG' },
    { href: '/blog/pdf-accessibility-basics', title: 'PDF accessibility basics' }
  ],
  pdf: [
    { href: '/blog/how-to-merge-pdfs-online-safely', title: 'How to merge PDFs safely' },
    { href: '/blog/reduce-pdf-size-keep-quality', title: 'Reduce PDF size while keeping text readable' },
    { href: '/blog/document-security-aes256', title: 'PDF passwords and AES-256 explained' }
  ],
};

const TOOL_GUIDES: Record<string, { href: string; title: string }[]> = {
  'edit-pdf': [
    { href: '/blog/edit-pdf-without-installing-software', title: 'Edit a PDF without installing software' },
    { href: '/blog/change-date-in-pdf-online', title: 'Change a date in a PDF online' },
    { href: '/blog/change-name-or-number-in-pdf', title: 'Change a name or number in a PDF' }
  ],
  'merge-pdf': [
    { href: '/blog/merge-pdf-without-installing-software', title: 'Merge PDFs without installing software' },
    { href: '/blog/merge-pdf-on-android', title: 'Merge PDF files on Android' },
    { href: '/blog/combine-pdf-pages-in-correct-order', title: 'Combine PDFs in the correct order' }
  ],
  'compress-pdf': [
    { href: '/blog/compress-pdf-for-email', title: 'Compress a PDF for email' },
    { href: '/blog/compress-pdf-on-android', title: 'Compress a PDF on Android' },
    { href: '/blog/compress-pdf-for-job-application', title: 'Compress a PDF for a job application' },
    { href: '/blog/reduce-pdf-size-keep-quality', title: 'Reduce PDF size while keeping text readable' },
    { href: '/blog/why-pdf-compression-limited', title: 'Why some PDFs barely shrink' }
  ],
  'split-pdf': [
    { href: '/blog/extract-pages-from-pdf', title: 'Extract selected pages from a PDF' },
    { href: '/blog/split-pdf-on-android', title: 'Split a PDF on Android' },
    { href: '/blog/split-large-pdf-into-smaller-files', title: 'Split a large PDF into smaller files' }
  ],
  'pdf-to-word': [
    { href: '/blog/pdf-vs-docx', title: 'PDF vs DOCX: when to use each format' },
    { href: '/blog/pdf-accessibility-basics', title: 'PDF accessibility basics' }
  ],
  'jpg-to-pdf': [
    { href: '/blog/image-to-pdf-jpg-vs-png', title: 'Image to PDF: JPG vs PNG' }
  ],
  'png-to-pdf': [
    { href: '/blog/image-to-pdf-jpg-vs-png', title: 'Image to PDF: JPG vs PNG' }
  ],
};

function keywordSet(tool: ServiceTool): Set<string> {
  return new Set([tool.tag, tool.cat, ...tool.keywords].map((item) => item.toLowerCase()));
}

export function getRelatedTools(toolId: string, limit = 6): ServiceTool[] {
  const current = BUILD_PUBLIC_TOOLS.find((tool) => tool.id === toolId);
  if (!current) return [];
  const currentKeywords = keywordSet(current);
  const category = getPublicToolCategory(current);

  return BUILD_PUBLIC_TOOLS
    .filter((tool) => tool.id !== toolId)
    .map((tool) => {
      const shared = [...keywordSet(tool)].filter((keyword) => currentKeywords.has(keyword)).length;
      const categoryScore = getPublicToolCategory(tool) === category ? 4 : 0;
      const tagScore = tool.tag === current.tag ? 3 : 0;
      const conversionPair = current.id.includes('-to-') && tool.id.includes('-to-') ? 2 : 0;
      const popularScore = tool.badge === 'Popular' ? 1 : 0;
      return { tool, score: shared + categoryScore + tagScore + conversionPair + popularScore };
    })
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .slice(0, limit)
    .map(({ tool }) => tool);
}

export function getRelatedGuides(tool: ServiceTool) {
  const specific = TOOL_GUIDES[tool.id] ?? [];
  const category = GUIDE_MAP[getPublicToolCategory(tool)] ?? GUIDE_MAP.pdf;
  const combined = [...specific, ...category];
  return combined.filter((guide, index) => combined.findIndex((candidate) => candidate.href === guide.href) === index).slice(0, 3);
}
