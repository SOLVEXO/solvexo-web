import { clsx } from 'clsx';
import { Tag } from 'lucide-react';
import type { PosDiscountType, AppliedDiscount, PosView } from '../../pos.types';

interface DiscountPanelProps {
  discountType:    PosDiscountType;
  setDiscountType: (t: PosDiscountType) => void;
  discountVal:     string;
  setDiscountVal:  (v: string) => void;
  appliedDiscount: AppliedDiscount | null;
  applyDiscount:   () => void;
  removeDiscount:  () => void;
  setPosView:      (v: PosView) => void;
}

const DISCOUNT_TABS: { id: PosDiscountType; label: string }[] = [
  { id: 'pct',   label: '% Off' },
  { id: 'fixed', label: '$ Off' },
];

const QUICK_PRESETS: Record<PosDiscountType, number[]> = {
  pct:   [5, 10, 15, 20],
  fixed: [5, 10, 15, 25],
};

export function DiscountPanel({
  discountType, setDiscountType,
  discountVal, setDiscountVal,
  appliedDiscount, applyDiscount, removeDiscount,
  setPosView,
}: DiscountPanelProps) {
  return (
    <div className="px-5 py-[18px] border-b border-pos-border bg-pos-surface-3">
      <div className="flex items-center gap-[10px] mb-[14px]">
        <div className="w-9 h-9 rounded-xl bg-warning/15 border border-warning/30 flex items-center justify-center shrink-0">
          <Tag size={16} className="text-warning" />
        </div>
        <p className="text-[13.5px] font-bold text-white">Apply Discount</p>
      </div>

      {/* Type selector */}
      <div className="flex gap-[8px] mb-3">
        {DISCOUNT_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setDiscountType(id)}
            className={clsx(
              'flex-1 h-11 text-center rounded-xl text-[12.5px] font-semibold cursor-pointer border-2',
              'transition-all duration-150 active:scale-95',
              discountType === id
                ? 'bg-warning/15 border-warning/50 text-warning'
                : 'bg-pos-surface border-pos-border text-pos-faint hover:border-pos-border-strong',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Quick presets — same setDiscountVal + applyDiscount the manual entry uses */}
      <div className="flex gap-[6px] mb-3">
        {QUICK_PRESETS[discountType].map(v => (
          <button
            key={v}
            onClick={() => { setDiscountVal(String(v)); }}
            className={clsx(
              'flex-1 h-9 rounded-lg text-[11.5px] font-semibold cursor-pointer border transition-all duration-150 active:scale-95',
              discountVal === String(v)
                ? 'bg-warning/15 border-warning/40 text-warning'
                : 'bg-pos-surface border-pos-border text-pos-faint hover:border-pos-border-strong',
            )}
          >
            {discountType === 'pct' ? `${v}%` : `$${v}`}
          </button>
        ))}
      </div>

      <input
        value={discountVal}
        onChange={e => setDiscountVal(e.target.value)}
        placeholder={discountType === 'pct' ? 'e.g. 10 (for 10%)' : 'e.g. 5.00'}
        className="w-full h-12 bg-pos-surface border border-pos-border rounded-xl px-[14px] text-[13.5px] text-white outline-none mb-3 box-border transition-colors duration-150 focus:border-warning/50"
      />

      <div className="flex gap-[8px]">
        <button
          onClick={applyDiscount}
          className="flex-1 h-11 bg-warning border-0 rounded-xl text-[13px] font-semibold text-carbon cursor-pointer transition-all duration-150 active:scale-[0.97]"
        >
          Apply
        </button>
        {appliedDiscount && (
          <button
            onClick={() => { removeDiscount(); setPosView('charge'); }}
            className="px-4 h-11 bg-pos-surface border border-pos-border rounded-xl text-[13px] text-error cursor-pointer transition-all duration-150 hover:border-error/40 active:scale-95"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
