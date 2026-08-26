import { SearchX } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-[20px] border border-[#e3e9f4] bg-white p-8 text-center dark:border-white/10 dark:bg-[#111827]">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#e1effe] text-[#1a56db] dark:bg-blue-400/10 dark:text-blue-300">
        <SearchX className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-black text-[#0e1b2c] dark:text-[#eef2f9]">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-xs font-semibold leading-5 text-[#64748b] dark:text-[#8b96ab]">{description}</p> : null}
    </div>
  );
}
