import Link from 'next/link';
import { ArrowLeft, FileSearch, Home, Search } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { BUILD_PUBLIC_TOOLS } from '@/lib/build-public-tools';
import { ToolArtwork } from '@/components/ajn/tool-artwork';
import { toolPath } from '@/lib/tool-routes';

export default function NotFoundPage() {
  const suggestions = BUILD_PUBLIC_TOOLS.slice(0, 6);
  return (
    <div className="ajn-page-shell">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-32 text-center md:px-8 md:pt-40">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-[0_18px_42px_rgba(37,99,235,.24)]"><FileSearch className="h-7 w-7" /></div>
        <p className="mt-7 text-xs font-black uppercase tracking-[.18em] text-blue-600">404 · Page not found</p>
        <h1 className="mt-4 text-[clamp(2.6rem,7vw,5.6rem)] font-black leading-[.95] tracking-[-.055em] text-foreground">That AJN PDF page is unavailable.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-muted-foreground">The link may be outdated, mistyped or connected to a tool that is not available in this production build.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="ajn-primary-button"><Home className="h-4 w-4" />Return home</Link>
          <Link href="/pdf-tools" className="ajn-secondary-button"><Search className="h-4 w-4" />Browse available tools</Link>
        </div>

        {suggestions.length > 0 && (
          <section className="mt-16 text-left">
            <h2 className="text-xl font-black text-foreground">Available tools</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((tool) => (
                <Link key={tool.id} href={toolPath(tool.id)} className="ajn-tool-card ajn-horizontal-tool-card group flex min-h-[84px] items-center gap-3 p-3 text-card-foreground">
                  <ToolArtwork toolId={tool.id} toolName={tool.name} className="h-11 w-11" />
                  <div className="min-w-0 flex-1"><span className="ajn-card-brand-badge">AJN</span><h3 className="mt-2 line-clamp-1 font-black">{tool.name}</h3><p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-muted-foreground">{tool.desc}</p></div>
                </Link>
              ))}
            </div>
          </section>
        )}
        <Link href="/contact" className="mt-10 inline-flex items-center gap-2 text-xs font-black text-blue-600"><ArrowLeft className="h-4 w-4" />Report a broken link</Link>
      </main>
      <MainFooter />
    </div>
  );
}
