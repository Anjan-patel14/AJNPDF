"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { LogoAnimation } from "@/components/landing/logo-animation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.loading && auth.session) router.replace("/admin");
  }, [auth.loading, auth.session, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await auth.signIn(email.trim(), password);
      router.replace("/admin");
      router.refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError("");
    setBusy(true);
    try {
      await auth.signInWithGoogle();
      router.replace("/admin");
      router.refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Unable to sign in with Google.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f9fd] px-4 py-12 dark:bg-[#070b14]">
      <section className="w-full max-w-md rounded-[24px] border border-[#e3e9f4] bg-white p-6 shadow-[0_20px_60px_rgba(14,27,44,.08)] dark:border-white/10 dark:bg-[#111827] sm:p-8">
        <div className="flex justify-center"><LogoAnimation className="h-11 w-[158px]" /></div>
        <div className="mt-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#1a56db] dark:text-blue-300">Restricted</p>
          <h1 className="mt-2 text-2xl font-black text-[#0e1b2c] dark:text-white">Admin sign in</h1>
          <p className="mt-2 text-sm text-[#64748b] dark:text-[#94a3b8]">Authorized AJN PDF administrators only.</p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input id="admin-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:bg-red-400/10 dark:text-red-300">{error}</p>}
          <Button type="submit" disabled={busy || auth.loading} className="w-full">
            <LogIn className="mr-2 h-4 w-4" /> {busy ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e3e9f4] dark:bg-white/10" />
          <span className="text-[10px] font-black uppercase tracking-[.14em] text-[#94a3b8]">or</span>
          <span className="h-px flex-1 bg-[#e3e9f4] dark:bg-white/10" />
        </div>

        <Button type="button" variant="outline" disabled={busy || auth.loading} onClick={google} className="w-full">
          Continue with Google
        </Button>
      </section>
    </main>
  );
}
