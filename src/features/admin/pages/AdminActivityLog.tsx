import { useMemo, useState } from 'react';
import { Activity as ActivityIcon, Download, ShieldAlert, X } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAdminActivityLog } from '@/hooks/admin/useAdminActivityLog';
import { useAdminActivityStats } from '@/hooks/admin/useAdminActivityStats';
import {
  apiExportAdminActivityLog, apiGetAdminActivityTimeline, ADMIN_ACTIVITY_CATEGORIES,
  type AdminActivityLogEntry, type AdminActivityCategory,
} from '@/api/services/activityLog';
import { Table, Badge, Button, SearchInput, FilterDropdown, AdminPageHeader, ActivityLogDetailModal, type TableColumn } from '@/components/comman/ui';
import type { BadgeColor } from '@/types';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatDate } from '@/components/comman/analytics/format';
import { timeAgo } from '@/utils/timeAgo';

// The only `targetType`s admin actually has a real page for — everything
// else stays plain text in the detail modal rather than a broken/fake link.
function resolveTargetHref(targetType: string | null, targetId: string | null): string | null {
  if (!targetType || !targetId) return null;
  if (targetType === 'seller') return `/admin/clients/${targetId}`;
  return null;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'seller', label: 'Seller' },
  { value: 'staff', label: 'Staff' },
  { value: 'system', label: 'System' },
];

const PAGE_SIZE = 20;

// Cycled over a small palette — 16 categories, 6 colors, repeats by design
// rather than needing a bespoke color per category.
const CATEGORY_COLOR: Record<AdminActivityCategory, BadgeColor> = {
  products: 'blue', orders: 'blue', finance: 'orange', marketing: 'yellow',
  customers: 'green', settings: 'gray', security: 'red',
  loyalty: 'green', subscriptions: 'blue', platform_billing: 'orange',
  platform_plans: 'orange', seo: 'yellow', ai_studio: 'yellow',
  announcements: 'gray', moderation: 'red', promotions: 'green',
};

