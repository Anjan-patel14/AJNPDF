import type { ReactNode } from "react";
import { PrivacyBadge } from "./PrivacyBadge";

export function Workspace({
  toolId,
  title,
  description,
  children,
}: {
  toolId: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 pb-12 pt-24 md:px-6 md:pt-28">
      <header className="mx-auto mb-6 max-w-3xl">
        <h1 className="text-2xl font-black tracking-[-.035em] text-[#0e1b2c] dark:text-[#eef2f9] sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-[#475569] dark:text-[#b6c0d0]">{description}</p>
        <PrivacyBadge toolId={toolId} className="mt-3" />
      </header>
      <div className="rounded-[20px] border border-[#e3e9f4] bg-white p-4 shadow-[0_14px_44px_rgba(14,27,44,.07)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_20px_60px_rgba(0,0,0,.32)] sm:p-6">
        {children}
      </div>
    </section>
  );
}
