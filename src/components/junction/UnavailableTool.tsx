'use client';

import Link from 'next/link';
import { ArrowRight, EyeOff } from 'lucide-react';

export default function UnavailableTool() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-24">
      <section className="max-w-xl rounded-[2rem] border border-border bg-card text-card-foreground p-8 text-center shadow-[0_28px_80px_rgba(15,23,42,.12)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><EyeOff className="h-6 w-6" /></span>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-foreground">This tool is not public yet.</h1>
        <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground">Its output or product claim has not passed AJN PDF production validation. Use the working public directory instead.</p>
        <Link href="/pdf-tools" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white">Open public tools <ArrowRight className="h-4 w-4" /></Link>
      </section>
    </main>
  );
}
