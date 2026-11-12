import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerPage, PER_PAGE_OPTIONS } from '@/hooks/usePerPage';
import { Bell, Download, Info, ShieldCheck } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import { useToast } from '@/contexts/ToastContext';
import { can } from '@/hooks/auth/useCan';
import {
  AdminPageHeader, Badge, Button, FilterDropdown, Input, MetricCard, SearchInput, Table, type TableColumn,
} from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import {
  apiExportSellerTrustStores, apiGetSellerTrustSummary, apiListSellerTrustStores, apiTrustRemind, apiUpdateSellerTrustSettings,
  type RiskLevel, type SellerTrustListData, type SellerTrustQuery, type SellerTrustRow, type SellerTrustSummary,
  type VerificationStatus, type YesNo,
} from '@/api/services/admin/adminSellerTrust';
import { NtnValue, RiskPill, VerificationPill } from './sellerTrust/TrustBits';
import {
  BUSINESS_TYPE, COUNTRY_OPTIONS, RISK_OPTIONS, VERIFICATION_OPTIONS, countryName, fmtDate, regulatedList, relativeDays,
} from './sellerTrust/trust.utils';

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

const NTN_OPTIONS = [{ value: 'yes', label: 'Has NTN / tax no.' }, { value: 'no', label: 'No NTN / tax no.' }];
const LIMITED_OPTIONS = [{ value: 'yes', label: 'Limited now' }, { value: 'no', label: 'Not limited' }];
const SORT_OPTIONS = [
  { value: 'risk', label: 'Highest risk first' },
  { value: 'submitted', label: 'Oldest submission first' },
  { value: 'created', label: 'Newest stores first' },
];

type View = 'all' | 'queue';

// ── Progress bar segments: always a word next to the colour. ─────────────────
const PROGRESS: { key: string; label: string; bar: string; count: (s: SellerTrustSummary) => number }[] = [
  { key: 'verified', label: 'verified', bar: 'bg-success', count: s => s.byStatus.verified ?? 0 },
  { key: 'waiting', label: 'waiting', bar: 'bg-info', count: s => (s.byStatus.pending ?? 0) + (s.byStatus.under_review ?? 0) },
  { key: 'needs_info', label: 'need more info', bar: 'bg-warning', count: s => s.byStatus.needs_info ?? 0 },
  { key: 'rejected', label: 'rejected', bar: 'bg-error', count: s => s.byStatus.rejected ?? 0 },
  { key: 'not_started', label: 'not started', bar: 'bg-bone', count: s => s.byStatus.not_started ?? 0 },
];

