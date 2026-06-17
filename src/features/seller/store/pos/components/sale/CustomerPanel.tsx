import { clsx } from 'clsx';
import { Star } from 'lucide-react';
import { Avatar } from '@/components/comman/ui/Avatar';
import { POS_CUSTOMERS } from '../../pos.data';
import type { PosCustomer, PosView } from '../../pos.types';

interface CustomerPanelProps {
  customer:    PosCustomer | null;
  setCustomer: (c: PosCustomer | null) => void;
  setPosView:  (v: PosView) => void;
}

export function CustomerPanel({ customer, setCustomer, setPosView }: CustomerPanelProps) {
  return (
    <div className="px-[18px] py-[14px] border-b border-carbon bg-[#141312] shrink-0">
      <p className="text-[12px] font-semibold text-white mb-[10px]">Attach Customer</p>

      <input
        placeholder="Search by name or email..."
        className="w-full bg-carbon border-0 rounded-lg px-3 py-[7px] text-[12px] text-white outline-none mb-[10px] box-border"
      />

      {POS_CUSTOMERS.map(c => (
        <button
          key={c.email}
          onClick={() => { setCustomer(c); setPosView('charge'); }}
          className={clsx(
            'w-full flex items-center gap-[10px] px-[10px] py-[7px] rounded-lg mb-1 border-0 cursor-pointer text-left',
            customer?.email === c.email ? 'bg-charcoal' : 'bg-transparent',
          )}
        >
          <Avatar name={c.name} size={28} variant="pos" />
          <div className="flex-1">
            <p className="text-[12px] font-medium text-white">{c.name}</p>
            <p className="text-[10px] text-pos-muted">{c.email}</p>
          </div>
          <span className="bg-brand-pale-orange text-brand-deep-orange text-[10px] font-semibold px-[7px] py-[2px] rounded-[20px] flex items-center gap-[3px]">
            <Star size={9} className="fill-brand-deep-orange text-brand-deep-orange" />
            {c.points} pts
          </span>
        </button>
      ))}

      <button
        onClick={() => { setCustomer(null); setPosView('charge'); }}
        className="w-full text-center px-0 py-[6px] text-[11px] bg-transparent border-0 cursor-pointer text-pos-muted"
      >
        × Clear customer
      </button>
    </div>
  );
}
