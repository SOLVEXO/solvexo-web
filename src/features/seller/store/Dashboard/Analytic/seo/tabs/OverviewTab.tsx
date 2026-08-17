import { Package, TrendingUp, ClipboardCheck, Gauge } from 'lucide-react';
import { Card } from '@/components/comman/ui/Card';
import { MetricCard } from '@/components/comman/ui/MetricCard';
import { Button } from '@/components/comman/ui/Button';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ScoreCircle, ChecklistCard } from '@/components/comman/seo';
import { useSeoDashboard } from '@/hooks/seller/seo/useSeoDashboard';
import { useUpdateSeoChecklistItem } from '@/hooks/seller/seo/useSeoDashboard';

interface OverviewTabProps {
  storeId: string;
  onNavigateTab: (tabId: string) => void;
}

export function OverviewTab({ storeId, onNavigateTab }: OverviewTabProps) {
  const { data, loading, error, refetch } = useSeoDashboard(storeId);
  const { updateChecklistItem } = useUpdateSeoChecklistItem();

  if (error) return <AnalyticsErrorState message={error} onRetry={refetch} />;

  const checklistItems = (data?.checklist ?? []).map(c => ({
    key: c.key,
    label: c.key.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()),
    done: c.done,
    automated: c.automated,
  }));

  const handleToggle = async (key: string, nextDone: boolean) => {
    await updateChecklistItem(storeId, { key, done: nextDone });
    refetch();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <MetricCard
          label="Store SEO Completeness"
          value={loading ? '—' : `${data?.storeCompleteness ?? 0}%`}
          icon={<Gauge size={16} />}
          loading={loading}
        />
        <MetricCard
          label="Avg Product Completeness"
          value={loading ? '—' : `${data?.productCompletenessAvg ?? 0}%`}
          icon={<Package size={16} />}
          loading={loading}
        />
        <MetricCard
          label="Products Tracked"
          value={loading ? '—' : (data?.productCount ?? 0).toLocaleString()}
          icon={<TrendingUp size={16} />}
          loading={loading}
        />
        <MetricCard
          label="Checklist Completion"
          value={loading ? '—' : `${data?.checklistCompletion ?? 0}%`}
          icon={<ClipboardCheck size={16} />}
          loading={loading}
        />
      </div>

      <div className="flex gap-5 items-start flex-col lg:flex-row">
        <Card className="w-full lg:w-[280px] shrink-0 flex flex-col items-center text-center gap-3">
          <ScoreCircle score={data?.storeCompleteness ?? 0} size={96} />
          <div>
            <p className="text-[15px] font-bold text-carbon mb-1">Store SEO Health</p>
            <p className="text-[12px] text-slate leading-[1.6]">
              Based on store meta, product completeness, and your technical checklist.
            </p>
          </div>
          <Button variant="outline" size="sm" fullWidth onClick={() => onNavigateTab('audit')}>
            Run Full SEO Audit
          </Button>
        </Card>

        <ChecklistCard
          items={checklistItems}
          onToggle={handleToggle}
          loading={loading}
          className="flex-1 w-full"
        />
      </div>
    </div>
  );
}
