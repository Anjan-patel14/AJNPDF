"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Download, Settings2, UploadCloud } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Select a PDF",
    text: "Upload or drag in your PDF.",
    icon: UploadCloud,
    tone: "blue",
  },
  {
    number: "02",
    title: "Choose your options",
    text: "Set the controls you need.",
    icon: Settings2,
    tone: "green",
  },
  {
    number: "03",
    title: "Download the result",
    text: "Save the processed PDF.",
    icon: Download,
    tone: "red",
  },
] as const;

const toneClasses = {
  blue: {
    icon: "ajn-icon-blue text-[#1a56db] dark:text-[#3b82f6]",
    num: "ajn-step-num-blue",
  },
  green: {
    icon: "ajn-icon-green text-[#0e9f6e] dark:text-[#10b981]",
    num: "ajn-step-num-green",
  },
  red: {
    icon: "ajn-icon-red text-[#d92d20] dark:text-[#ef4444]",
    num: "ajn-step-num-red",
  },
} as const;

export function HowItWorks() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-18">
      <div className="text-center">
        <span className="ajn-section-kicker">How it works</span>
        <h2 className="mt-3 text-2xl font-black tracking-[-.035em] text-[#0e1b2c] dark:text-[#eef2f9] sm:text-3xl">
          Three steps. Done.
        </h2>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-3">
        {steps.map(({ icon: Icon, number, title, text, tone }, index) => {
          const classes = toneClasses[tone];

          return (
            <motion.article
              key={number}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: reduceMotion ? 0 : 0.46, delay: reduceMotion ? 0 : index * 0.06 }}
              className="ajn-v4-step-card p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <span className={`flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border ${classes.icon}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`ajn-step-num ${classes.num}`}>{number}</span>
              </div>

              <h3 className="mt-6 text-base font-black tracking-[-.02em] text-[#0e1b2c] dark:text-[#eef2f9]">
                {title}
              </h3>
              <p className="mt-2 text-xs font-medium leading-5 text-[#5b6b80] dark:text-[#8b96ab]">
                {text}
              </p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