function categoryLabel(c: string) {
  return c.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function actionTitle(action: string) {
  const s = action.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const CATEGORY_OPTIONS = ADMIN_ACTIVITY_CATEGORIES.map(c => ({ value: c, label: categoryLabel(c) }));
const DATE_RANGE_OPTIONS = [
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'last90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function AdminActivityLog({ embedded = false }: { embedded?: boolean } = {}) {
  usePageTitle('Activity Log');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [actorRole, setActorRole] = useState('');
  const [actorFilter, setActorFilter] = useState<{ id: string; name: string } | null>(null);
  const [dateRange, setDateRange] = useState('last30');
  const [securityOnly, setSecurityOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [viewing, setViewing] = useState<AdminActivityLogEntry | null>(null);

  const { data: stats } = useAdminActivityStats();

  // Memoized on `dateRange` alone — `daysAgo()` calls `new Date()` internally,
  // so recomputing it inline on every render (as this used to) produced a
  // freshly different millisecond-precision ISO string each time, even
  // though `dateRange` itself hadn't changed. `useAdminActivityLog` keys its
  // re-fetch on this query's JSON shape, so that constantly-"new" value was
  // a genuine infinite fetch loop: every completed fetch triggered a
  // re-render, which recomputed a new `from`, which triggered another fetch
  // — reproducing the "keeps loading every fraction of a second" symptom.
  const from = useMemo(
    () => dateRange === 'last7' ? daysAgo(7) : dateRange === 'last30' ? daysAgo(30) : dateRange === 'last90' ? daysAgo(90) : undefined,
    [dateRange],
  );

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      category: (category || undefined) as AdminActivityCategory | undefined,
      actorRole: actorRole || undefined,
      actorId: actorFilter?.id,
      isSecurityAlert: securityOnly || undefined,
      from,
    }),
    [page, search, category, actorRole, actorFilter, securityOnly, from],
  );

  const { data, loading, error, refetch } = useAdminActivityLog(query);

  async function handleExport() {
    setExporting(true);
    setExportError('');
    try {
      await apiExportAdminActivityLog(query);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export activity log.');
    } finally {
      setExporting(false);
    }
  }

  const columns: TableColumn<AdminActivityLogEntry>[] = [
    { key: 'createdAt', header: 'Date', render: r => <span className="text-slate whitespace-nowrap">{formatDate(r.createdAt)}</span> },
    { key: 'storeId', header: 'Store', render: r => <span className="text-graphite whitespace-nowrap">{r.storeId === 'platform' ? 'Platform' : r.storeId}</span> },
    {
      key: 'category', header: 'Category',
      render: r => (
        <div className="flex items-center gap-1.5">
          <Badge color={r.isSecurityAlert ? 'red' : CATEGORY_COLOR[r.category] ?? 'gray'} size="sm">
            {r.isSecurityAlert && <ShieldAlert size={10} />} {r.isSecurityAlert ? 'Security Alert' : categoryLabel(r.category)}
          </Badge>
        </div>
      ),
    },
    {
      key: 'action', header: 'Action',
      render: r => (
        <div className="max-w-[220px]">
          <p className="font-medium text-charcoal truncate m-0">{actionTitle(r.action)}</p>
          {r.description && <p className="text-[11px] text-slate truncate m-0">{r.description}</p>}
        </div>
      ),
    },
    {
      key: 'actorName', header: 'Actor',
      render: r => (
        <div className="max-w-[160px]">
          {r.actorId ? (
            <button
              onClick={(e) => { e.stopPropagation(); setActorFilter({ id: r.actorId!, name: r.actorName ?? r.actorId! }); setPage(1); }}
              className="text-graphite truncate m-0 bg-transparent border-none p-0 cursor-pointer hover:text-brand-orange hover:underline text-left"
              title="View only this actor's activity"
            >
              {r.actorName ?? r.actorId}
            </button>
          ) : (
            <p className="text-graphite truncate m-0">—</p>
          )}
          {r.actorRole && <p className="text-[11px] text-slate m-0">{r.actorRole}</p>}
        </div>
      ),
    },
    {
      key: 'ip', header: 'Where from',
      render: r => (
        <div className="whitespace-nowrap">
          <p className="text-slate m-0">{r.ip ?? '—'}</p>
          {(r.location?.city || r.location?.country) && (
            <p className="text-[11px] text-slate/80 m-0">{[r.location?.city, r.location?.country].filter(Boolean).join(', ')}</p>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      {!embedded && (
        <AdminPageHeader
          title="Activity Log"
          subtitle="Platform-wide audit trail — every seller store plus platform-level actions, in one place."
        />
      )}
      <div className="px-4 sm:px-7 pt-6 pb-8 flex flex-col gap-5">

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Events', value: stats.totalEvents.toLocaleString(), sub: 'Last 90 days' },
            { label: 'Actions Today', value: String(stats.actionsToday), sub: `${stats.activeActorsToday} actor(s) active` },
            { label: 'Security Alerts', value: String(stats.securityAlerts), sub: stats.securityAlerts === 0 ? 'No threats' : 'Review recommended' },
            { label: 'Last Login', value: stats.lastLogin ? timeAgo(stats.lastLogin.at) : '—', sub: stats.lastLogin ? [stats.lastLogin.actorName, stats.lastLogin.location?.city].filter(Boolean).join(' · ') : '' },
          ].map(m => (
            <div key={m.label} className="bg-white border border-bone rounded-[10px] px-5 py-4">
              <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{m.label}</p>
              <p className="text-[24px] font-bold text-carbon leading-[1.15]">{m.value}</p>
              {m.sub && <p className="text-xs text-slate mt-1">{m.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {exportError && <div className="bg-error-bg border border-error-border rounded-lg px-4 py-2.5 text-[12.5px] text-error">{exportError}</div>}

      <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
        <div className="px-5 py-[14px] border-b border-bone flex gap-[10px] items-center flex-wrap">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search action, actor, description…" className="flex-1 max-w-[280px]" />
          <FilterDropdown placeholder="All Categories" options={CATEGORY_OPTIONS} value={category} onChange={v => { setCategory(v); setPage(1); }} />
          <FilterDropdown placeholder="All Roles" options={ROLE_OPTIONS} value={actorRole} onChange={v => { setActorRole(v); setPage(1); }} />
          <FilterDropdown options={DATE_RANGE_OPTIONS} value={dateRange} onChange={v => { setDateRange(v); setPage(1); }} />
          <label className="flex items-center gap-1.5 text-[13px] text-graphite cursor-pointer select-none px-1">
            <input
              type="checkbox"
              className="accent-brand-orange cursor-pointer"
              checked={securityOnly}
              onChange={e => { setSecurityOnly(e.target.checked); setPage(1); }}
            />
            Security alerts only
          </label>
          <Button variant="outline" size="sm" icon={<Download size={12} />} loading={exporting} onClick={handleExport} className="ml-auto">
            Export CSV
          </Button>
        </div>

        {actorFilter && (
          <div className="px-5 py-2 border-b border-bone bg-cream flex items-center gap-2">
            <span className="text-[12px] text-graphite">Filtered to actor:</span>
            <span className="text-[12px] font-semibold text-charcoal">{actorFilter.name}</span>
            <button onClick={() => { setActorFilter(null); setPage(1); }} className="ml-1 w-5 h-5 rounded-full bg-white border border-bone flex items-center justify-center cursor-pointer text-slate hover:text-charcoal">
              <X size={11} />
            </button>
          </div>
        )}

        {error ? (
          <div className="p-5"><AnalyticsErrorState message={error} onRetry={refetch} /></div>
        ) : (
          <Table
            columns={columns}
            data={data?.logs ?? []}
            keyExtractor={r => r._id}
            loading={loading}
            onRowClick={setViewing}
            emptyState={{ icon: <ActivityIcon size={28} className="text-slate/50" />, title: 'No activity matches your filters', description: 'Try adjusting your search, category, or date range.' }}
            pagination={{ page, total: data?.pagination?.total ?? 0, perPage: PAGE_SIZE, onChange: setPage, label: 'events' }}
          />
        )}
      </div>
      </div>

      {viewing && (
        <ActivityLogDetailModal
          entry={viewing}
          onClose={() => setViewing(null)}
          targetHref={resolveTargetHref(viewing.targetType, viewing.targetId)}
          fetchTimeline={apiGetAdminActivityTimeline}
        />
      )}
    </>
  );
}
