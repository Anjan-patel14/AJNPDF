"use client";

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Chrome, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type BusyAction = 'email' | 'google' | '';

export function AuthPanel({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busyAction, setBusyAction] = useState<BusyAction>('');
  const [message, setMessage] = useState('');
  const busy = Boolean(busyAction);

  async function complete(action: BusyAction, task: () => Promise<void>) {
    setBusyAction(action);
    setMessage('');
    try {
      await task();
      router.push('/account');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setBusyAction('');
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await complete('email', async () => {
      if (mode === 'login') await auth.signIn(email, password);
      else await auth.signUp(email, password);
    });
  }

  if (!auth.configured) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-950">Firebase Authentication is not configured on this deployment yet. Configure the AJN PDF Firebase web app to enable Google and email sign-in.</div>;
  }

  return <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_24px_65px_rgba(15,23,42,.08)] sm:p-7">
    <button type="button" disabled={busy} onClick={() => complete('google', auth.signInWithGoogle)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-800 transition hover:border-violet-200 hover:bg-violet-50/40 disabled:opacity-50">{busyAction === 'google' ? <Loader2 className="h-4 w-4 animate-spin"/> : <Chrome className="h-4 w-4"/>}<span>Continue with Google</span></button>
    <p className="mt-3 text-center text-[11px] font-semibold leading-5 text-slate-500">Secure Firebase account sign-in. Anonymous and guest accounts are disabled.</p>
    <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200"/><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">or email / Gmail</span><span className="h-px flex-1 bg-slate-200"/></div>
    <form onSubmit={submit} className="space-y-4">
      <label className="block"><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email address</span><span className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3"><Mail className="h-4 w-4 text-slate-400"/><input required type="email" autoComplete="email" inputMode="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@gmail.com" className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"/></span></label>
      <label className="block"><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Password</span><span className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3"><LockKeyhole className="h-4 w-4 text-slate-400"/><input required minLength={6} type="password" autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none"/></span></label>
      {message ? <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-700">{message}</p> : null}
      <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-xs font-black text-white shadow-lg shadow-violet-100 transition hover:bg-violet-800 disabled:opacity-50">{busyAction==='email'?<Loader2 className="h-4 w-4 animate-spin"/>:null}{mode==='login'?'Sign in with email':'Create account with email'}</button>
    </form>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-500">
      {mode==='login'?<><Link href="/forgot-password" className="font-black text-violet-700 hover:underline">Forgot password?</Link><span>New here? <Link href="/signup" className="font-black text-violet-700 hover:underline">Create account</Link></span></>:<span>Already have an account? <Link href="/login" className="font-black text-violet-700 hover:underline">Sign in</Link></span>}
    </div>
  </div>;
}
