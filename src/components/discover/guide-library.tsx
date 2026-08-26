import Link from 'next/link';
import { ArrowRight, BookOpen, FileOutput, FileText, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { BUILD_PUBLIC_TOOLS } from '@/lib/build-public-tools';
import { toolPath } from '@/lib/tool-routes';

const clusters = [
  {
    icon: FileText,
    title: 'Essential PDF workflows',
    description: 'Start with the highest-demand document actions and learn what to check before replacing the source file.',
    ids: ['merge-pdf', 'split-pdf', 'compress-pdf', 'organize-pdf', 'rotate-pdf', 'add-text'],
  },
  {
    icon: FileOutput,
    title: 'Document conversion',
    description: 'Move between PDF and editable office formats with clear expectations about layout and fidelity.',
    ids: ['pdf-to-word', 'word-to-pdf', 'pdf-to-excel', 'excel-to-pdf', 'doc-to-pdf', 'pdf-to-powerpoint'],
  },
  {
    icon: ImageIcon,
    title: 'Image and visual workflows',
    description: 'Prepare images for PDF, export PDF images and reduce or resize visual assets for practical use.',
    ids: ['jpg-to-pdf', 'png-to-pdf', 'extract-images', 'image-resizer', 'image-reducer', 'svg-to-pdf'],
  },
  {
    icon: ShieldCheck,
    title: 'Security and recovery',
    description: 'Understand authorization, passwords, repair limits and the difference between visible signatures and cryptographic signing.',
    ids: ['protect-pdf', 'unlock-pdf', 'repair-pdf', 'sign-pdf'],
  }] as const;

const trustGuides = [
  { href: '/limits', label: 'Current limits and processing ceilings' },
  { href: '/file-processing-policy', label: 'Browser-native vs server-backed processing' },
  { href: '/transparency', label: 'Transparency and file handling' },
  { href: '/security', label: 'Security practices' },
  { href: '/faq', label: 'Frequently asked questions' },
  { href: '/status', label: 'Live service availability' }] as const;

const toolById = new Map(BUILD_PUBLIC_TOOLS.map((tool) => [tool.id, tool]));

export function GuideLibrary() {
  return (
    <div>
      <section className="grid gap-5 lg:grid-cols-2">
        {clusters.map(({ icon: Icon, title, description, ids }) => {
          const tools = ids.map((id) => toolById.get(id)).filter((tool) => Boolean(tool));
          return (
            <article key={title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,.07)] md:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{description}</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {tools.map((tool) => tool ? (
                  <Link
                    key={tool.id}
                    href={toolPath(tool.id)}
                    className="group flex min-h-12 items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <span>{tool.name}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
                  </Link>
                ) : null)}
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-8 rounded-[2rem] border border-violet-100 bg-violet-50/55 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Trust, limits and troubleshooting</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-slate-600">
              These pages explain how AJN PDF handles files, how live server limits interact with browser-native workflows, and where to check service availability.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trustGuides.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-h-14 items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:text-violet-700"
            >
              <span>{item.label}</span>
              <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
