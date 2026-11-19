import { Select } from '@/components/comman/ui';
import type { GrowthRange } from '@/api/services/growth';
import { RANGE_LABEL } from './growthFormat';

export function RangeSelect({ value, onChange }: { value: GrowthRange; onChange: (v: GrowthRange) => void }) {
  return (
    <div className="w-[170px]">
      <Select value={value} onChange={e => onChange(e.target.value as GrowthRange)} aria-label="Date range">
        {(Object.keys(RANGE_LABEL) as GrowthRange[]).map(r => <option key={r} value={r}>{RANGE_LABEL[r]}</option>)}
      </Select>
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white border border-bone rounded-[10px] px-4 py-3.5">
      <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{label}</p>
      <p className="text-[22px] font-bold text-carbon leading-[1.15]">{value}</p>
      {hint && <p className="text-[11px] text-slate mt-1">{hint}</p>}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-error-bg border border-error-border rounded-lg px-4 py-3">
      <p className="text-[12.5px] text-error">{message}</p>
      {onRetry && <button onClick={onRetry} className="text-[12.5px] font-semibold text-error hover:underline cursor-pointer bg-transparent border-0">Retry</button>}
    </div>
  );
}
