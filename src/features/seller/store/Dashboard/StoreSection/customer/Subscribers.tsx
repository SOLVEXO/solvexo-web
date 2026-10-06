import { useEffect, useState } from 'react';
import { MailCheck, MailX, UserPlus, Download, Trash2, Mail } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  apiListStoreSubscribers, apiExportStoreSubscribers, apiAddStoreSubscriber,
  apiSetStoreSubscriberStatus, apiDeleteStoreSubscriber,
  type Subscriber, type SubscriberListResponse, type SubscriberStatusFilter,
} from '@/api/services/newsletter';
import { MetricCard } from '@/components/comman/ui/MetricCard';
import { Table, type TableColumn } from '@/components/comman/ui/Table';
import { Badge } from '@/components/comman/ui/Badge';
import { SearchInput } from '@/components/comman/ui/SearchInput';
import { FilterDropdown } from '@/components/comman/ui/FilterDropdown';
import { TabBar } from '@/components/comman/ui/TabBar';
import { Button } from '@/components/comman/ui/Button';
import { BulkImportButton } from '@/components/comman/bulk-import/BulkImportButton';
import { Modal } from '@/components/comman/ui/Modal';
import { SUBSCRIBER_SOURCE_LABEL, fmtSubscriberDate, downloadBlob, errMsg } from '@/utils/subscribers';

const PER_PAGE = 25;

const STORE_SOURCE_OPTIONS = ['store_footer', 'store_section', 'checkout', 'seller', 'import']
  .map(value => ({ value, label: SUBSCRIBER_SOURCE_LABEL[value] }));

/** A store's own email subscribers — the people who agreed to receive its
 *  marketing email (storefront signup, checkout checkbox, added/imported by
 *  the seller). Campaigns and automations only ever go to this list. */
