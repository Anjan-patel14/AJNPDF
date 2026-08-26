"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, CheckCircle2, Crown, Image as ImageIcon, Laptop, Smartphone } from "lucide-react";

const workCards = [
  {
    icon: Laptop,
    title: "Comfortable on desktop",
    text: "Use a larger workspace for longer PDF sessions, repeated edits and multi-step document tasks.",
    cta: "Open PDF tools",
    href: "/pdf-tools",
    tone: "blue",
    kind: "desktop",
  },
  {
    icon: Smartphone,
    title: "Ready on mobile",
    text: "Handle quick PDF tasks from your phone or tablet when you need to keep moving.",
    cta: "Browse tools",
    href: "/pdf-tools",
    tone: "green",
    kind: "mobile",
  },
  {
    icon: BriefcaseBusiness,
    title: "Useful for teams",
    text: "Give your team a simple, repeatable PDF workflow with account access and Premium options.",
    cta: "View Premium",
    href: "/pricing",
    tone: "red",
    kind: "business",
  },
] as const;

const premiumItems = [
  "Enjoy a cleaner signed-in experience with Premium features available in one place.",
  "Unlock more from your workflow when you work with PDFs regularly.",
  "Keep plan details, account access and upgrades simple to manage.",
] as const;

const confidenceItems = [
  "Focused PDF workflows",
  "Clear file-handling information",
  "Responsive desktop and mobile layouts",
  "Simple Premium access when needed",
] as const;

const toneClasses = {
  blue: {
    card: "ajn-card-blue",
    icon: "ajn-icon-blue text-[#1a56db] dark:text-[#3b82f6]",
  },
  green: {
    card: "ajn-card-green",
    icon: "ajn-icon-green text-[#0e9f6e] dark:text-[#10b981]",
  },
  red: {
    card: "ajn-card-red",
    icon: "ajn-icon-red text-[#d92d20] dark:text-[#ef4444]",
  },
} as const;

