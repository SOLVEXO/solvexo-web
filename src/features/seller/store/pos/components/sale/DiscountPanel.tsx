import { clsx } from 'clsx';
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

export function DiscountPanel({
  discountType, setDiscountType,
  discountVal, setDiscountVal,
  appliedDiscount, applyDiscount, removeDiscount,
  setPosView,
}: DiscountPanelProps) {
  return (
    <div className="px-[18px] py-[14px] border-b border-carbon bg-[#141312] shrink-0">
      <p className="text-[12px] font-semibold text-white mb-3">Apply Discount</p>

      {/* Type selector */}
      <div className="flex gap-[6px] mb-[10px]">
        {DISCOUNT_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setDiscountType(id)}
            className={clsx(
              'flex-1 py-2 text-center rounded-lg text-[11px] font-medium cursor-pointer border',
              'transition-transform duration-100 active:scale-95',
              discountType === id
                ? 'bg-brand-deep-orange border-brand-orange text-white'
                : 'bg-charcoal border-transparent text-pos-faint',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        value={discountVal}
        onChange={e => setDiscountVal(e.target.value)}
        placeholder={discountType === 'pct' ? 'e.g. 10 (for 10%)' : 'e.g. 5.00'}
        className="w-full bg-carbon border-0 rounded-lg px-3 py-[9px] text-[12px] text-white outline-none mb-2 box-border"
      />

      <div className="flex gap-2">
        <button
          onClick={applyDiscount}
          className="flex-1 bg-brand-orange border-0 rounded-lg py-[10px] text-[12px] font-semibold text-white cursor-pointer transition-transform duration-100 active:scale-[0.97]"
        >
          Apply
        </button>
        {appliedDiscount && (
          <button
            onClick={() => { removeDiscount(); setPosView('charge'); }}
            className="px-3 py-[10px] bg-carbon border-0 rounded-lg text-[12px] text-error cursor-pointer transition-transform duration-100 active:scale-95"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
