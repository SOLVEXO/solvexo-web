import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { CloudUpload, Download, MapPin, Plus, Store, Trash2 } from 'lucide-react';
import { Badge, Button, EmptyState, MetricCard, Modal, SearchInput, Select } from '@/components/comman/ui';
import { apiListVisits, apiVisitAreas, type SalesVisit, type VisitList, type VisitQuery } from '@/api/services/salesVisits';
import type { SalesOwner } from '@/api/services/salesOps';
import { VISIT_OPTIONS, optionLabel, optionLabels } from './visitOptions';
import { INTEREST_COLOR, periodStart, visitDate as date, visitWhere as where, visitsToCsv, type Period } from './visitsReport';
import { QUEUE_EVENT, discardQueued, queuedVisits, retryQueued, syncQueuedVisits, type QueuedVisit } from './visitQueue';
import { errMsg, useStableToast } from '../sales.utils';

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Super Admin → Sales Ops → Visits: field visits with filters, totals and CSV; the phone queue of unsent visits on top. */
export function VisitsTab({ isManager, owners }: { isManager: boolean; owners: SalesOwner[] }) {
  const toast = useStableToast();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('week');
  const [filters, setFilters] = useState<Omit<VisitQuery, 'from' | 'page' | 'limit'>>({});
  const [data, setData] = useState<VisitList | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [open, setOpen] = useState<SalesVisit | null>(null);
  const [queue, setQueue] = useState<QueuedVisit[]>(queuedVisits);
  const [syncing, setSyncing] = useState(false);
  const [tick, setTick] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  useEffect(() => { const id = setTimeout(() => setFilters(f => ({ ...f, q: search.trim() || undefined })), 400); return () => clearTimeout(id); }, [search]);

  const query = useCallback((extra: Partial<VisitQuery> = {}): VisitQuery => {
    const from = periodStart(period);
    return { ...filters, ...(from ? { from: from.toISOString() } : {}), ...extra };
  }, [period, filters]);

  useEffect(() => {
    let cancelled = false;
    apiListVisits(query({ limit: 100 })).then(r => { if (!cancelled) setData(r.data); })
      .catch(e => { if (!cancelled) { setData({ items: [], total: 0, page: 1, limit: 100, summary: { visits: 0, shops: 0, hot: 0, demos: 0, signups: 0 } }); toast.error(errMsg(e, 'Could not load visits.')); } });
    return () => { cancelled = true; };
  }, [query, tick, toast]);
  useEffect(() => { apiVisitAreas().then(r => setAreas(r.data)).catch(() => setAreas([])); }, [tick]);
  useEffect(() => {
    const q = () => setQueue(queuedVisits());
    window.addEventListener(QUEUE_EVENT, q);
    return () => window.removeEventListener(QUEUE_EVENT, q);
  }, []);

  const syncNow = async () => {
    setSyncing(true);
    const r = await syncQueuedVisits();
    setSyncing(false);
    setQueue(queuedVisits());
    if (r.sent) { toast.success(`${r.sent} visit${r.sent === 1 ? '' : 's'} uploaded.`); setTick(x => x + 1); }
    else if (r.waiting && !r.failed) toast.info('Still no connection. The visits stay on this phone.');
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = (await apiListVisits(query({ limit: 2000 }))).data.items;
      download(`visits-${new Date().toISOString().slice(0, 10)}.csv`, visitsToCsv(all));
    } catch (e) { toast.error(errMsg(e, 'Could not export.')); }
    setExporting(false);
  };

  const s = data?.summary;
  return (
    <div className="flex flex-col gap-5">
      {queue.length > 0 && (
        <section className="rounded-xl border border-warning/40 bg-warning-bg p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-charcoal">{queue.length} visit{queue.length === 1 ? '' : 's'} saved on this phone, not uploaded yet</p>
            <Button size="sm" variant="outline" icon={<CloudUpload size={14} />} loading={syncing} onClick={() => void syncNow()}>Upload now</Button>
          </div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {queue.map(q => (
              <li key={q.input.clientId} className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
                <span className="text-charcoal">{q.input.storeName} <span className="text-slate">· {date(q.input.visitedAt)}</span>
                  {q.error && <span className="block text-error">Not accepted: {q.error}</span>}</span>
                {q.error && (
                  <span className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => retryQueued(q.input.clientId)}>Try again</Button>
                    <Button size="sm" variant="ghost" icon={<Trash2 size={13} />} onClick={() => discardQueued(q.input.clientId)}>Discard</Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Visits" value={s?.visits ?? 0} sub={s ? `${s.shops} shop${s.shops === 1 ? '' : 's'}` : undefined} loading={!data} />
        <MetricCard label="Hot leads" value={s?.hot ?? 0} loading={!data} />
        <MetricCard label="Demos booked" value={s?.demos ?? 0} loading={!data} />
        <MetricCard label="Sign-ups agreed" value={s?.signups ?? 0} loading={!data} />
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="w-[calc(50%-4px)] sm:w-36"><Select aria-label="Period" value={period} onChange={e => setPeriod(e.target.value as Period)}>
          <option value="today">Today</option><option value="week">This week</option><option value="month">This month</option><option value="all">All time</option>
        </Select></div>
        {isManager && <div className="w-[calc(50%-4px)] sm:w-40"><Select aria-label="Rep" value={filters.rep ?? ''} onChange={e => setFilters(f => ({ ...f, rep: e.target.value || undefined }))}>
          <option value="">All reps</option><option value="me">Mine</option>{owners.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
        </Select></div>}
        <div className="w-[calc(50%-4px)] sm:w-44"><Select aria-label="Area" value={filters.area ?? ''} onChange={e => setFilters(f => ({ ...f, area: e.target.value || undefined }))}>
          <option value="">All areas</option>{areas.map(a => <option key={a} value={a}>{a}</option>)}
        </Select></div>
        <div className="w-[calc(50%-4px)] sm:w-40"><Select aria-label="Interest" value={filters.interest ?? ''} onChange={e => setFilters(f => ({ ...f, interest: e.target.value || undefined }))}>
          <option value="">Any interest</option>{VISIT_OPTIONS.interest.map(o => <option key={o.key} value={o.key}>{optionLabel('interest', o.key)}</option>)}
        </Select></div>
        <div className="w-full sm:w-56"><SearchInput placeholder="Shop, contact, number" aria-label="Search visits" value={search} onChange={setSearch} /></div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" icon={<Download size={14} />} loading={exporting} disabled={!data?.total} onClick={() => void exportCsv()}>Export CSV</Button>
          <Button icon={<Plus size={14} />} onClick={() => navigate('/admin/sales/visits/new')}>New visit</Button>
        </div>
      </div>

      {!data ? <div className="h-48 rounded-xl bg-cream animate-pulse" /> : !data.items.length ? (
        <EmptyState icon={<Store size={28} />} title="No visits here yet" description="Visits your team saves from the shop floor show up here. Open New visit on a phone to log one." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-bone bg-white">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead><tr className="border-b border-bone text-left text-[11px] uppercase tracking-wide text-slate">
              <th className="px-3 py-2 font-semibold">Date</th><th className="px-3 py-2 font-semibold">Shop</th><th className="px-3 py-2 font-semibold">Area</th>
              <th className="px-3 py-2 font-semibold">Category</th><th className="px-3 py-2 font-semibold">Sells on</th><th className="px-3 py-2 font-semibold">Interest</th>
              <th className="px-3 py-2 font-semibold">Next step</th>{isManager && <th className="px-3 py-2 font-semibold">Rep</th>}
            </tr></thead>
            <tbody>
              {data.items.map(v => (
                <tr key={v._id} onClick={() => setOpen(v)} className="cursor-pointer border-b border-bone align-top last:border-0 hover:bg-fog">
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate">{date(v.visitedAt)}</td>
                  <td className="px-3 py-2.5"><button type="button" className="text-left font-medium text-charcoal hover:underline" onClick={e => { e.stopPropagation(); setOpen(v); }}>{v.storeName}</button>
                    {where(v) && <span className="block text-[11.5px] text-slate">{where(v)}</span>}</td>
                  <td className="px-3 py-2.5">{v.area ?? '—'}</td>
                  <td className="px-3 py-2.5">{(v.category === 'other' ? v.categoryOther : optionLabel('category', v.category)) || '—'}</td>
                  <td className="px-3 py-2.5">{optionLabels('sellsOn', v.sellsOn) || '—'}</td>
                  <td className="px-3 py-2.5"><Badge size="sm" color={INTEREST_COLOR[v.interest] ?? 'gray'}>{optionLabel('interest', v.interest)}</Badge></td>
                  <td className="whitespace-nowrap px-3 py-2.5">{optionLabel('nextStep', v.nextStep)}{v.nextStepAt && <span className="text-slate"> · {date(v.nextStepAt)}</span>}</td>
                  {isManager && <td className="whitespace-nowrap px-3 py-2.5">{v.adminName ?? '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          {data.total > data.items.length && <p className="border-t border-bone px-3 py-2 text-[12px] text-slate">Showing the latest {data.items.length} of {data.total}. Export CSV for all of them.</p>}
        </div>
      )}

      {open && <VisitDetail visit={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return <div className="grid grid-cols-[140px_1fr] gap-3 py-1.5 text-[13px]"><dt className="text-slate">{label}</dt><dd className="min-w-0 break-words text-charcoal">{value}</dd></div>;
}

function VisitDetail({ visit: v, onClose }: { visit: SalesVisit; onClose: () => void }) {
  const billing = v.billing === 'software' && v.billingSoftware ? `Software: ${v.billingSoftware}` : optionLabel('billing', v.billing);
  return (
    <Modal title={v.storeName} onClose={onClose} width={560}
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Close</Button><Link to={`/admin/sales/leads/${v.leadId}`}><Button>Open lead</Button></Link></div>}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-slate">
          <Badge size="sm" color={INTEREST_COLOR[v.interest] ?? 'gray'}>{optionLabel('interest', v.interest)}</Badge>
          <span>{new Date(v.visitedAt).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
          {v.adminName && <span>· {v.adminName}</span>}
          {v.location && (
            <a className="inline-flex items-center gap-1 text-brand-deep-orange hover:underline" target="_blank" rel="noreferrer"
              href={`https://www.google.com/maps?q=${v.location.lat},${v.location.lng}`}><MapPin size={12} />Map</a>
          )}
        </div>
        {v.photoUrl && <img src={v.photoUrl} alt={`${v.storeName} shopfront`} className="max-h-56 w-full rounded-lg object-cover" />}
        <dl className={clsx('divide-y divide-bone')}>
          <Row label="Where" value={[where(v), v.area].filter(Boolean).join(' · ')} />
          <Row label="Category" value={[v.category === 'other' ? v.categoryOther : optionLabel('category', v.category), optionLabel('priceRange', v.priceRange), optionLabel('wholesale', v.wholesale)].filter(Boolean).join(' · ')} />
          <Row label="Contact" value={[v.contactName, v.contactRole ? `(${optionLabel('contactRole', v.contactRole)})` : ''].filter(Boolean).join(' ')} />
          <Row label="WhatsApp" value={v.whatsapp ? `${v.whatsapp}${v.waPermission ? ' · OK to message' : ' · no permission to message'}` : null} />
          <Row label="Best time" value={optionLabel('bestTime', v.bestTime)} />
          <Row label="Online" value={[v.instagram && `IG ${v.instagram}`, v.facebook && `FB ${v.facebook}`, v.website].filter(Boolean).join(' · ')} />
          <Row label="Sells on" value={optionLabels('sellsOn', v.sellsOn)} />
          <Row label="Online orders / month" value={optionLabel('ordersPerMonth', v.ordersPerMonth)} />
          <Row label="Payments" value={optionLabels('payments', v.payments)} />
          <Row label="Courier" value={[optionLabels('couriers', v.couriers), v.courierBooking ? `booked by ${optionLabel('courierBooking', v.courierBooking).toLowerCase()}` : ''].filter(Boolean).join(', ')} />
          <Row label="Billing / POS" value={billing} />
          <Row label="Khata" value={optionLabel('khata', v.khata)} />
          <Row label="Busy seasons" value={optionLabels('seasons', v.seasons)} />
          <Row label="Best sellers" value={v.bestSellers} />
          <Row label="Biggest problem" value={[v.problem ? `“${v.problem}”` : '', optionLabels('problemTags', v.problemTags)].filter(Boolean).join(' · ')} />
          <Row label="Objections" value={optionLabels('objections', v.objections)} />
          <Row label="Next step" value={[optionLabel('nextStep', v.nextStep), v.nextStepAt ? date(v.nextStepAt) : ''].filter(Boolean).join(' · ')} />
        </dl>
      </div>
    </Modal>
  );
}
