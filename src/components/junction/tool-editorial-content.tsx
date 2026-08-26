import Link from 'next/link';
import { ArrowRight, CheckCircle2, CircleAlert, Monitor, Server, Sparkles } from 'lucide-react';
import { getPublicToolCategory, type ServiceTool } from '@/lib/tools-data';
import { getToolEditorial } from '@/lib/tool-editorial';
import { getToolPolicy } from '@/lib/tool-policy';
import { getRelatedGuides, getRelatedTools } from '@/lib/internal-linking';
import { ToolArtwork } from '@/components/ajn/tool-artwork';
import { toolPath } from '@/lib/tool-routes';

export function ToolEditorialContent({ tool }: { tool: ServiceTool }) {
  const content = getToolEditorial(tool);
  const policy = getToolPolicy(tool.id);
  const category = getPublicToolCategory(tool);
  const isImageTool = category === 'image';
  const isBrowser = policy.processingMode === 'browser';
  const ModeIcon = isBrowser ? Monitor : Server;
  const relatedTools = getRelatedTools(tool.id, 6);
  const relatedGuides = getRelatedGuides(tool);
  const overview = tool.id === 'watermark-pdf'
    ? 'Watermark PDF places visible text on selected pages. Common uses include marking drafts, adding a company name, identifying confidential copies, or labeling distributed documents.'
    : content.overview;
  const limitations = isImageTool
    ? [
        policy.limitation || 'Image quality and output size depend on the source dimensions, format and selected settings.',
        'Very large images can use significant browser memory. Keep the original image until the downloaded result has been reviewed.',
      ]
    : content.limitations;
  const faqs = isImageTool
    ? [
        { question: `Is ${tool.name} free to use?`, answer: `Yes. The current AJN PDF production version provides ${tool.name} without a subscription.` },
        { question: `Does AJN PDF store images used with ${tool.name}?`, answer: isBrowser ? 'Supported images are handled within the active browser session. Keep the tab open until the result is ready.' : 'The selected image is sent only for the active request, and temporary request data is scheduled for cleanup after the result is returned.' },
        { question: `Will ${tool.name} preserve image quality?`, answer: 'Quality depends on the source image, output format and selected settings. Review the downloaded result before replacing the original.' },
      ]
    : content.faqs;

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-10 md:px-8 md:pb-20">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-border bg-card p-6 shadow-[0_30px_80px_rgba(15,23,42,.10)] md:rounded-2xl md:p-10">
        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
          <article>
            <div className="ajn-section-kicker"><Sparkles className="h-3.5 w-3.5 text-red-500" /> Practical guide</div>
            <h2 className="mt-5 text-2xl font-black tracking-[-.035em] text-slate-950 md:text-3xl">Use {tool.name} with clear expectations.</h2>
            <p className="mt-6 text-sm font-medium leading-7 text-muted-foreground md:text-base">{overview}</p>
            <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground md:text-base">{content.details}</p>

            <div className="mt-8 rounded-3xl border border-slate-100 bg-slate-50/80 p-6">
              <h3 className="text-lg font-black text-slate-950">Recommended</h3>
              <ol className="mt-5 space-y-4">
                {tool.instructions.map((step, index) => (
                  <li id={`step-${index + 1}`} key={step} className="flex gap-3 text-sm font-medium leading-6 text-muted-foreground">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-black text-white shadow-sm">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </article>

          <aside className="space-y-5">
            <details className="group rounded-2xl border border-slate-200 bg-slate-50/75 p-5">
              <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-black text-slate-950">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm"><ModeIcon className="h-[18px] w-[18px]" /></span>
                <span className="flex-1">File handling details</span>
                <span className="text-xs font-black text-blue-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
                {isBrowser
                  ? 'This tool handles supported files within the active session. Keep this tab open until your result is ready.'
                  : 'This operation sends the selected file only for the active request. Request workspace data is scheduled for cleanup after the result is returned.'}
              </p>
            </details>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-900"><CheckCircle2 className="h-4 w-4" /> Useful tips</h3>
              <ul className="mt-4 space-y-3 text-sm font-medium leading-6 text-emerald-950/75">
                {content.tips.map((tip) => <li key={tip} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-sm bg-emerald-600" />{tip}</li>)}
              </ul>
            </div>
          </aside>
        </div>

        <div className="relative mt-10 grid gap-6 border-t border-slate-100 pt-10 md:grid-cols-2">
          <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-6">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><CircleAlert className="h-5 w-5 text-amber-600" /> Important limitations</h3>
            <ul className="mt-4 space-y-3 text-sm font-medium leading-6 text-muted-foreground">
              {limitations.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-sm bg-amber-500" />{item}</li>)}
            </ul>
          </div>
          <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6">
            <h3 className="text-lg font-black text-slate-950">Common uses</h3>
            <ul className="mt-4 space-y-3 text-sm font-medium leading-6 text-muted-foreground">
              {[...tool.useCases, ...tool.benefits].map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-sm bg-blue-600" />{item}</li>)}
            </ul>
          </div>
        </div>

        <div className="relative mt-10 border-t border-slate-100 pt-10">
          <h3 className="text-2xl font-black tracking-tight text-slate-950">Questions about {tool.name}</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h4 className="font-black leading-6 text-slate-950">{faq.question}</h4>
                <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="relative mt-10 grid gap-6 border-t border-slate-100 pt-10 lg:grid-cols-[1.2fr_.8fr]">
          <section>
            <h3 className="text-2xl font-black tracking-tight text-slate-950">Related tools for the next step</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">Continue the workflow without returning to search results.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {relatedTools.map((related) => (
                <Link key={related.id} href={toolPath(related.id)} className="group flex min-h-[72px] items-center gap-3 rounded-2xl border border-border bg-card p-2.5 text-sm font-black text-card-foreground transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-md">
                  <ToolArtwork toolId={related.id} toolName={related.name} className="h-10 w-10" />
                  <span className="min-w-0 flex-1 line-clamp-2">{related.name}</span><ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </section>
          <aside className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6">
            <h3 className="text-lg font-black text-slate-950">Helpful guides</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">Read practical guidance for common document tasks and safer workflows.</p>
            <div className="mt-5 space-y-3">
              {relatedGuides.map((guide) => <Link key={guide.href} href={guide.href} className="group flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-black text-card-foreground shadow-sm transition hover:text-blue-700"><span>{guide.title}</span><ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>)}
            </div>
          </aside>
        </div>

        <div className="relative mt-10 flex flex-wrap gap-3 border-t border-slate-100 pt-7">
          <Link href="/pdf-tools" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700">Browse PDF tools <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/security" className="rounded-2xl border border-border bg-card px-5 py-3 text-xs font-black text-card-foreground hover:bg-muted">Security and privacy</Link>
          <Link href="/discover/guides" className="rounded-2xl border border-border bg-card px-5 py-3 text-xs font-black text-card-foreground hover:bg-muted">Guide library</Link>
          <Link href="/contact" className="rounded-2xl border border-border bg-card px-5 py-3 text-xs font-black text-card-foreground hover:bg-muted">Report a problem</Link>
        </div>
      </div>
    </section>
  );
}
