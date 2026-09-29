import { useState } from 'react';
import { useClientModeration } from '@/hooks/admin/useAdminClients';
import { ReportDetailModal } from '../AdminModeration';
import { Table, Badge } from '@/components/comman/ui';
import type { TableColumn } from '@/components/comman/ui';
import type { BadgeColor } from '@/types';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatDate } from '@/components/comman/analytics/format';
import type { ModerationReportRow, ModerationTargetType, RiskLevel } from '@/api/services/moderation/adminModeration';
import { Shield, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ModerationTabProps {
  sellerId: string;
  onChanged: () => void;
}

const RISK: Record<RiskLevel, { label: string; color: BadgeColor; Icon: LucideIcon }> = {
  high:   { label: 'High',   color: 'red',    Icon: AlertCircle },
  medium: { label: 'Medium', color: 'yellow', Icon: AlertTriangle },
  low:    { label: 'Low',    color: 'gray',   Icon: Info },
};
const TYPE_COLOR: Record<ModerationTargetType, BadgeColor> = { listing: 'blue', seller: 'orange', review: 'gray' };
const TYPE_LABEL: Record<ModerationTargetType, string> = { listing: 'Listing', seller: 'Seller', review: 'Review' };

// ── Reports against this client's account, product listings, and reviews —
// not just direct seller reports (see scopeNote from the backend). Row
// click opens the SAME ReportDetailModal (approve/remove actions included)
// the global Moderation queue already uses — reused, not duplicated. ───────
export function ModerationTab({ sellerId, onChanged }: ModerationTabProps) {
  const { data, loading, error, refetch } = useClientModeration(sellerId);
  const [selected, setSelected] = useState<ModerationReportRow | null>(null);

  const columns: TableColumn<ModerationReportRow>[] = [
    { key: 'targetType', header: 'Type', render: (r) => <Badge size="sm" color={TYPE_COLOR[r.targetType]}>{TYPE_LABEL[r.targetType]}</Badge> },
    {
      key: 'itemLabel',
      header: 'Item',
      render: (r) => (
        <div>
          <p className="text-[12.5px] font-medium text-charcoal">{r.itemLabel}</p>
          <p className="text-[11px] text-slate">{r.reason}</p>
        </div>
      ),
    },
    {
      key: 'riskLevel',
      header: 'Risk',
      render: (r) => {
        const risk = RISK[r.riskLevel];
        return <Badge size="sm" color={risk.color}><risk.Icon size={10} /> {risk.label}</Badge>;
      },
    },
    { key: 'status', header: 'Status', render: (r) => <span className="text-[12.5px] text-charcoal capitalize">{r.status}</span> },
    { key: 'createdAt', header: 'Reported', render: (r) => <span className="text-[13px] text-slate whitespace-nowrap">{formatDate(r.createdAt)}</span> },
  ];

  if (error) return <AnalyticsErrorState message={error} onRetry={refetch} />;

  return (
    <>
      {data?.scopeNote && <p className="text-[11px] text-slate mb-3">{data.scopeNote}</p>}
      <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
        <Table
          columns={columns}
          data={data?.reports ?? []}
          keyExtractor={(r) => r._id}
          loading={loading}
          onRowClick={(r) => setSelected(r)}
          emptyState={{ icon: <Shield size={28} className="text-slate/50" />, title: 'No moderation reports', description: 'Nothing has been reported against this client yet.' }}
        />
      </div>

      {selected && (
        <ReportDetailModal
          report={selected}
          onClose={() => setSelected(null)}
          onApproved={() => { setSelected(null); refetch(); onChanged(); }}
        />
      )}
    </>
  );
}
