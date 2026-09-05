import Link from 'next/link';
import { ALL_TOOLS } from '@/lib/tools-data';
import { isToolPublic } from '@/lib/tool-policy';
import { toolPath } from '@/lib/tool-routes';

const RELATED_TOOL_IDS: Record<string, string[]> = {
  'edit-pdf': ['add-text', 'sign-pdf', 'watermark-pdf', 'flatten-pdf'],
  'add-text': ['edit-pdf', 'sign-pdf', 'watermark-pdf', 'flatten-pdf'],
  'add-image-to-pdf': ['edit-pdf', 'sign-pdf', 'image-to-pdf', 'watermark-pdf'],
  'compare-pdf': ['edit-pdf', 'pdf-metadata', 'organize-pdf', 'merge-pdf'],
  'compress-pdf': ['merge-pdf', 'split-pdf', 'organize-pdf', 'image-to-pdf'],
  'crop-pdf': ['organize-pdf', 'rotate-pdf', 'delete-pdf-pages', 'edit-pdf'],
  'delete-pdf-pages': ['organize-pdf', 'split-pdf', 'rotate-pdf', 'merge-pdf'],
  'extract-images': ['image-to-pdf', 'jpg-to-pdf', 'png-to-pdf', 'webp-to-pdf'],
  'flatten-pdf': ['edit-pdf', 'sign-pdf', 'watermark-pdf', 'protect-pdf'],
  'image-to-pdf': ['jpg-to-pdf', 'png-to-pdf', 'webp-to-pdf', 'merge-pdf'],
  'jpeg-to-pdf': ['jpg-to-pdf', 'png-to-pdf', 'webp-to-pdf', 'image-to-pdf'],
  'jpg-to-pdf': ['jpeg-to-pdf', 'png-to-pdf', 'webp-to-pdf', 'image-to-pdf'],
  'merge-pdf': ['split-pdf', 'organize-pdf', 'compress-pdf', 'page-number'],
  'organize-pdf': ['rotate-pdf', 'delete-pdf-pages', 'merge-pdf', 'split-pdf'],
  'page-number': ['organize-pdf', 'watermark-pdf', 'edit-pdf', 'sign-pdf'],
  'pdf-metadata': ['edit-pdf', 'compare-pdf', 'flatten-pdf', 'protect-pdf'],
  'pdf-zip-extract': ['merge-pdf', 'split-pdf', 'organize-pdf', 'compress-pdf'],
  'png-to-pdf': ['jpg-to-pdf', 'webp-to-pdf', 'image-to-pdf', 'merge-pdf'],
  'protect-pdf': ['unlock-pdf', 'sign-pdf', 'flatten-pdf', 'repair-pdf'],
  'repair-pdf': ['protect-pdf', 'unlock-pdf', 'pdf-metadata', 'compare-pdf'],
  'rotate-pdf': ['organize-pdf', 'crop-pdf', 'delete-pdf-pages', 'split-pdf'],
  'sign-pdf': ['edit-pdf', 'add-text', 'flatten-pdf', 'protect-pdf'],
  'split-pdf': ['merge-pdf', 'organize-pdf', 'delete-pdf-pages', 'compress-pdf'],
  'unlock-pdf': ['protect-pdf', 'repair-pdf', 'pdf-metadata', 'flatten-pdf'],
  'watermark-pdf': ['edit-pdf', 'add-text', 'sign-pdf', 'page-number'],
  'webp-to-pdf': ['jpg-to-pdf', 'png-to-pdf', 'image-to-pdf', 'merge-pdf'],
};

export function ToolSeoRelatedLinks({ toolId }: { toolId: string }) {
  const related = (RELATED_TOOL_IDS[toolId] || [])
    .map((id) => ALL_TOOLS.find((tool) => tool.id === id))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool && isToolPublic(tool.id)));

  if (!related.length) return null;

  return (
    <section className="relative z-10 mx-auto max-w-5xl px-4 pb-12" aria-labelledby="related-pdf-tools">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
        <h2 id="related-pdf-tools" className="text-2xl font-black tracking-[-.03em] text-foreground">
          Related PDF tools
        </h2>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-muted-foreground">
          Continue your document workflow with another AJN PDF tool.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((tool) => (
            <Link
              key={tool.id}
              href={toolPath(tool.id)}
              className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 text-sm font-black text-foreground transition hover:border-blue-200 hover:bg-blue-50"
            >
              {tool.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
