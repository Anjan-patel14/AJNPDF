"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type BillingPlanId = "premium_30d" | "premium_365d";
type BillingOrder = { key_id:string; order_id:string; amount:number; currency:string; plan:BillingPlanId; label:string };
type CheckoutResult = { razorpay_order_id:string; razorpay_payment_id:string; razorpay_signature:string };

declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open(): void }; } }

function loadCheckoutScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>('script[data-ajn-razorpay="checkout"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once:true });
      existing.addEventListener("error", () => reject(new Error("Secure checkout could not load.")), { once:true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.ajnRazorpay = "checkout";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Secure checkout could not load."));
    document.head.appendChild(script);
  });
}

async function jsonResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(payload?.error || payload?.detail || "Billing request failed."));
  return payload;
}

export function RazorpayCheckout({ monthlyInr, yearlyInr }: { monthlyInr:number; yearlyInr:number }) {
  const auth = useAuth();
  const [loading,setLoading] = useState<BillingPlanId|null>(null);
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");

  const buy = async (plan: BillingPlanId) => {
    setError(""); setSuccess(""); setLoading(plan);
    try {
      const token = await auth.getIdToken();
      if (!token) throw new Error("Sign in to purchase AJN PDF Premium.");
      const order = await jsonResponse(await fetch("/api/billing/order", {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body:JSON.stringify({ plan }),
      })) as BillingOrder;

      await loadCheckoutScript();
      if (!window.Razorpay) throw new Error("Secure checkout is unavailable.");

      await new Promise<void>((resolve,reject) => {
        const checkout = new window.Razorpay!({
          key:order.key_id, amount:order.amount, currency:order.currency,
          name:"AJN PDF", description:order.label, order_id:order.order_id,
          prefill:{ email:auth.session?.email || "" }, notes:{ product:"AJN PDF" },
          retry:{ enabled:true }, timeout:600,
          handler:async(result:CheckoutResult) => {
            try {
              const currentToken = await auth.getIdToken();
              if (!currentToken) throw new Error("Your session expired. Sign in again to verify the payment.");
              const verified = await jsonResponse(await fetch("/api/billing/verify", {
                method:"POST",
                headers:{ "Content-Type":"application/json", Authorization:`Bearer ${currentToken}` },
                body:JSON.stringify(result),
              }));
              await auth.refreshPlan();
              setSuccess(`Premium activated${verified?.valid_until ? ` until ${new Date(verified.valid_until).toLocaleDateString()}` : ""}.`);
              resolve();
            } catch(reason) { reject(reason); }
          },
          modal:{ ondismiss:() => reject(new Error("Checkout closed before completion.")) },
          theme:{ color:"#1a56db" },
        });
        checkout.open();
      });
    } catch(reason) {
      setError(reason instanceof Error ? reason.message : "Payment could not be completed.");
    } finally { setLoading(null); }
  };

  if (!auth.session) return (
    <div className="rounded-2xl border border-[#e3e9f4] bg-[#f8fafc] p-4 dark:border-white/10 dark:bg-[#151e2e]">
      <p className="text-xs font-bold leading-5 text-[#475569] dark:text-[#b6c0d0]">Sign in before purchasing Premium so access is attached to your account.</p>
      <Link href="/login" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#1a56db] px-4 text-xs font-black text-white">Sign in to continue</Link>
    </div>
  );

  return <div className="space-y-3">
    {([
      ["premium_30d","Premium · 30 days",monthlyInr],
      ["premium_365d","Premium · 365 days",yearlyInr],
    ] as const).map(([plan,label,amount],index) => (
      <button key={plan} type="button" disabled={Boolean(loading)||amount<=0} onClick={()=>void buy(plan)}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-4 text-left text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${index===1 ? "bg-[#1a56db] text-white hover:bg-[#123fa8]" : "border border-[#e3e9f4] bg-white text-[#0e1b2c] hover:border-blue-200 hover:bg-[#e1effe] dark:border-white/10 dark:bg-[#151e2e] dark:text-[#eef2f9]"}`}>
        <span>{label}</span><span className="ml-auto">{`₹${amount.toLocaleString("en-IN")}`}</span>
        {loading===plan ? <Loader2 className="h-4 w-4 animate-spin"/> : null}
      </button>
    ))}
    <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold leading-4 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0"/>Payment is verified server-side before Premium access is activated.
    </div>
    {success ? <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"><CheckCircle2 className="h-4 w-4"/>{success}</p> : null}
    {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">{error}</p> : null}
  </div>;
}
