import { User } from 'lucide-react';
import type { POSSaleState } from '../../pos.types';

interface CustomerPanelProps {
  sale: POSSaleState;
}

export function CustomerPanel({ sale }: CustomerPanelProps) {
  const { customerName, setCustomerName, setPosView } = sale;

  return (
    <div className="px-5 py-[18px] border-b border-pos-border bg-pos-surface-3">
      <div className="flex items-center gap-[10px] mb-[14px]">
        <div className="w-9 h-9 rounded-xl bg-info/15 border border-info/30 flex items-center justify-center shrink-0">
          <User size={16} className="text-info" />
        </div>
        <p className="text-[13.5px] font-bold text-white">Customer Name</p>
      </div>

      <input
        value={customerName === 'Walk-in' ? '' : customerName}
        onChange={e => setCustomerName(e.target.value || 'Walk-in')}
        placeholder="Walk-in"
        autoFocus
        className="w-full h-12 bg-pos-surface border border-pos-border rounded-xl px-[14px] text-[13.5px] text-white outline-none mb-3 box-border transition-colors duration-150 focus:border-info/50"
      />

      <div className="flex gap-[8px]">
        <button
          onClick={() => setPosView('charge')}
          className="flex-1 h-11 bg-info border-0 rounded-xl text-[13px] font-semibold text-white cursor-pointer transition-all duration-150 active:scale-[0.97]"
        >
          Done
        </button>
        <button
          onClick={() => { setCustomerName('Walk-in'); setPosView('charge'); }}
          className="px-4 h-11 bg-pos-surface border border-pos-border rounded-xl text-[13px] text-pos-muted cursor-pointer transition-all duration-150 hover:border-pos-border-strong active:scale-95"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
