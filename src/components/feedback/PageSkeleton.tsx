export function PageSkeleton() {
  return (
    <main className="ajn-page-shell min-h-screen px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="ajn-route-skeleton h-8 w-56 rounded-xl bg-[#e3e9f4] dark:bg-white/10" />
        <div className="ajn-route-skeleton mt-3 h-4 w-full max-w-xl rounded-lg bg-[#eef2f9] dark:bg-white/10" />
        <div className="ajn-route-skeleton mt-8 h-[330px] rounded-[20px] border border-[#e3e9f4] bg-white dark:border-white/10 dark:bg-[#111827]" />
      </div>
    </main>
  );
}
