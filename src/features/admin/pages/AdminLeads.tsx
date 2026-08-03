import { useMemo, useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLeads, useLeadActions } from '@/hooks/admin/useAdminMarketplace';
import type { LeadRow } from '@/api/services/marketplace/adminMarketplace';
import { Table, Button, Modal, SearchInput, Badge } from '@/components/comman/ui';
import type { TableColumn } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatDate } from '@/components/comman/analytics/format';
import { Store, RefreshCw, Check, X } from 'lucide-react';

function StoreCell({ lead }: { lead: LeadRow }) {
  return (
    <div className="flex items-center gap-[10px]">
      <div className="w-8 h-8 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0 overflow-hidden border border-[#EDEBE2]">
        {lead.logo
          ? <img loading="lazy" decoding="async" src={lead.logo} alt={lead.storeName} className="w-full h-full object-cover" />
          : <Store size={15} className="text-brand-orange" />}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-graphite truncate max-w-[180px]">{lead.storeName}</p>
        {lead.categoryName && <p className="text-[11px] text-slate truncate max-w-[180px]">{lead.categoryName}</p>}
      </div>
    </div>
  );
}

export function AdminLeads() {
  usePageTitle('Leads');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const query = useMemo(() => ({ search: search || undefined, page, limit: 10 }), [search, page]);

  const { data, loading, error, refetch } = useLeads(query);
  const { approve, reject, processingId, error: actionError } = useLeadActions();

  const [rejecting, setRejecting] = useState<LeadRow | null>(null);
  const [reason, setReason] = useState('');

  async function handleApprove(lead: LeadRow) {
    const ok = await approve(lead.id);
    if (ok) refetch();
  }

  async function handleReject() {
    if (!rejecting) return;
    const ok = await reject(rejecting.id, reason.trim() || undefined);
    if (ok) { setRejecting(null); setReason(''); refetch(); }
  }

  const columns: TableColumn<LeadRow>[] = [
    { key: 'storeName', header: 'Store', render: lead => <StoreCell lead={lead} /> },
    {
      key: 'seller', header: 'Seller',
      render: lead => (
        <div className="min-w-0">
          <p className="text-[13px] text-graphite truncate max-w-[200px]">{lead.seller.name}</p>
          <p className="text-[11px] text-slate truncate max-w-[200px]">{lead.seller.email}</p>
          {lead.seller.phone && <p className="text-[11px] text-slate truncate max-w-[200px]">{lead.seller.phone}</p>}
        </div>
      ),
    },
    {
      key: 'sellerType', header: 'Seller Type',
      render: lead => lead.sellerType
        ? <Badge color="orange" className="capitalize">{lead.sellerType.replace(/_/g, ' ')}</Badge>
        : <span className="text-slate">—</span>,
    },
    {
      key: 'productTypes', header: 'Sells',
      render: lead => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {(lead.productTypes ?? []).map(pt => (
            <Badge key={pt} color="gray" className="capitalize">{pt.replace(/_/g, ' ')}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'submittedAt', header: 'Submitted',
      render: lead => <span className="text-[12px] text-slate whitespace-nowrap">{formatDate(lead.submittedAt)}</span>,
    },
    {
      key: 'actions', header: 'Actions', align: 'right',
      render: lead => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline" size="xs"
            icon={<X size={12} />}
            onClick={() => setRejecting(lead)}
            disabled={processingId === lead.id}
          >
            Reject
          </Button>
          <Button
            variant="primary" size="xs"
            icon={<Check size={12} />}
            onClick={() => handleApprove(lead)}
            loading={processingId === lead.id}
          >
            Approve
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 sm:px-7 pt-6 pb-8 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-charcoal mb-[3px]">Leads</h1>
          <p className="text-[12px] text-slate">New stores submitted through onboarding — review and approve or reject before they go live.</p>
        </div>
        <Button variant="outline" size="sm" icon={<RefreshCw size={13} />} onClick={refetch}>Refresh</Button>
      </div>

      {actionError && <div className="bg-error-bg border border-[#FECACA] rounded-lg px-4 py-2.5 text-[12.5px] text-error">{actionError}</div>}

      <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
        <div className="flex items-center gap-[10px] px-5 py-[14px] border-b border-bone flex-wrap">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by store name…" className="flex-1 max-w-[300px]" />
        </div>

        {error ? (
          <div className="p-5"><AnalyticsErrorState message={error} onRetry={refetch} /></div>
        ) : (
          <Table
            columns={columns}
            data={data?.items ?? []}
            keyExtractor={lead => lead.id}
            loading={loading}
            emptyState={{ icon: <Store size={28} className="text-slate/50" />, title: 'No pending leads', description: 'Every submitted store has been reviewed.' }}
            pagination={{ page, total: data?.total ?? 0, perPage: 10, onChange: setPage, label: 'leads' }}
          />
        )}
      </div>

      {rejecting && (
        <Modal
          title="Reject Lead"
          onClose={() => { setRejecting(null); setReason(''); }}
          footer={<>
            <Button variant="ghost" onClick={() => { setRejecting(null); setReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} loading={processingId === rejecting.id}>Reject Lead</Button>
          </>}
        >
          <p className="text-[13px] text-charcoal leading-[1.6] mb-3">
            Reject "<strong>{rejecting.storeName}</strong>"? The seller will be notified and the store will stay hidden from the marketplace.
          </p>
          <label htmlFor="lead-reject-reason" className="block text-[12px] font-medium text-charcoal mb-[6px]">Reason <span className="text-slate font-normal">(optional, shown to the seller)</span></label>
          <textarea
            id="lead-reject-reason"
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Store name conflicts with an existing brand"
            className="w-full px-3 py-[10px] rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white resize-y transition-[border-color,box-shadow] duration-150 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10"
          />
        </Modal>
      )}
    </div>
  );
}
