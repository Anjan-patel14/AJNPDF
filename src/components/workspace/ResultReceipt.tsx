export type ReceiptItem = { label: string; value: string; emphasis?: boolean };

export function ResultReceipt({ items, note }: { items: ReceiptItem[]; note?: string }) {
  return (
    <div className="ajn-result-receipt">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#64748b] dark:text-[#8b96ab]">{item.label}</p>
            <p className={`mt-1 text-sm font-black ${item.emphasis ? "text-[#1a56db] dark:text-[#3b82f6]" : "text-[#0e1b2c] dark:text-[#eef2f9]"}`}>{item.value}</p>
          </div>
        ))}
      </div>
      {note ? <p className="mt-3 text-[11px] font-semibold leading-5 text-[#475569] dark:text-[#b6c0d0]">{note}</p> : null}
    </div>
  );
}
