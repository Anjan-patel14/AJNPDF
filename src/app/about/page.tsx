import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Eye, FileText, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { MainFooter } from '@/components/landing/main-footer';
import { BUILD_PUBLIC_TOOLS } from '@/lib/build-public-tools';
import { AJN_BRAND } from '@/lib/brand';
import { CapabilitySummary } from '@/components/about/capability-summary';
import { ProcessingModelOverview } from '@/components/trust/processing-model-card';

const principles = [
  {
    icon: Eye,
    title: 'Clear file handling',
    text: 'Each tool explains the workflow, supported inputs and result steps without cluttering the workspace.',
    tone: 'blue',
  },
  {
    icon: FileText,
    title: 'Focused tool directory',
    text: 'The public directory prioritizes workflows that are ready to use, easy to find and clear about their current capabilities.',
    tone: 'red',
  },
  {
    icon: ShieldCheck,
    title: 'Responsible security workflows',
    text: 'Protection and unlocking workflows use the configured PDF security engine. Unlocking requires the current password and user authorization.',
    tone: 'green',
  }];

export default function AboutPage() {
  const toolCount = BUILD_PUBLIC_TOOLS.length;
  return (
    <div className="ajn-page-shell">
      <Navbar />
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-32 md:px-8 md:pt-40">
        <section className="grid items-center gap-12 lg:grid-cols-[1fr_.9fr]">
          <div>
            <span className="ajn-section-kicker">About AJN PDF</span>
            <h1 className="mt-6 text-5xl font-black tracking-[-.05em] text-foreground md:text-7xl">
              A practical document toolkit built around clarity.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-muted-foreground">
              AJN PDF brings PDF, document and image workflows into one focused web workspace designed for fast everyday file tasks.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/pdf-tools" className="ajn-primary-button">
                Explore public tools <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/transparency" className="ajn-secondary-button">
                File handling details
              </Link>
            </div>
          </div>

          <div className="relative rounded-[2.2rem] border border-border bg-card p-7 text-card-foreground shadow-[0_35px_90px_rgba(15,23,42,.12)]">
            <CapabilitySummary toolCount={toolCount} />
          </div>
        </section>

        <ProcessingModelOverview />

        <section className="mt-24">
          <div className="max-w-3xl">
            <span className="ajn-section-kicker">Product principles</span>
            <h2 className="mt-5 text-4xl font-black tracking-[-.04em] text-foreground md:text-6xl">
              Built around clarity, useful workflows and dependable results.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {principles.map(({ icon: Icon, title, text, tone }) => (
              <article key={title} className="ajn-glass-card rounded-3xl p-7">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  tone === 'red'
                    ? 'bg-red-50 text-red-600'
                    : tone === 'green'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-blue-50 text-blue-600'
                }`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-6 text-xl font-black text-foreground">{title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-24 rounded-[2rem] border border-blue-100 bg-blue-50/55 p-7 md:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <span className="ajn-section-kicker">AJN Discover guides</span>
              <h2 className="mt-5 text-3xl font-black tracking-[-.04em] text-foreground md:text-5xl">
                Practical guides for the workflows people use most.
              </h2>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-muted-foreground">
                Browse a curated guide library for PDF basics, document conversion and image workflows, security, limits and troubleshooting.
              </p>
            </div>
            <Link href="/discover/guides" className="ajn-primary-button">
              Open guide library <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="ajn-theme-surface mt-24 overflow-hidden rounded-[2rem] p-7 md:p-10">
          <div className="grid items-center gap-8 md:grid-cols-[220px_1fr]">
            <Image
              src={AJN_BRAND.developerImageThumb}
              alt="Anjan Kumar, developer of AJN PDF"
              width={480}
              height={480}
              className="aspect-square w-full rounded-3xl object-cover"
            />
            <div>
              <span className="ajn-section-kicker">Developer</span>
              <h2 className="mt-5 text-3xl font-black tracking-[-.04em] text-foreground md:text-5xl">
                Built by Anjan Kumar under AJN Studio.
              </h2>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-muted-foreground">
                {AJN_BRAND.developerBio}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/developer" className="ajn-primary-button">
                  Developer profile <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/discover" className="ajn-secondary-button">AJN Discover</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <MainFooter />
    </div>
  );
}
