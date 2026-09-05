import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, FileText, FileType2, ImageIcon, ShieldCheck, Shrink, Accessibility } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { SEO_GROWTH_GUIDES } from '@/lib/seo-growth-guides';

export const metadata: Metadata = {
  title: 'Practical PDF Guides | AJN PDF',
  description: 'Practical AJN PDF guides for PDF workflows, document conversion, compression, accessibility and file security.',
  alternates: { canonical: '/blog' },
};

const articles = [
  {
    href: '/blog/how-to-merge-pdfs-online-safely',
    title: 'How to merge PDFs online safely',
    desc: 'Check page order, processing mode, output quality and document handling before sharing one combined PDF.',
    tag: 'Workflow', readTime: '5 min', icon: FileText,
  },
  {
    href: '/blog/reduce-pdf-size-keep-quality',
    title: 'Reduce PDF size while keeping text readable',
    desc: 'Choose practical compression levels and understand why some already optimized PDFs shrink only slightly.',
    tag: 'Compression', readTime: '6 min', icon: Shrink,
  },
  {
    href: '/blog/pdf-vs-docx',
    title: 'PDF vs DOCX: when to use each format',
    desc: 'Choose PDF for stable presentation and DOCX for active editing, with realistic conversion expectations.',
    tag: 'Formats', readTime: '5 min', icon: FileType2,
  },
  {
    href: '/blog/why-pdf-compression-limited',
    title: 'Why some PDFs cannot be compressed much further',
    desc: 'See how optimized images, fonts and internal streams can leave little redundant data to remove.',
    tag: 'Troubleshooting', readTime: '5 min', icon: Shrink,
  },
  {
    href: '/blog/image-to-pdf-jpg-vs-png',
    title: 'Image to PDF: JPG vs PNG',
    desc: 'Choose image sources based on photographs, sharp graphics, transparency and the final PDF workflow.',
    tag: 'Images', readTime: '5 min', icon: ImageIcon,
  },
  {
    href: '/blog/pdf-accessibility-basics',
    title: 'PDF accessibility basics before sharing',
    desc: 'Review real text, reading order, contrast, zoom and validation needs before distributing a document.',
    tag: 'Accessibility', readTime: '6 min', icon: Accessibility,
  },
  {
    href: '/blog/browser-native-architecture',
    title: 'How browser-based PDF processing works',
    desc: 'Understand on-device processing, memory limits and why some advanced workflows use an online conversion engine.',
    tag: 'Architecture', readTime: '6 min', icon: BookOpen,
  },
  {
    href: '/blog/document-security-aes256',
    title: 'PDF passwords and AES-256 explained',
    desc: 'Learn about open passwords, owner permissions and authorized password removal without bypass claims.',
    tag: 'Security', readTime: '7 min', icon: ShieldCheck,
  },
  {
    href: '/blog/best-free-pdf-editor',
    title: 'How to evaluate a free PDF editor',
    desc: 'Compare real output, processing labels, limits and download quality rather than relying on unsupported claims.',
    tag: 'Guide', readTime: '5 min', icon: BookOpen,
  }];

export default function BlogPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />
      <main className="pt-28">
        <section className="mx-auto max-w-6xl px-5 pb-24 pt-10 md:px-8 md:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-extrabold text-blue-700"><BookOpen className="h-4 w-4" /> AJN PDF guides</span>
            <h1 className="mt-7 text-balance text-[clamp(2.5rem,7vw,4.8rem)] font-black leading-[1.02] tracking-[-.045em]">Practical guides for better document workflows</h1>
            <p className="mt-6 text-base font-medium leading-8 text-muted-foreground md:text-lg">Useful guidance for PDF, conversion, compression, accessibility and everyday document work.</p>
          </div>


          <section className="mt-14" aria-labelledby="long-tail-pdf-guides">
            <div className="rounded-3xl border border-blue-100 bg-blue-50/55 p-6 md:p-8">
              <span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-700">Task-specific guides</span>
              <h2 id="long-tail-pdf-guides" className="mt-3 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                Device and workflow guides for Edit, Merge, Compress and Split PDF
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600">
                Twenty focused guides answer common mobile, Chromebook, email, application and page-management questions, then link directly to the matching AJN PDF tool.
              </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {SEO_GROWTH_GUIDES.map((guide) => (
                <Link key={guide.slug} href={`/blog/${guide.slug}`} className="group block" prefetch={false}>
                  <article className="ajn-tool-card flex h-full flex-col p-6">
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700">
                        <BookOpen className="h-5 w-5" />
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{guide.readTime}</span>
                    </div>
                    <div className="mt-5 flex-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-blue-600">{guide.primaryKeyword}</span>
                      <h3 className="mt-3 text-xl font-black leading-tight tracking-tight text-slate-950 transition group-hover:text-blue-700">{guide.title}</h3>
                      <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">{guide.summary}</p>
                    </div>
                    <span className="mt-5 inline-flex items-center gap-2 border-t border-border pt-4 text-xs font-black text-blue-700">
                      Read guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </article>
                </Link>
              ))}
            </div>
          </section>

          <div className="mt-16 border-t border-border pt-10">
            <span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-500">Core reference guides</span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Broader PDF guidance</h2>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link key={article.href} href={article.href} className="group block" prefetch={false}>
                <article className="ajn-tool-card flex h-full flex-col p-6 md:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700"><article.icon className="h-5 w-5" /></span>
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-600"><Clock className="h-3.5 w-3.5" /> {article.readTime}</span>
                  </div>
                  <div className="mt-6 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-600">{article.tag}</span>
                    <h2 className="mt-3 text-xl font-black leading-tight tracking-tight transition-colors duration-150 group-hover:text-blue-700 md:text-2xl">{article.title}</h2>
                    <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground">{article.desc}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-border pt-5 text-sm font-extrabold text-foreground">
                    Read guide <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-blue-600" />
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <MainFooter />
    </div>
  );
}
