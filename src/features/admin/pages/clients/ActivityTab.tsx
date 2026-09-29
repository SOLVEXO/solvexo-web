import { useState } from 'react';
import { useClientActivity } from '@/hooks/admin/useAdminClients';
import { Table, Badge } from '@/components/comman/ui';
import type { TableColumn } from '@/components/comman/ui';
import type { BadgeColor } from '@/types';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatDate } from '@/components/comman/analytics/format';
import type { AdminActivityLogEntry } from '@/api/services/activityLog';
import { Activity as ActivityIcon } from 'lucide-react';

interface ActivityTabProps {
  sellerId: string;
}

const CATEGORY_COLOR: Record<string, BadgeColor> = {
  products: 'blue', orders: 'blue', finance: 'orange', marketing: 'yellow',
  customers: 'green', settings: 'gray', security: 'red',
  loyalty: 'green', subscriptions: 'blue', platform_billing: 'orange',
  platform_plans: 'orange', seo: 'yellow', ai_studio: 'yellow',
  announcements: 'gray', moderation: 'red', promotions: 'green',
};

function categoryLabel(c: string) {
  return c.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function actionTitle(action: string) {
  const s = action.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Every action across this client's stores, PLUS the platform-scoped
// admin actions (suspend/unsuspend, moderation review/approve/remove) that
// are genuinely about this client — see AdminClientsService.getActivity's
// own comment for the corrected, action-name-constrained query this reads
// from (not a blind targetId match against any platform event). ───────────
export function ActivityTab({ sellerId }: ActivityTabProps) {
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useClientActivity(sellerId, { page, limit: 20 });

  const columns: TableColumn<AdminActivityLogEntry>[] = [
    { key: 'createdAt', header: 'Date', render: (r) => <span className="text-[13px] text-slate whitespace-nowrap">{formatDate(r.createdAt)}</span> },
    { key: 'category', header: 'Category', render: (r) => <Badge size="sm" color={CATEGORY_COLOR[r.category] ?? 'gray'}>{categoryLabel(r.category)}</Badge> },
    {
      key: 'action',
      header: 'Action',
      render: (r) => (
        <div>
          <p className="text-[12.5px] font-medium text-charcoal">{actionTitle(r.action)}</p>
          {r.description && <p className="text-[11px] text-slate">{r.description}</p>}
        </div>
      ),
    },
    { key: 'actorName', header: 'Actor', render: (r) => <span className="text-[13px] text-graphite">{r.actorName ?? '—'} {r.actorRole ? `(${r.actorRole})` : ''}</span> },
  ];

  if (error) return <AnalyticsErrorState message={error} onRetry={refetch} />;

  return (
    <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
      <Table
        columns={columns}
        data={data?.logs ?? []}
        keyExtractor={(r) => r._id}
        loading={loading}
        emptyState={{ icon: <ActivityIcon size={28} className="text-slate/50" />, title: 'No activity yet' }}
        pagination={{ page, total: data?.pagination.total ?? 0, perPage: 20, onChange: setPage, label: 'events' }}
      />
    </div>
  );
}
