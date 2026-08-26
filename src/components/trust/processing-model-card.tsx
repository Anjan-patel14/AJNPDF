import Link from 'next/link';
import { ArrowRight, Gauge, HardDrive, Monitor, Server } from 'lucide-react';
import { PROCESSING_DISCLOSURE, TRUST_DESTINATIONS } from '@/lib/processing-disclosure';

const cards = [
  {
    icon: Monitor,
    title: PROCESSING_DISCLOSURE.browserTitle,
    text: PROCESSING_DISCLOSURE.browser,
    className: 'border-blue-100 bg-blue-50/60 text-blue-700',
  },
  {
    icon: Server,
    title: PROCESSING_DISCLOSURE.serverTitle,
    text: PROCESSING_DISCLOSURE.server,
    className: 'border-violet-100 bg-violet-50/60 text-violet-700',
  },
  {
    icon: HardDrive,
    title: PROCESSING_DISCLOSURE.storageTitle,
    text: PROCESSING_DISCLOSURE.storage,
    className: 'border-emerald-100 bg-emerald-50/60 text-emerald-700',
  },
  {
    icon: Gauge,
    title: PROCESSING_DISCLOSURE.limitsTitle,
    text: PROCESSING_DISCLOSURE.limits,
    className: 'border-amber-100 bg-amber-50/60 text-amber-700',
  }] as const;

export function ProcessingModelOverview() {
  return (
    <section className="mt-24" aria-labelledby="processing-model-heading">
      <div className="max-w-4xl">
        <span className="ajn-section-kicker">Processing model</span>
        <h2 id="processing-model-heading" className="mt-5 text-4xl font-black tracking-[-.04em] text-foreground md:text-6xl">
          Local when it can be. Online when the workflow needs it.
        </h2>
        <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-muted-foreground">
          {PROCESSING_DISCLOSURE.summary}
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {cards.map(({ icon: Icon, title, text, className }) => (
          <article key={title} className={`rounded-3xl border p-6 ${className}`}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 shadow-sm">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-700">{text}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {TRUST_DESTINATIONS.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={index === 0 ? 'ajn-primary-button' : 'ajn-secondary-button'}
          >
            {item.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ))}
      </div>
    </section>
  );
}
