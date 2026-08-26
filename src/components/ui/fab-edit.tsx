"use client";

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { PenTool } from 'lucide-react';

export function FABEdit() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      className="fixed bottom-6 right-6 z-[80]"
    >
      <Link
        href="/add-text"
        aria-label="Open Add Text to PDF"
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_18px_40px_rgba(37,99,235,.32)] transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
      >
        <span className="pointer-events-none absolute -inset-3 -z-10 rounded-[1.4rem] bg-blue-500/20 blur-xl transition group-hover:bg-blue-500/30" />
        <PenTool className="h-5 w-5" />
        <span className="pointer-events-none absolute right-16 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-extrabold text-white shadow-xl group-hover:block">Add text to PDF</span>
      </Link>
    </motion.div>
  );
}