function DesktopVisual() {
  return (
    <div className="mt-5 rounded-[16px] border border-[#dfe7f3] bg-[#f8fafc] p-3 dark:border-white/10 dark:bg-[#0c1220]">
      <div className="rounded-[14px] border border-[#dfe7f3] bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#111827]">
        <div className="mb-2 flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d92d20]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#0e9f6e]/80" />
        </div>
        <div className="grid grid-cols-[90px_1fr] gap-3">
          <div className="rounded-xl bg-[#e1effe] p-2 dark:bg-blue-400/10">
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-white/70 dark:bg-white/15" />
              <div className="h-2 rounded-full bg-white/70 dark:bg-white/15" />
              <div className="h-2 w-2/3 rounded-full bg-white/70 dark:bg-white/15" />
            </div>
          </div>
          <div className="rounded-xl border border-[#e3e9f4] p-2 dark:border-white/10">
            <div className="mb-2 h-3 w-24 rounded-full bg-[#e1effe] dark:bg-blue-400/10" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-14 rounded-lg bg-[#def7ec] dark:bg-emerald-400/10" />
              <div className="h-14 rounded-lg bg-[#fef3f2] dark:bg-red-400/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileVisual() {
  return (
    <div className="mt-5 flex justify-center">
      <div className="w-[190px] rounded-[26px] border border-[#dfe7f3] bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#111827]">
        <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-[#dfe7f3] dark:bg-white/10" />
        <div className="rounded-[20px] border border-[#dfe7f3] bg-[#f8fafc] p-3 dark:border-white/10 dark:bg-[#0c1220]">
          <div className="mb-3 h-4 w-24 rounded-full bg-[#e1effe] dark:bg-blue-400/10" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-14 rounded-xl bg-[#e1effe] dark:bg-blue-400/10" />
            <div className="h-14 rounded-xl bg-[#def7ec] dark:bg-emerald-400/10" />
            <div className="h-14 rounded-xl bg-[#fef3f2] dark:bg-red-400/10" />
            <div className="h-14 rounded-xl bg-[#fff7df] dark:bg-amber-400/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessVisual() {
  return (
    <div className="mt-5 rounded-[16px] border border-[#dfe7f3] bg-[#f8fafc] p-3 dark:border-white/10 dark:bg-[#0c1220]">
      <div className="grid gap-2">
        <div className="rounded-xl border border-[#e3e9f4] bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
          <div className="mb-2 h-3 w-28 rounded-full bg-[#e1effe] dark:bg-blue-400/10" />
          <div className="grid grid-cols-[1fr_62px] gap-2">
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-[#edf2f7] dark:bg-white/10" />
              <div className="h-2 rounded-full bg-[#edf2f7] dark:bg-white/10" />
              <div className="h-2 w-3/4 rounded-full bg-[#edf2f7] dark:bg-white/10" />
            </div>
            <div className="rounded-lg bg-[#def7ec] dark:bg-emerald-400/10" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-14 rounded-xl bg-[#e1effe] dark:bg-blue-400/10" />
          <div className="h-14 rounded-xl bg-[#fef3f2] dark:bg-red-400/10" />
          <div className="h-14 rounded-xl bg-[#def7ec] dark:bg-emerald-400/10" />
        </div>
      </div>
    </div>
  );
}

function CardVisual({ kind }: { kind: "desktop" | "mobile" | "business" }) {
  if (kind === "mobile") return <MobileVisual />;
  if (kind === "business") return <BusinessVisual />;
  return <DesktopVisual />;
}

export default function ExpansionSections() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#1a56db] dark:text-blue-300">
            Work your way
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#0e1b2c] dark:text-[#eef2f9] sm:text-3xl">
            Choose the setup that fits your day.
          </h2>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {workCards.map(({ icon: Icon, title, text, cta, href, tone, kind }) => {
            const classes = toneClasses[tone];
            return (
              <article key={title} className={`ajn-v4-card ${classes.card} flex h-full flex-col p-6`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border ${classes.icon}`}>
                    <Icon className="h-5 w-5" />
                  </span>

                  <Link
                    href={href}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-[#1a56db] transition hover:gap-1.5 dark:text-[#3b82f6]"
                  >
                    {cta}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <h3 className="mt-5 text-base font-black tracking-[-.02em] text-[#0e1b2c] dark:text-[#eef2f9]">
                  {title}
                </h3>

                <p className="mt-2 text-xs font-medium leading-5 text-[#5b6b80] dark:text-[#8b96ab]">
                  {text}
                </p>

                <CardVisual kind={kind} />
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-6">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <article className="ajn-v4-card ajn-card-blue p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border ajn-icon-blue text-[#1a56db] dark:text-[#3b82f6]">
                <Crown className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#1a56db] dark:text-blue-300">
                  Premium
                </p>
                <h2 className="mt-1 text-xl font-black tracking-[-.03em] text-[#0e1b2c] dark:text-[#eef2f9]">
                  Get more with Premium
                </h2>
              </div>
            </div>

            <ul className="mt-5 space-y-3">
              {premiumItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-medium leading-6 text-[#5b6b80] dark:text-[#8b96ab]">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e1effe] text-[#1a56db] dark:bg-blue-400/10 dark:text-blue-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/pricing"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1a56db] px-5 text-xs font-black text-white transition hover:bg-[#123fa8]"
            >
              View Premium
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="ajn-v4-card ajn-card-green p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border ajn-icon-green text-[#0e9f6e] dark:text-[#10b981]">
                <ImageIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#0e9f6e] dark:text-[#10b981]">
                  AJN Buzz
                </p>
                <h2 className="mt-1 text-xl font-black tracking-[-.03em] text-[#0e1b2c] dark:text-[#eef2f9]">
                  Need image tools too?
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm font-medium leading-6 text-[#5b6b80] dark:text-[#8b96ab]">
              Open AJN Buzz for image-focused work such as compression, resize and quick editing in a separate workspace.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="h-20 rounded-2xl bg-[#e1effe] dark:bg-blue-400/10" />
              <div className="h-20 rounded-2xl bg-[#def7ec] dark:bg-emerald-400/10" />
              <div className="h-20 rounded-2xl bg-[#fef3f2] dark:bg-red-400/10" />
            </div>

            <a
              href="https://ajn.buzz"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#0e9f6e] px-5 text-xs font-black text-[#0e9f6e] transition hover:bg-[#def7ec] dark:border-[#10b981] dark:text-[#10b981] dark:hover:bg-emerald-400/10"
            >
              Open AJN Buzz
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <div className="rounded-[20px] border border-[#e3e9f4] bg-white/90 p-6 shadow-[0_14px_44px_rgba(14,27,44,.055)] dark:border-white/10 dark:bg-[#111827]/90 dark:shadow-[0_20px_60px_rgba(0,0,0,.28)]">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#1a56db] dark:text-blue-300">
              Built for daily PDF work
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#0e1b2c] dark:text-[#eef2f9] sm:text-3xl">
              Simple to use. Easy to review.
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm font-medium leading-6 text-[#5b6b80] dark:text-[#8b96ab]">
              AJN PDF is designed to keep document work straightforward while making key product information easy to find.
            </p>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {confidenceItems.map((item) => (
              <div
                key={item}
                className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-[#e3e9f4] bg-[#f8fafc] px-4 py-3 dark:border-white/10 dark:bg-[#0c1220]"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e1effe] text-[#1a56db] dark:bg-blue-400/10 dark:text-blue-300">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="text-sm font-black text-[#0e1b2c] dark:text-[#eef2f9]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
