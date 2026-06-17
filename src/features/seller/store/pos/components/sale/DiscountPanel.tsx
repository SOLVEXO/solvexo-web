import { clsx } from 'clsx';
import type { DiscountType, AppliedDiscount, PosView } from '../../pos.types';

interface DiscountPanelProps {
  discountType:       DiscountType;
  setDiscountType:    (t: DiscountType) => void;
  discountVal:        string;
  setDiscountVal:     (v: string) => void;
  couponCode:         string;
  setCouponCode:      (v: string) => void;
  appliedDiscount:    AppliedDiscount | null;
  setAppliedDiscount: (d: AppliedDiscount | null) => void;
  applyDiscount:      () => void;
  setPosView:         (v: PosView) => void;
}

const DISCOUNT_TABS: { id: DiscountType; label: string }[] = [
  { id: 'pct',    label: '% Off'  },
  { id: 'fixed',  label: '$ Off'  },
  { id: 'coupon', label: 'Coupon' },
];

export function DiscountPanel({
  discountType, setDiscountType,
  discountVal, setDiscountVal,
  couponCode, setCouponCode,
  appliedDiscount, setAppliedDiscount,
  applyDiscount,
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
              'flex-1 py-[6px] text-center rounded-lg text-[11px] font-medium cursor-pointer border',
              discountType === id
                ? 'bg-brand-deep-orange border-brand-orange text-white'
                : 'bg-charcoal border-transparent text-pos-faint',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {discountType !== 'coupon' ? (
        <input
          value={discountVal}
          onChange={e => setDiscountVal(e.target.value)}
          placeholder={discountType === 'pct' ? 'e.g. 10 (for 10%)' : 'e.g. 5.00'}
          className="w-full bg-carbon border-0 rounded-lg px-3 py-[7px] text-[12px] text-white outline-none mb-2 box-border"
        />
      ) : (
        <input
          value={couponCode}
          onChange={e => setCouponCode(e.target.value)}
          placeholder="Enter coupon code (try: SAVE10)"
          className="w-full bg-carbon border-0 rounded-lg px-3 py-[7px] text-[12px] text-white outline-none mb-2 box-border"
        />
      )}

      <div className="flex gap-2">
        <button
          onClick={applyDiscount}
          className="flex-1 bg-brand-orange border-0 rounded-lg py-2 text-[12px] font-semibold text-white cursor-pointer"
        >
          Apply
        </button>
        {appliedDiscount && (
          <button
            onClick={() => { setAppliedDiscount(null); setPosView('charge'); }}
            className="px-3 py-2 bg-carbon border-0 rounded-lg text-[12px] text-error cursor-pointer"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