function VerificationProgress({ summary }: { summary: SellerTrustSummary }) {
  const total = Math.max(summary.totalStores, 1);
  return (
    <section className="bg-white border border-bone rounded-[10px] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13.5px] font-semibold text-charcoal">Verification progress</h2>
        <span className="text-[12px] text-slate">{summary.totalStores} stores</span>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-fog" role="img" aria-label={PROGRESS.map(p => `${p.count(summary)} ${p.label}`).join(', ')}>
        {PROGRESS.map(p => {
          const n = p.count(summary);
          return n > 0 ? <div key={p.key} className={p.bar} style={{ width: `${(n / total) * 100}%` }} /> : null;
        })}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-graphite">
        {PROGRESS.map(p => (
          <li key={p.key} className="inline-flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${p.bar}`} aria-hidden />
            <strong className="text-charcoal">{p.count(summary)}</strong> {p.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Enforcement switch: start / stop with an inline confirm, grace days. ────
function EnforcementPanel({ summary, canManage, onChanged }: { summary: SellerTrustSummary; canManage: boolean; onChanged: () => void }) {
  const toast = useToast();
  const e = summary.enforcement;
  const started = !!e.startedAt;
  const [graceDays, setGraceDays] = useState(String(e.graceDays ?? 30));
  const [confirm, setConfirm] = useState<'start' | 'stop' | null>(null);
  const [saving, setSaving] = useState(false);
  const [now] = useState(() => Date.now());

  const days = Number(graceDays);
  const validDays = Number.isInteger(days) && days >= 0 && days <= 365;
  const previewDue = new Date(now + (validDays ? days : 30) * 86_400_000).toISOString();

  async function save(patch: Parameters<typeof apiUpdateSellerTrustSettings>[0], done: string) {
    setSaving(true);
    try {
      await apiUpdateSellerTrustSettings(patch);
      toast.success(done);
      setConfirm(null);
      onChanged();
    } catch (err) {
      toast.error(errMsg(err, 'Could not update enforcement.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-white border border-bone rounded-[10px] p-5 flex flex-col gap-3" aria-label="Enforcement">
      <div className="flex items-center gap-2 flex-wrap">
        <ShieldCheck size={15} className="text-brand-orange" />
        <h2 className="text-[13.5px] font-semibold text-charcoal">Enforcement</h2>
        <Badge color={started ? 'green' : 'gray'} size="sm" dot>{started ? 'On' : 'Off'}</Badge>
      </div>
      {started ? (
        <p className="text-[12.5px] text-graphite leading-[1.6]">
          Started {fmtDate(e.startedAt)}. Existing stores have {e.graceDays} days, so the first deadline is <strong>{fmtDate(e.firstDueAt)}</strong>.
          Stores created after the start are limited until verified. Limited stores are hidden from the marketplace, get no badge and their payouts are held; their own store and cash on delivery keep working.
        </p>
      ) : (
        <p className="text-[12.5px] text-graphite leading-[1.6]">
          Off: nothing is limited and there are no deadlines. When you start, existing stores get the grace period to verify; new stores are limited until verified.
        </p>
      )}

      {canManage && (
        <div className="flex items-end gap-2 flex-wrap">
          <div className="w-[130px]">
            <Input label="Grace days" type="number" min={0} max={365} value={graceDays} onChange={ev => setGraceDays(ev.target.value)} error={validDays ? undefined : '0 to 365'} />
          </div>
          {started && Number(graceDays) !== e.graceDays && (
            <Button size="sm" variant="outline" disabled={!validDays} loading={saving && confirm === null} onClick={() => save({ graceDays: days }, 'Grace period updated.')}>Save grace days</Button>
          )}
          {confirm === null && (
            started
              ? <Button size="sm" variant="ghost" onClick={() => setConfirm('stop')}>Stop enforcement</Button>
              : <Button size="sm" variant="primary" disabled={!validDays} onClick={() => setConfirm('start')}>Start enforcement</Button>
          )}
        </div>
      )}

      {confirm && (
        <div role="alertdialog" aria-label={confirm === 'start' ? 'Confirm start' : 'Confirm stop'} className="rounded-lg border border-warning/30 bg-warning-bg px-4 py-3 flex flex-col gap-2">
          <p className="text-[12.5px] text-charcoal leading-[1.6]">
            {confirm === 'start'
              ? <>Start enforcement now? Existing stores must verify by <strong>{fmtDate(previewDue)}</strong> ({days} days). Every store created from now on is limited until it is verified. Send reminders afterwards so sellers know.</>
              : <>Stop enforcement? All deadlines are cleared and no store is limited any more. Payout holds you set by hand stay as they are.</>}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant={confirm === 'start' ? 'primary' : 'danger'} loading={saving}
              onClick={() => (confirm === 'start'
                ? save({ enforcementStartedAt: 'now', graceDays: days }, 'Enforcement started.')
                : save({ enforcementStartedAt: null }, 'Enforcement stopped.'))}>
              {confirm === 'start' ? 'Yes, start now' : 'Yes, stop'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Super Admin → Seller trust: audit of every store's verification, review queue, reminders and the enforcement switch. */
export function AdminSellerTrust() {
  usePageTitle('Seller trust');
  const navigate = useNavigate();
  const toast = useToast();
  const canManage = can('marketplace.manage');

  const summaryQ = useAnalyticsQuery(() => apiGetSellerTrustSummary(), {});

  const [view, setView] = useState<View>('all');
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [ntn, setNtn] = useState('');
  const [status, setStatus] = useState('');
  const [risk, setRisk] = useState('');
  const [limited, setLimited] = useState('');
  const [sort, setSort] = useState<NonNullable<SellerTrustQuery['sort']>>('risk');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = usePerPage('admin-seller-trust');
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [confirmRemindAll, setConfirmRemindAll] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filter = useMemo(() => ({
    search: search.trim() || undefined,
    country: country || undefined,
    ntn: (ntn || undefined) as YesNo | undefined,
    status: (view === 'queue' ? 'pending' : status || undefined) as VerificationStatus | undefined,
    risk: (risk || undefined) as RiskLevel | undefined,
    limited: (limited || undefined) as YesNo | undefined,
  }), [search, country, ntn, status, risk, limited, view]);
  const effectiveSort = view === 'queue' ? 'submitted' : sort;

  const [list, setList] = useState<SellerTrustListData | null>(null);
  const [listError, setListError] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const loadList = useCallback(() => {
    setListLoading(true); setListError('');
    apiListSellerTrustStores({ ...filter, sort: effectiveSort, page, limit: perPage })
      .then(r => setList(r.data))
      .catch(e => setListError(errMsg(e, 'Could not load stores.')))
      .finally(() => setListLoading(false));
  }, [filter, effectiveSort, page, perPage]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadList(); }, [loadList]);

  const refreshAll = useCallback(() => { summaryQ.refetch(); loadList(); }, [summaryQ, loadList]);
  const setF = (set: (v: string) => void) => (v: string) => { set(v); setPage(1); setSelected(new Set()); };

  async function remind(body: Parameters<typeof apiTrustRemind>[0]) {
    setReminding(true);
    try {
      const r = await apiTrustRemind(body);
      const { sent = 0, skipped = 0 } = r.data ?? {};
      toast.success(`Reminders sent: ${sent}. Skipped: ${skipped} (verified or reminded in the last 24 hours).`);
      setSelected(new Set());
      setConfirmRemindAll(false);
      loadList();
    } catch (e) {
      toast.error(errMsg(e, 'Could not send reminders.'));
    } finally {
      setReminding(false);
    }
  }

  async function exportCsv() {
    setExporting(true);
    try { await apiExportSellerTrustStores({ ...filter, sort: effectiveSort }); } catch (e) { toast.error(errMsg(e, 'Export failed.')); } finally { setExporting(false); }
  }

  const s = summaryQ.data;
  const columns: TableColumn<SellerTrustRow>[] = [
    {
      key: 'store', header: 'Store',
      render: r => (
        <div className="min-w-0 max-w-[260px]" title={r.sellerEmail ?? undefined}>
          <p className="text-[12.5px] font-semibold text-charcoal truncate">{r.storeName}</p>
          <p className="text-[11px] text-slate truncate">{r.sellerName || r.sellerEmail || '—'}</p>
          <p className="text-[11px] text-slate truncate tabular-nums">{r.sellerPhone || 'No phone'}</p>
          {r.payoutHold?.active && <Badge color="red" size="sm" className="mt-1">Payouts held</Badge>}
        </div>
      ),
    },
    { key: 'country', header: 'Country', render: r => <span className="text-[12px] text-graphite whitespace-nowrap">{countryName(r.country)}</span> },
    { key: 'ntn', header: 'NTN', render: r => <NtnValue hasNtn={r.hasNtn} ntn={r.ntn} /> },
    { key: 'verification', header: 'Verification', render: r => <VerificationPill status={r.verificationStatus} dueAt={r.dueAt} /> },
    { key: 'risk', header: 'Risk', render: r => <RiskPill level={r.riskLevel} /> },
    { key: 'sells', header: 'Sells', render: r => <span className="text-[12px] text-graphite">{regulatedList(r.categories) || '—'}</span> },
    {
      key: 'submitted', header: view === 'queue' ? 'Submitted' : 'Type',
      render: r => <span className="text-[12px] text-slate whitespace-nowrap">{view === 'queue' ? relativeDays(r.submittedAt) : (r.businessType ? BUSINESS_TYPE[r.businessType] : '—')}</span>,
    },
  ];

  return (
    <>
      <AdminPageHeader title="Seller trust" subtitle="Business verification for every store: who has an NTN, who is verified, who is risky, and the review queue." />
      <div className="px-4 sm:px-7 pt-6 pb-8 flex flex-col gap-5">
        {summaryQ.error ? (
          <AnalyticsErrorState message={summaryQ.error} onRetry={summaryQ.refetch} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <MetricCard label="Registered businesses" value={s ? s.totalStores : ''} loading={!s} />
            <MetricCard label="Have an NTN" value={s ? s.withNtn : ''} sub={s ? `${s.withoutNtn} missing` : undefined} loading={!s} />
            <MetricCard label="Verified" value={s ? s.byStatus.verified ?? 0 : ''} loading={!s} />
            <MetricCard label="Waiting for review" value={s ? s.waitingReview : ''} loading={!s} />
            <MetricCard label="High risk" value={s ? s.highRisk : ''} sub={s ? `${s.mediumRisk} medium` : undefined} loading={!s} />
            <MetricCard label="Deadline passed" value={s ? s.deadlinePassed : ''} sub={s ? (s.enforcement.firstDueAt ? `First deadline ${fmtDate(s.enforcement.firstDueAt)}` : 'Enforcement off') : undefined} loading={!s} />
          </div>
        )}

        {s && (
          <div className="grid lg:grid-cols-2 gap-4">
            <VerificationProgress summary={s} />
            <EnforcementPanel key={`${s.enforcement.startedAt}-${s.enforcement.graceDays}`} summary={s} canManage={canManage} onChanged={refreshAll} />
          </div>
        )}

        <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
          <div className="flex items-center gap-[10px] px-5 py-[14px] border-b border-bone flex-wrap">
            <div role="group" aria-label="View" className="inline-flex rounded-lg border border-bone p-0.5 text-[12px]">
              {([['all', 'All stores'], ['queue', `Review queue${s ? ` (${s.waitingReview})` : ''}`]] as [View, string][]).map(([id, label]) => (
                <button key={id} type="button" aria-pressed={view === id} onClick={() => { setView(id); setPage(1); setSelected(new Set()); }}
                  className={`px-2.5 py-1 rounded-md cursor-pointer border-none ${view === id ? 'bg-charcoal text-white' : 'bg-transparent text-slate hover:text-charcoal'}`}>
                  {label}
                </button>
              ))}
            </div>
            <SearchInput value={search} onChange={setF(setSearch)} placeholder="Store, seller, email, phone or NTN…" className="flex-1 min-w-[180px] max-w-[280px]" />
            <FilterDropdown placeholder="All countries" options={COUNTRY_OPTIONS} value={country} onChange={setF(setCountry)} />
            <FilterDropdown placeholder="NTN: any" options={NTN_OPTIONS} value={ntn} onChange={setF(setNtn)} />
            {view === 'all' && <FilterDropdown placeholder="Verification: any" options={VERIFICATION_OPTIONS} value={status} onChange={setF(setStatus)} />}
            <FilterDropdown placeholder="Risk: any" options={RISK_OPTIONS} value={risk} onChange={setF(setRisk)} />
            <FilterDropdown placeholder="Limited: any" options={LIMITED_OPTIONS} value={limited} onChange={setF(setLimited)} />
            {view === 'all' && <FilterDropdown options={SORT_OPTIONS} value={sort} onChange={v => { setSort(v as typeof sort); setPage(1); }} />}
            <div className="ml-auto flex items-center gap-2">
              {canManage && (
                <Button size="sm" variant="outline" icon={<Bell size={13} />} disabled={!list?.total} onClick={() => setConfirmRemindAll(true)}>
                  Remind all matching
                </Button>
              )}
              <Button size="sm" variant="outline" icon={<Download size={13} />} loading={exporting} onClick={exportCsv}>Export CSV</Button>
            </div>
          </div>

          {confirmRemindAll && (
            <div role="alertdialog" aria-label="Confirm reminders" className="mx-5 mt-4 rounded-lg border border-warning/30 bg-warning-bg px-4 py-3 flex items-center gap-3 flex-wrap">
              <p className="text-[12.5px] text-charcoal flex-1 min-w-[240px]">
                Send an email and in-app reminder to every unverified store matching these filters ({list?.total ?? 0})? Stores reminded in the last 24 hours are skipped.
              </p>
              <Button size="sm" variant="primary" loading={reminding} onClick={() => remind({ filter })}>Send reminders</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmRemindAll(false)}>Cancel</Button>
            </div>
          )}

          {listError && !list ? (
            <div className="p-5"><AnalyticsErrorState message={listError} onRetry={loadList} /></div>
          ) : (
            <Table
              columns={columns}
              data={list?.items ?? []}
              keyExtractor={r => r.storeId}
              loading={listLoading}
              onRowClick={r => navigate(`/admin/seller-trust/${r.storeId}`)}
              selectable={canManage}
              selectedKeys={selected}
              onSelectionChange={setSelected}
              bulkActions={keys => (
                <Button size="sm" variant="primary" icon={<Bell size={13} />} loading={reminding} onClick={() => remind({ storeIds: [...keys].map(String) })}>
                  Send reminder ({keys.size})
                </Button>
              )}
              emptyState={{
                icon: <ShieldCheck size={28} className="text-slate/50" />,
                title: view === 'queue' ? 'Nothing waiting for review' : 'No stores match',
                description: view === 'queue' ? 'New submissions appear here, oldest first.' : 'Try another filter or search.',
              }}
              pagination={{ page, total: list?.total ?? 0, perPage, onChange: p => { setPage(p); setSelected(new Set()); }, label: 'stores', perPageOptions: PER_PAGE_OPTIONS, onPerPageChange: n => { setPerPage(n); setPage(1); setSelected(new Set()); } }}
            />
          )}
        </div>

        <p className="flex items-start gap-2 text-[11.5px] text-slate bg-cream border border-bone rounded-lg px-3 py-2">
          <Info size={13} className="shrink-0 mt-px" />
          <span>
            Unverified stores are limited, not blocked: after their deadline they are hidden from the Solvexo marketplace, get no Verified badge and
            payouts of online payments are held. Their own store, POS and cash on delivery keep working. Risk updates by itself from verification,
            licences, refunds and buyer reports.
          </span>
        </p>
      </div>
    </>
  );
}
