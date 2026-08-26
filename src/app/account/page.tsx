"use client";

import Link from "next/link";
import { Crown, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { MainFooter } from "@/components/landing/main-footer";
import { useAuth } from "@/lib/auth-context";

export default function AccountPage() {
  const auth = useAuth();
  const premium = auth.plan !== "free";
  const premiumUntil = premium && auth.planValidUntil ? new Date(auth.planValidUntil).toLocaleDateString() : "";

  if (auth.loading) {
    return <div className="ajn-page-shell min-h-screen"><Navbar/><main className="mx-auto max-w-5xl px-4 pt-[120px]"><div className="ajn-route-skeleton h-44 rounded-[20px] bg-[#e3e9f4] dark:bg-white/10"/></main></div>;
  }

  if (!auth.session) {
    return (
      <div className="ajn-page-shell min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-xl px-4 pb-20 pt-[120px]">
          <div className="ajn-v4-card ajn-card-blue p-7 text-center">
            <UserRound className="mx-auto h-9 w-9 text-[#1a56db] dark:text-[#3b82f6]" />
            <h1 className="mt-4 text-2xl font-black text-[#0e1b2c] dark:text-[#eef2f9]">Sign in to your AJN PDF account</h1>
            <p className="mt-3 text-sm font-medium leading-6 text-[#475569] dark:text-[#b6c0d0]">Core PDF tools remain available without an account. Sign in to view and manage Premium access.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/login" className="rounded-xl bg-[#1a56db] px-5 py-3 text-xs font-black text-white">Sign in</Link>
              <Link href="/signup" className="rounded-xl border border-[#e3e9f4] px-5 py-3 text-xs font-black text-[#0e1b2c] dark:border-white/10 dark:text-[#eef2f9]">Create account</Link>
            </div>
          </div>
        </main>
        <MainFooter />
      </div>
    );
  }

  return (
    <div className="ajn-page-shell min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-[112px] md:px-8 md:pt-[128px]">
        <header>
          <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#1a56db] dark:text-blue-300">Account</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#0e1b2c] dark:text-[#eef2f9]">{auth.session.displayName || auth.session.email}</h1>
          <p className="mt-1 text-sm font-medium text-[#64748b] dark:text-[#8b96ab]">{auth.session.email}</p>
        </header>

        <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="ajn-v4-card ajn-card-blue p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.13em] text-[#64748b] dark:text-[#8b96ab]">Current plan</p>
                <h2 className="mt-2 text-2xl font-black text-[#0e1b2c] dark:text-[#eef2f9]">{premium ? "Premium" : "Free"}</h2>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#475569] dark:text-[#b6c0d0]">
                  {premium ? (premiumUntil ? `Active until ${premiumUntil}. No automatic renewal.` : "Premium entitlement is active.") : "Core PDF tools with standard limits. Ads may appear."}
                </p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black ${premium ? "bg-[#e1effe] text-[#1a56db] dark:bg-blue-400/10 dark:text-blue-300" : "bg-[#f8fafc] text-[#64748b] dark:bg-[#151e2e] dark:text-[#b6c0d0]"}`}>
                <Crown className="h-3.5 w-3.5" />
                {premium ? "PREMIUM" : "FREE"}
              </span>
            </div>

            <div className="mt-6 border-t border-[#e3e9f4] pt-5 dark:border-white/10">
              <h3 className="text-sm font-black text-[#0e1b2c] dark:text-[#eef2f9]">Plan benefits</h3>
              <ul className="mt-3 space-y-2 text-xs font-semibold leading-5 text-[#475569] dark:text-[#b6c0d0]">
                <li>• {premium ? "Ad-free experience while signed in" : "20 public PDF tools"}</li>
                <li>• Plan state stays attached to this signed-in account</li>
                <li>• Tool limits remain based on each processor's real capability</li>
              </ul>
            </div>

            <Link href="/pricing" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1a56db] px-5 text-xs font-black text-white">
              {premium ? "Extend Premium" : "View Premium"}
            </Link>
          </section>

          <aside className="space-y-4">
            <div className="ajn-v4-card ajn-card-green p-5">
              <ShieldCheck className="h-5 w-5 text-[#0e9f6e] dark:text-[#10b981]" />
              <h2 className="mt-3 text-sm font-black text-[#0e1b2c] dark:text-[#eef2f9]">Account privacy</h2>
              <p className="mt-2 text-xs font-medium leading-5 text-[#475569] dark:text-[#b6c0d0]">Your account stores identity and plan-entitlement data. PDF file contents are not added to your account profile by default.</p>
            </div>
            {auth.claims.admin === true ? <Link href="/admin" className="block rounded-2xl border border-[#e3e9f4] bg-white p-4 text-xs font-black text-[#0e1b2c] dark:border-white/10 dark:bg-[#111827] dark:text-[#eef2f9]">Admin analytics</Link> : null}
            <button onClick={auth.signOut} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e3e9f4] bg-white text-xs font-black text-[#475569] transition hover:bg-[#f8fafc] dark:border-white/10 dark:bg-[#111827] dark:text-[#b6c0d0] dark:hover:bg-[#151e2e]">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </aside>
        </div>
      </main>
      <MainFooter />
    </div>
  );
}
