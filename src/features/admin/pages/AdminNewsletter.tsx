import { useCallback, useEffect, useState } from 'react';
import { MailCheck, MailX, Mail, Download, Trash2, Send } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AdminPageHeader } from '@/components/comman/ui/AdminPageHeader';
import { MetricCard } from '@/components/comman/ui/MetricCard';
import { Table, type TableColumn } from '@/components/comman/ui/Table';
import { Badge } from '@/components/comman/ui/Badge';
import { SearchInput } from '@/components/comman/ui/SearchInput';
import { TabBar } from '@/components/comman/ui/TabBar';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import {
  apiListPlatformSubscribers, apiExportPlatformSubscribers, apiSetPlatformSubscriberStatus, apiDeletePlatformSubscriber,
  apiListBroadcasts, apiSendBroadcast,
  type Subscriber, type SubscriberListResponse, type SubscriberStatusFilter, type NewsletterBroadcast,
} from '@/api/services/newsletter';
import { SUBSCRIBER_SOURCE_LABEL, fmtSubscriberDate, downloadBlob, errMsg } from '@/utils/subscribers';

const PER_PAGE = 25;

const inputCls = 'w-full px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10';

// ── Subscribers tab ─────────────────────────────────────────────────────────

function SubscribersTab({ onSummary }: { onSummary: (active: number) => void }) {
  const [status, setStatus] = useState<SubscriberStatusFilter>('active');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SubscriberListResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState('');
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Subscriber | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryKey = JSON.stringify([status, debouncedSearch, page, reloadKey]);
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    let cancelled = false;
    const key = JSON.stringify([status, debouncedSearch, page, reloadKey]);
    apiListPlatformSubscribers({ status, search: debouncedSearch || undefined, page, limit: PER_PAGE })
      .then(res => { if (!cancelled) { setData(res.data); setLoadError(''); setLoadedKey(key); onSummary(res.data.summary.active); } })
      .catch(err => { if (!cancelled) { setLoadError(errMsg(err, 'Failed to load subscribers.')); setLoadedKey(key); } });
    return () => { cancelled = true; };
  }, [status, debouncedSearch, page, reloadKey, onSummary]);

  const shownError = error || loadError;

  const reload = () => setReloadKey(k => k + 1);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await apiExportPlatformSubscribers({ status, search: debouncedSearch || undefined });
      downloadBlob(blob, `solvexo-subscribers-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      setError(errMsg(err, 'Export failed.'));
    } finally { setExporting(false); }
  };

  const handleUnsubscribe = async (s: Subscriber) => {
    setBusyId(s._id);
    try { await apiSetPlatformSubscriberStatus(s._id, false); reload(); }
    catch (err) { setError(errMsg(err, 'Could not unsubscribe.')); }
    finally { setBusyId(null); }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setBusyId(removeTarget._id);
    try { await apiDeletePlatformSubscriber(removeTarget._id); setRemoveTarget(null); reload(); }
    catch (err) { setError(errMsg(err, 'Could not remove subscriber.')); }
    finally { setBusyId(null); }
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
      render: s => s.status === 'subscribed' ? <Badge color="green" dot>Subscribed</Badge>
        : s.status === 'pending' ? <Badge color="yellow" dot>Awaiting confirmation</Badge>
        : <Badge color="gray" dot>Unsubscribed</Badge>,
    },
    { key: 'source', header: 'Source', render: s => <span className="text-slate">{SUBSCRIBER_SOURCE_LABEL[s.source] ?? s.source}</span> },
    {
      key: 'consentAt', header: 'Date',
      render: s => <span className="text-slate">{s.status === 'subscribed' ? fmtSubscriberDate(s.consentAt) : `Left ${fmtSubscriberDate(s.unsubscribedAt)}`}</span>,
    },
    {
      key: 'actions', header: '', align: 'right',
      render: s => (
        <div className="flex items-center justify-end gap-3">
          {s.status === 'subscribed' && (
            <button disabled={busyId === s._id} onClick={() => handleUnsubscribe(s)}
              className="text-xs font-medium text-brand-orange bg-transparent border-none cursor-pointer disabled:opacity-50">
              Unsubscribe
            </button>
          )}
          <button aria-label={`Remove ${s.email}`} disabled={busyId === s._id} onClick={() => setRemoveTarget(s)}
            className="text-slate hover:text-error bg-transparent border-none cursor-pointer disabled:opacity-50">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-3">
        <MetricCard label="Subscribed" value={(summary?.active ?? 0).toLocaleString()} icon={<MailCheck size={16} />} loading={firstLoad} />
        <MetricCard label="New in last 30 days" value={(summary?.newLast30Days ?? 0).toLocaleString()} icon={<Mail size={16} />} loading={firstLoad} />
        <MetricCard label="Unsubscribed" value={(summary?.unsubscribed ?? 0).toLocaleString()} icon={<MailX size={16} />} loading={firstLoad} />
      </div>

      <div className="bg-white border border-bone rounded-[10px] min-w-0 overflow-hidden">
        <TabBar
          tabs={[
            { id: 'active', label: 'Subscribed', count: summary?.active },
            { id: 'unsubscribed', label: 'Unsubscribed', count: summary?.unsubscribed },
            { id: 'all', label: 'All' },
          ]}
          active={status}
          onChange={id => { setStatus(id as SubscriberStatusFilter); setPage(1); }}
        />
        <div className="px-5 py-3.5 border-b border-bone flex flex-wrap items-center gap-2.5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by email…" className="max-w-[240px]" />
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
              title: 'No subscribers here',
              description: 'Merchants and prospects who sign up in the footer of the Solvexo website show up here.',
            }}
          />
        )}
      </div>

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
            <span className="font-semibold">{removeTarget.email}</span> will be deleted from the list, including their consent record.
          </p>
        </Modal>
      )}
    </div>
  );
}

// ── Broadcasts tab ──────────────────────────────────────────────────────────

const BROADCAST_STATUS: Record<NewsletterBroadcast['status'], { label: string; color: 'green' | 'orange' | 'red' }> = {
  sending: { label: 'Sending', color: 'orange' },
  sent:    { label: 'Sent',    color: 'green' },
  failed:  { label: 'Failed',  color: 'red' },
};

function BroadcastsTab({ activeSubscribers }: { activeSubscribers: number | null }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<NewsletterBroadcast[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = useCallback(() => {
    apiListBroadcasts()
      .then(res => setHistory(res.data ?? []))
      .catch(() => { /* history is secondary — the compose form still works */ })
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Counters fill in server-side while a broadcast is going out.
  const anySending = history.some(b => b.status === 'sending');
  useEffect(() => {
    if (!anySending) return;
    const t = setInterval(loadHistory, 5000);
    return () => clearInterval(t);
  }, [anySending, loadHistory]);

  const canSend = subject.trim() && message.trim();

  const handleTest = async () => {
    if (!canSend || !testEmail.trim()) return;
    setTesting(true); setError(''); setNotice('');
    try {
      const res = await apiSendBroadcast(subject.trim(), message, testEmail.trim());
      if (res.success) setNotice(res.message || `Test sent to ${testEmail}`);
      else setError(res.message || 'Test email failed to send.');
    } catch (err) {
      setError(errMsg(err, 'Test email failed to send.'));
    } finally { setTesting(false); }
  };

  const handleSend = async () => {
    setSending(true); setError(''); setNotice('');
    try {
      const res = await apiSendBroadcast(subject.trim(), message);
      setNotice(res.message || 'Broadcast is sending.');
      setSubject(''); setMessage('');
      setConfirmOpen(false);
      loadHistory();
    } catch (err) {
      setError(errMsg(err, 'Broadcast failed to start.'));
      setConfirmOpen(false);
    } finally { setSending(false); }
  };

  const columns: TableColumn<NewsletterBroadcast>[] = [
    { key: 'subject', header: 'Subject', render: b => <span className="text-[13px] font-medium text-carbon">{b.subject}</span> },
    { key: 'status', header: 'Status', render: b => <Badge color={BROADCAST_STATUS[b.status].color}>{BROADCAST_STATUS[b.status].label}</Badge> },
    { key: 'recipientCount', header: 'Recipients', align: 'right', render: b => b.recipientCount.toLocaleString() },
    { key: 'sentCount', header: 'Sent', align: 'right', render: b => b.sentCount.toLocaleString() },
    { key: 'failedCount', header: 'Failed', align: 'right', render: b => <span className={b.failedCount ? 'text-error' : 'text-slate'}>{b.failedCount.toLocaleString()}</span> },
    { key: 'createdAt', header: 'Date', render: b => <span className="text-slate">{fmtSubscriberDate(b.createdAt)}</span> },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white border border-bone rounded-[10px] px-5 py-5 flex flex-col gap-4">
        <div>
          <p className="text-[14px] font-bold text-carbon">New broadcast</p>
          <p className="text-[12px] text-slate mt-[2px]">
            Goes to every active subscriber of the Solvexo list{activeSubscribers !== null ? ` (${activeSubscribers.toLocaleString()} right now)` : ''} — product updates, new features, merchant offers. Every email includes an unsubscribe link.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="broadcast-subject" className="text-[12px] font-medium text-charcoal">Subject</label>
          <input id="broadcast-subject" value={subject} onChange={e => setSubject(e.target.value)} maxLength={200} className={inputCls} placeholder="What's new at Solvexo this month" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="broadcast-message" className="text-[12px] font-medium text-charcoal">Message</label>
          <textarea id="broadcast-message" value={message} onChange={e => setMessage(e.target.value)} rows={9} className={`${inputCls} resize-y`}
            placeholder={'Hi there,\n\nWe just launched…'} />
          <p className="text-[11px] text-slate">Plain text — leave a blank line between paragraphs.</p>
        </div>

        {notice && <p className="text-[12.5px] text-success">{notice}</p>}
        {error && <p className="text-[12.5px] text-error">{error}</p>}

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="flex gap-2 flex-1 min-w-0">
            <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="you@solvexo.store" className={`${inputCls} sm:max-w-[240px]`} aria-label="Test email address" />
            <Button size="sm" variant="outline" loading={testing} disabled={!canSend || !testEmail.trim()} onClick={handleTest}>Send test</Button>
          </div>
          <Button size="sm" icon={<Send size={13} />} disabled={!canSend || activeSubscribers === 0} onClick={() => setConfirmOpen(true)}>
            Send to all subscribers
          </Button>
        </div>
      </div>

      <div className="bg-white border border-bone rounded-[10px] min-w-0 overflow-hidden">
        <p className="px-5 py-3.5 border-b border-bone text-[13px] font-semibold text-carbon">History</p>
        <Table
          columns={columns}
          data={history}
          keyExtractor={b => b._id}
          loading={historyLoading}
          emptyState={{ icon: <Send size={26} className="text-brand-orange opacity-55" />, title: 'No broadcasts yet', description: 'Broadcasts you send show up here with delivery counts.' }}
        />
      </div>

      {confirmOpen && (
        <Modal
          title="Send broadcast?"
          onClose={() => { if (!sending) setConfirmOpen(false); }}
          footer={
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" disabled={sending} onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button size="sm" loading={sending} onClick={handleSend}>Send now</Button>
            </div>
          }
        >
          <p className="text-[13px] text-charcoal">
            "{subject}" will be emailed to {activeSubscribers !== null ? activeSubscribers.toLocaleString() : 'all'} subscriber(s). This can't be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

/** Solvexo's own email list — merchants and prospects who subscribed on the
 *  Solvexo website (not any store's shoppers; those belong to each store). */
export function AdminNewsletter() {
  usePageTitle('Newsletter');
  const [tab, setTab] = useState<'subscribers' | 'broadcasts'>('subscribers');
  const [activeSubscribers, setActiveSubscribers] = useState<number | null>(null);

  return (
    <div>
      <AdminPageHeader title="Newsletter" subtitle="People who subscribed on the Solvexo website, and broadcasts to them." />
      <div className="px-4 sm:px-7 pt-5 pb-8 flex flex-col gap-5">
        <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
          <TabBar
            tabs={[{ id: 'subscribers', label: 'Subscribers' }, { id: 'broadcasts', label: 'Broadcasts' }]}
            active={tab}
            onChange={id => setTab(id as 'subscribers' | 'broadcasts')}
          />
        </div>
        {/* Both stay mounted so switching tabs keeps filters and a half-written draft. */}
        <div className={tab === 'subscribers' ? '' : 'hidden'}><SubscribersTab onSummary={setActiveSubscribers} /></div>
        <div className={tab === 'broadcasts' ? '' : 'hidden'}><BroadcastsTab activeSubscribers={activeSubscribers} /></div>
      </div>
    </div>
  );
}