export default function StoreSubscribers() {
  const { storeId } = useStoreWorkspace();

  const [status, setStatus] = useState<SubscriberStatusFilter>('active');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<SubscriberListResponse | null>(null);
  // `loadedKey` is the query the current `data`/`loadError` answer — loading
  // is derived from it rather than toggled inside the fetch effect.
  const [loadedKey, setLoadedKey] = useState('');
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Subscriber | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    // Only re-runs when the search text changes, so resetting to page 1
    // here never undoes plain pagination.
    const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const changeStatus = (v: SubscriberStatusFilter) => { setStatus(v); setPage(1); };
  const changeSource = (v: string) => { setSource(v); setPage(1); };

  const queryKey = JSON.stringify([storeId, status, debouncedSearch, source, page, reloadKey]);
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    const key = JSON.stringify([storeId, status, debouncedSearch, source, page, reloadKey]);
    apiListStoreSubscribers(storeId, { status, search: debouncedSearch || undefined, source: source || undefined, page, limit: PER_PAGE })
      .then(res => { if (!cancelled) { setData(res.data); setLoadError(''); setLoadedKey(key); } })
      .catch(err => { if (!cancelled) { setLoadError(errMsg(err, 'Failed to load subscribers.')); setLoadedKey(key); } });
    return () => { cancelled = true; };
  }, [storeId, status, debouncedSearch, source, page, reloadKey]);

  const shownError = error || loadError;

  const reload = () => setReloadKey(k => k + 1);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await apiExportStoreSubscribers(storeId, { status, search: debouncedSearch || undefined, source: source || undefined });
      downloadBlob(blob, `subscribers-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      setError(errMsg(err, 'Export failed.'));
    } finally { setExporting(false); }
  };

  const handleUnsubscribe = async (s: Subscriber) => {
    setBusyId(s._id);
    try {
      await apiSetStoreSubscriberStatus(storeId, s._id, false);
      setNotice(`${s.email} was unsubscribed.`);
      reload();
    } catch (err) {
      setError(errMsg(err, 'Could not unsubscribe.'));
    } finally { setBusyId(null); }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setBusyId(removeTarget._id);
    try {
      await apiDeleteStoreSubscriber(storeId, removeTarget._id);
      setNotice(`${removeTarget.email} was removed.`);
      setRemoveTarget(null);
      reload();
    } catch (err) {
      setError(errMsg(err, 'Could not remove subscriber.'));
    } finally { setBusyId(null); }
  };

  const handleAdd = async () => {
    if (!addEmail.trim()) return;
    setAddSaving(true);
    setAddError('');
    try {
      const res = await apiAddStoreSubscriber(storeId, addEmail.trim());
      setNotice(res.message || 'Subscriber added.');
      setAddOpen(false);
      reload();
    } catch (err) {
      setAddError(errMsg(err, 'Could not add subscriber.'));
    } finally { setAddSaving(false); }
  };

  const summary = data?.summary;
  const firstLoad = loading && !data;

  const columns: TableColumn<Subscriber>[] = [
    {
      key: 'email', header: 'Subscriber',
      render: s => (
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-carbon truncate">{s.email}</p>
          {s.name && <p className="text-[11px] text-slate truncate">{s.name}</p>}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: s => s.status === 'subscribed'
        ? <Badge color="green" dot>Subscribed</Badge>
        : s.status === 'pending'
          ? <Badge color="yellow" dot>Awaiting confirmation</Badge>
          : <Badge color="gray" dot>Unsubscribed</Badge>,
    },
    { key: 'source', header: 'Source', render: s => <span className="text-slate">{SUBSCRIBER_SOURCE_LABEL[s.source] ?? s.source}</span> },
    {
      key: 'consentAt', header: 'Date',
      render: s => (
        <span className="text-slate">
          {s.status === 'subscribed' ? fmtSubscriberDate(s.consentAt) : s.status === 'pending' ? `Signed up ${fmtSubscriberDate(s.createdAt)}` : `Left ${fmtSubscriberDate(s.unsubscribedAt)}`}
        </span>
      ),
    },
    {
      key: 'actions', header: '', align: 'right',
      render: s => (
        <div className="flex items-center justify-end gap-3">
          {s.status !== 'unsubscribed' && (
            <button
              disabled={busyId === s._id}
              onClick={e => { e.stopPropagation(); handleUnsubscribe(s); }}
              className="text-xs font-medium text-brand-orange bg-transparent border-none cursor-pointer disabled:opacity-50"
            >
              Unsubscribe
            </button>
          )}
          <button
            aria-label={`Remove ${s.email}`}
            disabled={busyId === s._id}
            onClick={e => { e.stopPropagation(); setRemoveTarget(s); }}
            className="text-slate hover:text-error bg-transparent border-none cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <StorePageHeader
        title="Subscribers"
        subtitle="People who agreed to receive marketing emails from this store. Campaigns and automations only go to this list."
        actions={
          <div className="flex flex-wrap gap-2">
            <BulkImportButton
              entityLabel="subscribers"
              basePath={`/api/newsletter/stores/${storeId}/subscribers`}
              onImported={reload}
              consent={{ label: 'I confirm these customers agreed to receive marketing emails from my store.' }}
              notes={['Already subscribed addresses are skipped.', 'People who unsubscribed before are skipped — only they can opt back in.']}
            />
            <Button size="sm" icon={<UserPlus size={14} />} onClick={() => { setAddEmail(''); setAddError(''); setAddOpen(true); }}>
              Add subscriber
            </Button>
          </div>
        }
      />

      <div className="px-4 md:px-7 pt-5 pb-8 flex flex-col gap-5">
        <div className="flex flex-wrap gap-3">
          <MetricCard label="Subscribed" value={(summary?.active ?? 0).toLocaleString()} icon={<MailCheck size={16} />} loading={firstLoad} />
          <MetricCard label="New in last 30 days" value={(summary?.newLast30Days ?? 0).toLocaleString()} icon={<Mail size={16} />} loading={firstLoad} />
          <MetricCard label="Unsubscribed" value={(summary?.unsubscribed ?? 0).toLocaleString()} icon={<MailX size={16} />} loading={firstLoad} />
        </div>

        {notice && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-success-bg text-success text-[12.5px]">
            <span>{notice}</span>
            <button onClick={() => setNotice('')} className="bg-transparent border-none cursor-pointer text-success text-xs font-semibold">Dismiss</button>
          </div>
        )}

        <div className="bg-white border border-bone rounded-[10px] min-w-0 overflow-hidden">
          <TabBar
            tabs={[
              { id: 'active', label: 'Subscribed', count: summary?.active },
              { id: 'unsubscribed', label: 'Unsubscribed', count: summary?.unsubscribed },
              ...(summary?.pending ? [{ id: 'pending', label: 'Awaiting confirmation', count: summary.pending }] : []),
              { id: 'all', label: 'All' },
            ]}
            active={status}
            onChange={id => changeStatus(id as SubscriberStatusFilter)}
          />

          <div className="px-5 py-3.5 border-b border-bone flex flex-wrap items-center gap-2.5">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by email…" className="max-w-[240px]" />
            <FilterDropdown placeholder="All sources" options={STORE_SOURCE_OPTIONS} value={source} onChange={changeSource} />
            <Button size="xs" variant="outline" icon={<Download size={12} />} loading={exporting} onClick={handleExport} className="ml-auto">
              Export CSV
            </Button>
          </div>

          {shownError ? (
            <div className="p-4 flex items-center gap-3">
              <p className="text-xs text-error">{shownError}</p>
              <button onClick={() => { setError(''); reload(); }} className="text-xs font-medium text-brand-orange bg-transparent border-none cursor-pointer">Retry</button>
            </div>
          ) : (
            <Table
              columns={columns}
              data={data?.items ?? []}
              keyExtractor={s => s._id}
              loading={loading}
              pagination={{ page, total: data?.pagination.total ?? 0, perPage: PER_PAGE, onChange: setPage, label: 'subscribers' }}
              emptyState={{
                icon: <MailCheck size={28} className="text-brand-orange opacity-55" />,
                title: status === 'unsubscribed' ? 'No one has unsubscribed' : 'No subscribers yet',
                description: status === 'unsubscribed'
                  ? 'People who unsubscribe from your emails show up here.'
                  : 'Shoppers join from your storefront footer, the Newsletter section, or the checkout checkbox. You can also add or import them.',
              }}
            />
          )}
        </div>
      </div>

      {addOpen && (
        <Modal
          title="Add subscriber"
          onClose={() => setAddOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button size="sm" loading={addSaving} disabled={!addEmail.trim()} onClick={handleAdd}>Add</Button>
            </div>
          }
        >
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium text-charcoal" htmlFor="add-subscriber-email">Email address</label>
            <input
              id="add-subscriber-email"
              type="email"
              value={addEmail}
              onChange={e => setAddEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10"
            />
            <p className="text-[11px] text-slate">Only add people who have agreed to receive marketing emails from you.</p>
            {addError && <p className="text-[12px] text-error">{addError}</p>}
          </div>
        </Modal>
      )}

      {removeTarget && (
        <Modal
          title="Remove subscriber?"
          onClose={() => setRemoveTarget(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
              <Button size="sm" loading={busyId === removeTarget._id} onClick={handleRemove}>Remove</Button>
            </div>
          }
        >
          <p className="text-[13px] text-charcoal">
            <span className="font-semibold">{removeTarget.email}</span> will be deleted from your list, including their consent record.
            To just stop emailing them, use Unsubscribe instead.
          </p>
        </Modal>
      )}
    </>
  );
}
