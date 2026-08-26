import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Crown } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { MainFooter } from "@/components/landing/main-footer";
import { RazorpayCheckout } from "@/components/billing/razorpay-checkout";
import { AJN_PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: { absolute: "AJN PDF Pricing - Free and Premium" },
  description: "Compare AJN PDF Free and Premium prepaid access.",
};

function configuredPrice(name: string, fallback: number) {
  const value = Number(process.env[name] || fallback);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

export default function PricingPage() {
  const monthlyInr = configuredPrice("NEXT_PUBLIC_AJN_PREMIUM_30D_INR", 49);
  const yearlyInr = configuredPrice("NEXT_PUBLIC_AJN_PREMIUM_365D_INR", 399);
  const billingEnabled = process.env.NEXT_PUBLIC_AJN_RAZORPAY_ENABLED === "true";

  return (
    <div className="ajn-page-shell min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-[108px] md:px-8 md:pt-[124px]">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#1a56db] dark:text-blue-300">Pricing</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-.045em] text-[#0e1b2c] dark:text-[#eef2f9] sm:text-4xl">
            Free for everyday PDF work. Premium when you need more comfort.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-6 text-[#475569] dark:text-[#b6c0d0]">
            Premium is prepaid access for 30 or 365 days. It does not renew automatically in this release.
          </p>
        </header>

        <section className="mt-9 grid gap-5 md:grid-cols-2">
          {AJN_PLANS.map((plan) => (
            <article key={plan.id} className={`ajn-v4-card ${plan.id === "premium" ? "ajn-card-blue" : ""} flex min-h-[390px] flex-col p-6`}>
              <div className="flex items-start justify-between gap-4">
                <span className={`flex h-12 w-12 items-center justify-center rounded-[14px] border ${plan.id === "premium" ? "ajn-icon-blue text-[#1a56db] dark:text-[#3b82f6]" : "border-[#e3e9f4] bg-[#f8fafc] text-[#475569] dark:border-white/10 dark:bg-[#151e2e] dark:text-[#b6c0d0]"}`}>
                  <Crown className="h-5 w-5" />
                </span>
                {plan.highlighted ? <span className="rounded-full bg-[#e1effe] px-3 py-1 text-[9px] font-black uppercase tracking-[.12em] text-[#1a56db] dark:bg-blue-400/10 dark:text-blue-300">Premium</span> : null}
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-[-.03em] text-[#0e1b2c] dark:text-[#eef2f9]">{plan.name}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[#475569] dark:text-[#b6c0d0]">{plan.summary}</p>
              {plan.id === "premium" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-xl border border-[#e3e9f4] bg-[#f8fafc] px-3 py-2 text-xs font-black text-[#0e1b2c] dark:border-white/10 dark:bg-[#151e2e] dark:text-[#eef2f9]">₹{monthlyInr} · 30 days</span>
                  <span className="rounded-xl border border-[#e3e9f4] bg-[#f8fafc] px-3 py-2 text-xs font-black text-[#0e1b2c] dark:border-white/10 dark:bg-[#151e2e] dark:text-[#eef2f9]">₹{yearlyInr} · 365 days</span>
                </div>
              ) : <p className="mt-4 text-3xl font-black text-[#0e1b2c] dark:text-[#eef2f9]">₹0</p>}
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-xs font-semibold leading-5 text-[#475569] dark:text-[#b6c0d0]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0e9f6e] dark:text-[#10b981]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-7">
                {plan.id === "free" ? (
                  <Link href="/pdf-tools" className="flex min-h-12 items-center justify-center rounded-xl border border-[#e3e9f4] bg-white px-4 text-xs font-black text-[#0e1b2c] transition hover:border-blue-200 hover:bg-[#e1effe] dark:border-white/10 dark:bg-[#151e2e] dark:text-[#eef2f9]">
                    Use Free tools
                  </Link>
                ) : billingEnabled ? (
                  <RazorpayCheckout monthlyInr={monthlyInr} yearlyInr={yearlyInr} />
                ) : (
                  <div className="rounded-xl border border-[#e3e9f4] bg-[#f8fafc] px-4 py-3 text-center text-[10px] font-black leading-4 text-[#64748b] dark:border-white/10 dark:bg-[#151e2e] dark:text-[#8b96ab]">
                    Premium purchases are temporarily unavailable.
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        <p className="mx-auto mt-6 max-w-3xl text-center text-[11px] font-semibold leading-5 text-[#64748b] dark:text-[#8b96ab]">
          Tool file-size limits come from the actual processor policy and are shown in the relevant workspace. AJN PDF does not advertise unsupported “unlimited” processing.
        </p>
      </main>
      <MainFooter />
    </div>
  );
}
