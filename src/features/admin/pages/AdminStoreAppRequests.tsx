import { useState, useEffect, useCallback, useMemo } from 'react';
import { clsx } from 'clsx';
import { Smartphone, Bot, Apple, ExternalLink, Eye } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  apiAdminListStoreAppRequests, apiAdminUpdatePlatformStatus,
  STORE_APP_PLATFORM_STATUSES,
  type AdminStoreAppRequest, type StoreAppPlatformStatus,
} from '@/api/services/storeAppRequests';
import { Button, Modal, StatusBadge, Select, Input, Textarea, Table, CopyIconButton, type TableColumn } from '@/components/comman/ui';

// Icon/feature-graphic are optional on the request (a seller can submit
// without them) — every place that renders one needs a real fallback
// instead of a broken <img src="null">.
function AppIconThumb({ url, size = 28 }: { url: string | null; size?: number }) {
  if (url) {
    return (
      <img
        src={url} alt=""
        style={{ width: size, height: size }}
        className="rounded-lg border border-bone object-cover shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-lg border border-dashed border-bone bg-[#faf9f5] flex items-center justify-center shrink-0"
    >
      <Smartphone size={Math.round(size * 0.5)} className="text-slate" />
    </div>
  );
}

const STATS_CONFIG: { key: StoreAppPlatformStatus; label: string; color: string }[] = [
  { key: 'pending', label: 'Pending', color: 'text-slate' },
  { key: 'in_review', label: 'In review', color: 'text-info' },
  { key: 'building', label: 'Building', color: 'text-info' },
  { key: 'submitted', label: 'Submitted', color: 'text-info' },
  { key: 'published', label: 'Published', color: 'text-success' },
  { key: 'rejected', label: 'Rejected', color: 'text-error' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

// ── One platform's editable status row inside the review modal ────────────
function PlatformEditor({
  requestId, platform, label, Icon, state, onUpdated,
}: {
  requestId: string;
  platform: 'android' | 'ios';
  label: string;
  Icon: typeof Apple;
  state: AdminStoreAppRequest['android'];
  onUpdated: (updated: AdminStoreAppRequest) => void;
}) {
  const [status, setStatus] = useState<StoreAppPlatformStatus>(state.status);
  const [storeUrl, setStoreUrl] = useState(state.storeUrl ?? '');
  const [rejectionReason, setRejectionReason] = useState(state.rejectionReason ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const dirty = status !== state.status || (status === 'published' && storeUrl !== (state.storeUrl ?? ''));

  const handleSave = async () => {
    if (status === 'published' && !storeUrl.trim()) { setError('A live store URL is required to mark this published.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await apiAdminUpdatePlatformStatus(requestId, {
        platform, status,
        storeUrl: status === 'published' ? storeUrl.trim() : undefined,
        rejectionReason: status === 'rejected' ? rejectionReason.trim() : undefined,
      });
      onUpdated(res.data as AdminStoreAppRequest);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  if (!state.requested) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#f7f6f1] text-[12.5px] text-slate">
        <Icon size={14} /> {label} not requested
      </div>
    );
  }

  return (
    <div className="border border-bone rounded-lg p-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-charcoal" />
        <p className="text-[13px] font-bold text-charcoal flex-1">{label}</p>
        <StatusBadge status={state.status} size="sm" />
      </div>

      {state.storeUrl && (
        <a href={state.storeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-orange no-underline w-fit">
          <ExternalLink size={12} /> Current listing
        </a>
      )}

      <Select value={status} onChange={e => setStatus(e.target.value as StoreAppPlatformStatus)}>
        {STORE_APP_PLATFORM_STATUSES.filter(s => s !== 'not_requested').map(s => (
          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
        ))}
      </Select>

      {status === 'published' && (
        <Input value={storeUrl} onChange={e => setStoreUrl(e.target.value)} placeholder="https://play.google.com/store/apps/details?id=..." />
      )}
      {status === 'rejected' && (
        <Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Reason shown to the seller" rows={2} />
      )}

      {error && <p className="text-[11.5px] text-error">{error}</p>}

      <Button variant="outline" size="sm" onClick={handleSave} disabled={!dirty} loading={saving}>
        Save {label} status
      </Button>
    </div>
  );
}

// ── Review modal ────────────────────────────────────────────────────────────
function ReviewModal({ request, onClose, onChanged }: {
  request: AdminStoreAppRequest; onClose: () => void; onChanged: (updated: AdminStoreAppRequest) => void;
}) {
  return (
    <Modal mobileSheet title={request.appName} width={600} onClose={onClose} footer={<Button variant="outline" onClick={onClose}>Close</Button>}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <AppIconThumb url={request.iconUrl} size={48} />
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-charcoal truncate">{request.storeName ?? request.storeId}</p>
            <p className="text-[11.5px] text-slate truncate">{request.storeSlug ? `/${request.storeSlug}` : 'no slug'} · submitted {formatDate(request.createdAt)}</p>
            <p className="inline-flex items-center gap-1 text-[11px] text-slate/80 mt-0.5">
              <span className="font-mono truncate max-w-[220px]">ID: {request.storeId}</span>
              <CopyIconButton value={request.storeId} title="Copy store ID" size={11} />
            </p>
          </div>
        </div>

        {request.featureGraphicUrl ? (
          <img src={request.featureGraphicUrl} alt="" className="w-full rounded-lg border border-bone object-cover" />
        ) : (
          <div className="w-full h-[120px] rounded-lg border border-dashed border-bone bg-[#faf9f5] flex items-center justify-center">
            <span className="text-[12px] text-slate">No feature graphic provided</span>
          </div>
        )}

        <div>
          <p className="text-[11.5px] font-semibold text-slate uppercase tracking-[0.05em] mb-1">Short description</p>
          <p className="text-[13px] text-charcoal">{request.shortDescription}</p>
        </div>
        <div>
          <p className="text-[11.5px] font-semibold text-slate uppercase tracking-[0.05em] mb-1">Full description</p>
          <p className="text-[13px] text-charcoal whitespace-pre-wrap leading-[1.6]">{request.fullDescription}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PlatformEditor requestId={request._id} platform="android" label="Android" Icon={Bot} state={request.android} onUpdated={onChanged} />
          <PlatformEditor requestId={request._id} platform="ios" label="iOS" Icon={Apple} state={request.ios} onUpdated={onChanged} />
        </div>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export function AdminStoreAppRequests() {
  usePageTitle('Store App Requests');
  const [statusFilter, setStatusFilter] = useState<StoreAppPlatformStatus | ''>('');
  const [requests, setRequests] = useState<AdminStoreAppRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState<AdminStoreAppRequest | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    apiAdminListStoreAppRequests(statusFilter ? { status: statusFilter } : undefined)
      .then(res => setRequests(res.data))
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load requests.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleChanged = (updated: AdminStoreAppRequest) => {
    setRequests(prev => prev.map(r => (r._id === updated._id ? { ...updated, storeName: r.storeName, storeSlug: r.storeSlug } : r)));
    setViewing(prev => (prev && prev._id === updated._id ? { ...updated, storeName: prev.storeName, storeSlug: prev.storeSlug } : prev));
  };

  // Per-platform counts across every loaded request — the quick "where is
  // everything sitting right now" strip above the table.
  const statusCounts = useMemo(() => {
    const counts: Partial<Record<StoreAppPlatformStatus, number>> = {};
    requests.forEach(r => {
      [r.android, r.ios].forEach(p => {
        if (p.requested) counts[p.status] = (counts[p.status] ?? 0) + 1;
      });
    });
    return counts;
  }, [requests]);

  const columns: TableColumn<AdminStoreAppRequest>[] = [
    {
      key: 'store', header: 'Store / App',
      render: r => (
        <div className="flex items-center gap-2.5 max-w-[240px]">
          <AppIconThumb url={r.iconUrl} />
          <div className="min-w-0">
            <p className="font-semibold truncate">{r.storeName ?? r.storeId}</p>
            <p className="text-[11px] text-slate truncate">{r.appName}</p>
            <p className="inline-flex items-center gap-1 text-[10.5px] text-slate/80">
              <span className="font-mono truncate max-w-[150px]">{r.storeId}</span>
              <CopyIconButton value={r.storeId} title="Copy store ID" size={10} />
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'android', header: 'Android',
      render: r => r.android.requested ? (
        <span className="inline-flex items-center gap-1.5"><Bot size={12} className="text-slate shrink-0" /><StatusBadge status={r.android.status} size="sm" /></span>
      ) : <span className="text-slate text-[12px]">—</span>,
    },
    {
      key: 'ios', header: 'iOS',
      render: r => r.ios.requested ? (
        <span className="inline-flex items-center gap-1.5"><Apple size={12} className="text-slate shrink-0" /><StatusBadge status={r.ios.status} size="sm" /></span>
      ) : <span className="text-slate text-[12px]">—</span>,
    },
    { key: 'createdAt', header: 'Submitted', render: r => <span className="whitespace-nowrap">{formatDate(r.createdAt)}</span> },
    {
      key: 'actions', header: '', align: 'right',
      render: r => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setViewing(r); }}>
          <span className="inline-flex items-center gap-1.5"><Eye size={13} /> Review</span>
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="bg-white border-b border-bone px-4 sm:px-7 py-[14px] sticky top-0 z-10 flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-brand-pale-orange flex items-center justify-center shrink-0">
          <Smartphone size={18} className="text-brand-deep-orange" />
        </div>
        <div>
          <h1 className="text-[18px] font-bold text-charcoal leading-[1.3]">Store App Requests</h1>
          <p className="text-[12px] text-slate mt-[2px]">White-label branded app requests — build and publish per platform, per store.</p>
        </div>
      </div>

      <div className="px-4 sm:px-7 pt-5 pb-8 flex flex-col gap-4">
        {!loading && requests.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {STATS_CONFIG.map(s => (
              <div key={s.key} className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-bone bg-white min-w-[104px]">
                <span className={clsx('text-[17px] font-bold leading-none', s.color)}>{statusCounts[s.key] ?? 0}</span>
                <span className="text-[11.5px] font-medium text-slate">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
          <div className="px-5 py-[14px] border-b border-bone flex items-center gap-[10px] flex-wrap">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StoreAppPlatformStatus | '')}
              className="px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer transition-colors duration-150 hover:border-slate/40 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10"
            >
              <option value="">All statuses</option>
              {STORE_APP_PLATFORM_STATUSES.filter(s => s !== 'not_requested').map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="px-4 py-6 text-center text-[13px] text-error">{error}</p>
          ) : (
            <Table
              columns={columns}
              data={requests}
              keyExtractor={r => r._id}
              loading={loading}
              onRowClick={setViewing}
              emptyState={{ icon: <Smartphone size={28} className="text-slate" />, title: 'No app requests found', description: 'Seller-submitted branded app requests will show up here.' }}
            />
          )}
        </div>
      </div>

      {viewing && (
        <ReviewModal
          request={viewing}
          onClose={() => setViewing(null)}
          onChanged={handleChanged}
        />
      )}
    </div>
  );
}
