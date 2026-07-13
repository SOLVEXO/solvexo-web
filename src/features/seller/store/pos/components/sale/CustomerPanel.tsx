import type { POSSaleState } from '../../pos.types';

interface CustomerPanelProps {
  sale: POSSaleState;
}

export function CustomerPanel({ sale }: CustomerPanelProps) {
  const { customerName, setCustomerName, setPosView } = sale;

  return (
    <div className="px-[18px] py-[14px] border-b border-carbon bg-[#141312] shrink-0">
      <p className="text-[12px] font-semibold text-white mb-[10px]">Customer Name</p>

      <input
        value={customerName === 'Walk-in' ? '' : customerName}
        onChange={e => setCustomerName(e.target.value || 'Walk-in')}
        placeholder="Walk-in"
        autoFocus
        className="w-full bg-carbon border-0 rounded-lg px-3 py-[9px] text-[12px] text-white outline-none mb-[10px] box-border"
      />

      <div className="flex gap-2">
        <button
          onClick={() => setPosView('charge')}
          className="flex-1 bg-brand-orange border-0 rounded-lg py-[10px] text-[12px] font-semibold text-white cursor-pointer transition-transform duration-100 active:scale-[0.97]"
        >
          Done
        </button>
        <button
          onClick={() => { setCustomerName('Walk-in'); setPosView('charge'); }}
          className="px-3 py-[10px] bg-carbon border-0 rounded-lg text-[12px] text-pos-muted cursor-pointer transition-transform duration-100 active:scale-95"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
