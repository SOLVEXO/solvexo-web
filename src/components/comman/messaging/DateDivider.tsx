export function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-[14px]">
      <span className="px-[12px] py-[4px] rounded-full bg-white border border-[#EEECE4] text-[11px] font-medium text-slate shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {label}
      </span>
    </div>
  );
}
