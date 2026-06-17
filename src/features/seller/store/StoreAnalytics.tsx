import { BarChart2, Clock } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';

export default function StoreAnalytics() {
  const { store, loading } = useStoreWorkspace();
  return (
    <div>
      <StorePageHeader
        title="Analytics"
        subtitle={loading ? '' : store?.name ?? ''}
      />
      <div className="px-7 py-[60px] flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-bone border border-bone flex items-center justify-center mb-4">
          <BarChart2 size={28} className="text-brand-orange opacity-60" />
        </div>
        <p className="text-[18px] font-bold text-charcoal mb-1.5">Analytics coming soon</p>
        <p className="text-[13px] text-slate max-w-[360px] text-center">
          Detailed sales, traffic, and conversion analytics for your store will be available here.
        </p>
        <div className="mt-5 flex items-center gap-1.5 text-slate">
          <Clock size={13} />
          <span className="text-[12px]">In development</span>
        </div>
      </div>
    </div>
  );
}
