import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { CalendarClock, Columns3, Download, FileUp, List, MailQuestion, Plus, Target, Trash2, UserRoundSearch } from 'lucide-react';
import { AdminPageHeader } from '@/components/comman/ui/AdminPageHeader';
import { Badge, Button, EmptyState, Input, MetricCard, Modal, SearchInput, Select, TabBar, Textarea } from '@/components/comman/ui';
import { can } from '@/hooks/auth/useCan';
import {
  CONSENT_LABELS, LEAD_SOURCES, LEAD_STAGES, SOURCE_LABELS, STAGE_LABELS, apiAskMarketingConsent, apiChangeStage, apiCreateLead, apiExportBrevoCsv, apiSyncStalled,
  apiDeleteTemplate, apiListLeads, apiWaConversations, apiListTasks, apiListTemplates, apiSalesOwners, apiSaveTemplate, apiUpdateTask, formatPKR,
  type ConsentStatus, type LeadList, type LeadQuery, type LeadSource, type LeadStage, type SalesLead, type SalesOwner, type SalesTask, type SalesTemplate,
  MESSAGE_REASONS, MESSAGE_REASON_LABELS, reasonLabel, type MessageReason,
} from '@/api/services/salesOps';
import { ConsentBadge, LeadFormModal, LostReasonModal, StageBadge } from './parts';
import { ImportLeadsModal } from './ImportLeadsModal';
import { CampaignsTab } from './CampaignsTab';
import { TeamTab } from './TeamTab';
import { PartnersTab } from './PartnersTab';
import { AgentTab } from './AgentTab';
import { WhatsAppTab } from './WhatsAppTab';
import { BrevoTab } from './BrevoTab';
import { VisitsTab } from './visits/VisitsTab';
import { errMsg, isOverdue, relDay, useStableToast } from './sales.utils';

type TabId = 'pipeline' | 'visits' | 'tasks' | 'whatsapp' | 'brevo' | 'campaigns' | 'team' | 'partners' | 'agent' | 'templates';

/** Super Admin → Sales Ops: the lead pipeline, follow-up tasks and email templates. Reps see only their own leads. */
export function AdminSalesOps() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabId) || 'pipeline';
  const isManager = can('sales.manage');
  const [owners, setOwners] = useState<SalesOwner[]>([]);
  useEffect(() => { if (isManager) apiSalesOwners().then(r => setOwners(r.data)).catch(() => setOwners([])); }, [isManager]);
  // Unread WhatsApp messages for the tab's count. The WhatsApp tab reports it while open; on every other tab
  // it is checked here every 30 seconds (not while the browser tab is hidden), quietly: a failure keeps the last count.
  const [waUnread, setWaUnread] = useState(0);
  const onWhatsApp = tab === 'whatsapp';
  useEffect(() => {
    if (onWhatsApp) return;
    let live = true;
    const check = () => {
      if (document.visibilityState === 'hidden') return;
      apiWaConversations({}).then(r => { if (live) setWaUnread(r.counts?.unreadMessages ?? 0); }).catch(() => undefined);
    };
    check();
    const t = setInterval(check, 30_000);
    document.addEventListener('visibilitychange', check);
    return () => { live = false; clearInterval(t); document.removeEventListener('visibilitychange', check); };
  }, [onWhatsApp]);

  return (
    <>
      <AdminPageHeader title="Sales Ops" subtitle={isManager ? 'Every lead, follow-up and deal across the sales team.' : 'Your leads, follow-ups and deals.'} icon={<Target size={18} />} />
      <div className="px-4 sm:px-7 pt-2">
        <TabBar
          tabs={[{ id: 'pipeline', label: 'Pipeline' }, { id: 'visits', label: 'Visits' }, { id: 'tasks', label: 'Follow-ups' }, { id: 'whatsapp', label: 'WhatsApp', ...(waUnread ? { count: waUnread } : {}) }, { id: 'brevo', label: 'Brevo' }, ...(isManager ? [{ id: 'campaigns', label: 'Campaigns' }] : []), { id: 'team', label: 'Team' }, ...(isManager ? [{ id: 'partners', label: 'Partners' }, { id: 'agent', label: 'AI agent' }] : []), { id: 'templates', label: 'Email templates' }]}
          active={tab}
          onChange={id => setParams(id === 'pipeline' ? {} : { tab: id }, { replace: true })}
        />
      </div>
      <div className="px-4 sm:px-7 py-5">
        {tab === 'pipeline' && <PipelineTab owners={owners} isManager={isManager} />}
        {tab === 'visits' && <VisitsTab isManager={isManager} owners={owners} />}
        {tab === 'tasks' && <TasksTab isManager={isManager} />}
        {tab === 'campaigns' && isManager && <CampaignsTab />}
        {tab === 'team' && <TeamTab isManager={isManager} owners={owners} />}
        {tab === 'partners' && isManager && <PartnersTab />}
        {tab === 'agent' && isManager && <AgentTab />}
        {tab === 'whatsapp' && <WhatsAppTab isManager={isManager} onUnread={setWaUnread} />}
        {tab === 'brevo' && <BrevoTab isManager={isManager} />}
        {tab === 'templates' && <TemplatesTab isManager={isManager} />}
      </div>
    </>
  );
}

// ── Pipeline ───────────────────────────────────────────────────────────────

function PipelineTab({ owners, isManager }: { owners: SalesOwner[]; isManager: boolean }) {
  const toast = useStableToast();
  const navigate = useNavigate();
  const [view, setView] = useState<'board' | 'list'>(() => { try { return (localStorage.getItem('solvexo:sales:view') as 'board' | 'list') || 'board'; } catch { return 'board'; } });
  const [filters, setFilters] = useState<LeadQuery>({});
  const [search, setSearch] = useState('');
  const [data, setData] = useState<LeadList | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [losing, setLosing] = useState<SalesLead | null>(null);
  const [dragOver, setDragOver] = useState<LeadStage | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [asking, setAsking] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setError('');
    return apiListLeads({ ...filters, q: search.trim() || undefined, limit: 200 })
      .then(r => setData(r.data))
      .catch(e => setError(errMsg(e, 'Could not load leads.')));
  }, [filters, search]);
  useEffect(() => { const t = setTimeout(load, search ? 250 : 0); return () => clearTimeout(t); }, [load, search]);

  const switchView = (v: 'board' | 'list') => { setView(v); try { localStorage.setItem('solvexo:sales:view', v); } catch { /* convenience only */ } };

  const moveTo = async (lead: SalesLead, stage: LeadStage, lostReason?: string, note?: string) => {
    if (lead.stage === stage) return;
    if (stage === 'lost' && !lostReason) { setLosing(lead); return; }
    const before = data;
    setData(d => d && { ...d, items: d.items.map(l => (l._id === lead._id ? { ...l, stage } : l)) });
    try { await apiChangeStage(lead._id, stage, lostReason, note); toast.success(`${lead.name} moved to ${STAGE_LABELS[stage]}.`); load(); }
    catch (e) { setData(before); toast.error(errMsg(e, 'Could not move the lead.')); }
  };

  const onDrop = (stage: LeadStage) => (e: DragEvent) => {
    e.preventDefault(); setDragOver(null);
    const lead = data?.items.find(l => l._id === e.dataTransfer.getData('text/plain'));
    if (lead) void moveTo(lead, stage);
  };

  const byStage = useMemo(() => {
    const m = new Map<LeadStage, SalesLead[]>(LEAD_STAGES.map(s => [s, []]));
    data?.items.forEach(l => m.get(l.stage)?.push(l));
    return m;
  }, [data]);
  const stageTotal = (s: LeadStage) => data?.summary.stages.find(x => x.stage === s);
  const s = data?.summary;
  const setFilter = (k: keyof LeadQuery, v: string) => { setSelected(new Set()); setFilters(f => ({ ...f, [k]: v || undefined })); };
  // Only ids still on screen count as selected (a filter or search may have hidden some).
  const selectedLeads = (data?.items ?? []).filter(l => selected.has(l._id));
  const toggleSelect = (id: string) => setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const exportBrevo = async () => {
    setExporting(true);
    try { await apiExportBrevoCsv({ ...filters, q: search.trim() || undefined }); }
    catch (e) { toast.error(errMsg(e, 'Could not export.')); }
    setExporting(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Open leads" value={s?.openLeads ?? 0} loading={!data} />
        <MetricCard label="Open pipeline value" value={formatPKR(s?.openValuePKR)} loading={!data} />
        <MetricCard label="Overdue follow-ups" value={s?.overdueFollowUps ?? 0} loading={!data} sub={s?.overdueFollowUps ? 'Call these first' : 'All caught up'} />
        <MetricCard label="Won this month" value={s?.wonThisMonth ?? 0} loading={!data} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, business, email, phone" aria-label="Search leads" className="w-full sm:w-72" />
        {isManager && (
          <div className="w-[calc(50%-4px)] sm:w-40"><Select aria-label="Owner" value={filters.owner ?? ''} onChange={e => setFilter('owner', e.target.value)}>
            <option value="">Everyone</option><option value="me">Mine</option><option value="unassigned">Unassigned</option>
            {owners.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
          </Select></div>
        )}
        <div className="w-[calc(50%-4px)] sm:w-40"><Select aria-label="Source" value={filters.source ?? ''} onChange={e => setFilter('source', e.target.value as LeadSource)}>
          <option value="">All sources</option>{LEAD_SOURCES.map(x => <option key={x} value={x}>{SOURCE_LABELS[x]}</option>)}
        </Select></div>
        <div className="w-[calc(50%-4px)] sm:w-40"><Select aria-label="Follow-up" value={filters.due ?? ''} onChange={e => setFilter('due', e.target.value)}>
          <option value="">Any follow-up</option><option value="overdue">Overdue</option><option value="today">Due today</option>
        </Select></div>
        <div className="w-[calc(50%-4px)] sm:w-40"><Select aria-label="Marketing emails" value={filters.consent ?? ''} onChange={e => setFilter('consent', e.target.value as ConsentStatus)}>
          <option value="">All</option>
          {(['granted', 'none', 'asked', 'withdrawn'] as const).map(c => <option key={c} value={c}>{CONSENT_LABELS[c]}</option>)}
        </Select></div>
        <div className="ml-auto flex flex-wrap justify-end items-center gap-2">
          <div className="flex rounded-md border border-bone overflow-hidden" role="group" aria-label="View">
            <button aria-pressed={view === 'board'} onClick={() => switchView('board')} className={clsx('px-2.5 py-1.5 border-0 cursor-pointer', view === 'board' ? 'bg-brand-pale-orange text-brand-deep-orange' : 'bg-white text-slate')} title="Board"><Columns3 size={15} /></button>
            <button aria-pressed={view === 'list'} onClick={() => switchView('list')} className={clsx('px-2.5 py-1.5 border-0 cursor-pointer', view === 'list' ? 'bg-brand-pale-orange text-brand-deep-orange' : 'bg-white text-slate')} title="List"><List size={15} /></button>
          </div>
          {isManager && (
            <Button variant="ghost" loading={syncing} title="Add merchants who signed up but stalled (runs every morning on its own)" onClick={async () => {
              setSyncing(true);
              try { const r = await apiSyncStalled(); toast.success(r.added ? `${r.added} stalled sign-up${r.added === 1 ? '' : 's'} added.` : 'No new stalled sign-ups.'); if (r.added) void load(); }
              catch (e) { toast.error(errMsg(e, 'Could not check sign-ups.')); }
              setSyncing(false);
            }}><UserRoundSearch size={14} /> Stalled sign-ups</Button>
          )}
          {isManager && (
            <>
              <Button variant="ghost" title="Email leads who haven’t been asked yet, once, to ask if Solvexo may send them news and offers" onClick={() => setAsking(true)}>
                <MailQuestion size={14} /> Ask for permission{selectedLeads.length ? ` (${selectedLeads.length})` : ''}
              </Button>
              <Button variant="ghost" loading={exporting} title="CSV of the leads matching these filters who agreed to marketing emails" onClick={() => void exportBrevo()}><Download size={14} /> Export for Brevo</Button>
            </>
          )}
          <Button variant="outline" onClick={() => setImporting(true)}><FileUp size={14} /> Import</Button>
          <Button onClick={() => setAdding(true)}><Plus size={14} /> Add lead</Button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center"><p className="text-[13px] text-slate">{error}</p><Button onClick={load}>Retry</Button></div>
      ) : data && data.total === 0 && !search && !filters.owner && !filters.source && !filters.due && !filters.consent ? (
        <EmptyState icon={<Target size={28} />} title="No leads yet" description="Add a lead by hand or import a CSV. Demo requests from solvexo.store, Contact Us messages about selling, and stalled sign-ups arrive here on their own." action={{ label: 'Add lead', onClick: () => setAdding(true) }} />
      ) : view === 'board' ? (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
          {LEAD_STAGES.map(stage => {
            const t = stageTotal(stage);
            return (
              <section
                key={stage}
                aria-label={`${STAGE_LABELS[stage]} column`}
                onDragOver={e => { e.preventDefault(); setDragOver(stage); }}
                onDragLeave={() => setDragOver(d => (d === stage ? null : d))}
                onDrop={onDrop(stage)}
                className={clsx('snap-start shrink-0 w-[250px] 2xl:flex-1 2xl:min-w-[200px] 2xl:shrink rounded-xl border bg-cream/60 flex flex-col max-h-[70vh]', dragOver === stage ? 'border-brand-orange' : 'border-bone')}
              >
                <header className="px-3 py-2.5 border-b border-bone">
                  <div className="flex items-center justify-between"><StageBadge stage={stage} /><span className="text-[12px] font-semibold text-charcoal">{t?.count ?? 0}</span></div>
                  <p className="text-[11px] text-slate mt-1">{formatPKR(t?.valuePKR)}</p>
                </header>
                <div className="flex flex-col gap-2 p-2 overflow-y-auto">
                  {(byStage.get(stage) ?? []).map(lead => (
                    <LeadCard key={lead._id} lead={lead} showOwner={isManager} onOpen={() => navigate(`/admin/sales/leads/${lead._id}`)} onMove={st => void moveTo(lead, st)} />
                  ))}
                  {!data && <div className="h-16 rounded-lg bg-white/70 animate-pulse" />}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <LeadTable leads={data?.items ?? []} loading={!data} showOwner={isManager} onOpen={id => navigate(`/admin/sales/leads/${id}`)}
          selected={isManager ? selected : undefined} onToggle={toggleSelect}
          onToggleAll={on => setSelected(on ? new Set((data?.items ?? []).map(l => l._id)) : new Set())} />
      )}
      {data && data.total > data.items.length && <p className="text-[12px] text-slate">Showing {data.items.length} of {data.total}. Narrow the filters to see the rest.</p>}

      {importing && (
        <ImportLeadsModal owners={owners} canAssign={isManager} onClose={() => setImporting(false)} onImported={n => {
          setImporting(false); toast.success(`${n} lead${n === 1 ? '' : 's'} imported.`); void load();
        }} />
      )}
      {adding && (
        <LeadFormModal owners={owners} canAssign={isManager} onClose={() => setAdding(false)} onSave={async input => {
          const r = await apiCreateLead(input);
          setAdding(false); toast.success('Lead added.');
          navigate(`/admin/sales/leads/${r.data.lead._id}`);
        }} />
      )}
      {asking && (
        <AskConsentModal
          leads={selectedLeads.length ? selectedLeads : data?.items ?? []}
          scope={selectedLeads.length ? 'selected' : 'filtered'}
          total={selectedLeads.length ? selectedLeads.length : data?.total ?? 0}
          filters={{ ...filters, q: search.trim() || undefined }}
          onClose={() => setAsking(false)}
          onSent={() => { setSelected(new Set()); void load(); }}
        />
      )}
      {losing && <LostReasonModal name={losing.name} onClose={() => setLosing(null)} onConfirm={async (reason, note) => { const l = losing; setLosing(null); await moveTo(l, 'lost', reason, note); }} />}
    </div>
  );
}

function LeadCard({ lead, showOwner, onOpen, onMove }: { lead: SalesLead; showOwner: boolean; onOpen: () => void; onMove: (s: LeadStage) => void }) {
  const overdue = lead.stage !== 'won' && lead.stage !== 'lost' && isOverdue(lead.nextFollowUpAt);
  return (
    <article
      draggable
      onDragStart={e => { e.dataTransfer.setData('text/plain', lead._id); e.dataTransfer.effectAllowed = 'move'; }}
      className="bg-white rounded-lg border border-bone p-2.5 cursor-grab active:cursor-grabbing hover:border-brand-orange/50 transition-colors"
    >
      <button onClick={onOpen} className="block w-full text-left bg-transparent border-0 p-0 cursor-pointer">
        <p className="text-[13px] font-semibold text-charcoal truncate">{lead.name}</p>
        {lead.businessName && <p className="text-[12px] text-slate truncate">{lead.businessName}</p>}
      </button>
      <div className="flex items-center justify-between gap-2 mt-2 text-[11px]">
        <span className="text-charcoal font-medium">{lead.dealValuePKR ? formatPKR(lead.dealValuePKR) : SOURCE_LABELS[lead.source]}</span>
        {lead.nextFollowUpAt && (
          <span className={clsx('inline-flex items-center gap-1', overdue ? 'text-error font-semibold' : 'text-slate')}><CalendarClock size={11} />{relDay(lead.nextFollowUpAt)}</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 mt-2">
        <span className="flex items-center gap-1.5 min-w-0">
          {showOwner && <span className="text-[11px] text-slate truncate">{lead.ownerName ?? 'Unassigned'}</span>}
          {lead.marketingConsent && lead.marketingConsent.status !== 'none' && <ConsentBadge status={lead.marketingConsent.status} />}
        </span>
        {/* Keyboard / touch alternative to dragging. */}
        <Select aria-label={`Move ${lead.name}`} value={lead.stage} onChange={e => onMove(e.target.value as LeadStage)}>
          {LEAD_STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
        </Select>
      </div>
    </article>
  );
}

function LeadTable({ leads, loading, showOwner, onOpen, selected, onToggle, onToggleAll }: {
  leads: SalesLead[]; loading: boolean; showOwner: boolean; onOpen: (id: string) => void;
  /** Managers pick leads to ask for marketing permission; undefined hides the checkboxes. */
  selected?: Set<string>; onToggle?: (id: string) => void; onToggleAll?: (on: boolean) => void;
}) {
  if (loading) return <div className="h-40 rounded-xl bg-cream animate-pulse" />;
  if (!leads.length) return <p className="text-[13px] text-slate py-10 text-center">No leads match these filters.</p>;
  const allOn = !!selected && leads.every(l => selected.has(l._id));
  return (
    <div className="overflow-x-auto rounded-xl border border-bone bg-white">
      <table className="w-full text-[13px]">
        <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate border-b border-bone">
          {selected && <th className="pl-3 py-2 w-6"><input type="checkbox" aria-label="Select all leads" checked={allOn} onChange={e => onToggleAll?.(e.target.checked)} className="size-4 accent-brand-orange cursor-pointer" /></th>}
          <th className="px-3 py-2 font-semibold">Lead</th><th className="px-3 py-2 font-semibold">Stage</th><th className="px-3 py-2 font-semibold">Source</th>
          <th className="px-3 py-2 font-semibold text-right">Value</th><th className="px-3 py-2 font-semibold">Next follow-up</th>
          {showOwner && <th className="px-3 py-2 font-semibold">Owner</th>}
          <th className="px-3 py-2 font-semibold">Marketing emails</th>
        </tr></thead>
        <tbody>
          {leads.map(l => (
            <tr key={l._id} onClick={() => onOpen(l._id)} className="border-b border-bone last:border-0 hover:bg-cream cursor-pointer">
              {selected && <td className="pl-3 py-2" onClick={e => e.stopPropagation()}><input type="checkbox" aria-label={`Select ${l.name}`} checked={selected.has(l._id)} onChange={() => onToggle?.(l._id)} className="size-4 accent-brand-orange cursor-pointer" /></td>}
              <td className="px-3 py-2"><p className="font-medium text-charcoal">{l.name}</p><p className="text-[12px] text-slate">{l.businessName ?? l.email ?? l.phone}</p></td>
              <td className="px-3 py-2"><StageBadge stage={l.stage} /></td>
              <td className="px-3 py-2 text-slate">{SOURCE_LABELS[l.source]}</td>
              <td className="px-3 py-2 text-right tabular-nums">{l.dealValuePKR ? formatPKR(l.dealValuePKR) : '—'}</td>
              <td className={clsx('px-3 py-2', l.stage !== 'won' && l.stage !== 'lost' && isOverdue(l.nextFollowUpAt) ? 'text-error font-medium' : 'text-slate')}>{relDay(l.nextFollowUpAt) || '—'}</td>
              {showOwner && <td className="px-3 py-2 text-slate">{l.ownerName ?? 'Unassigned'}</td>}
              <td className="px-3 py-2"><ConsentBadge status={l.marketingConsent?.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One-time "Can we keep you posted?" email to leads who haven't been asked. Only a click on its button counts as agreeing. */
function AskConsentModal({ leads, scope, total, filters, onClose, onSent }: {
  leads: SalesLead[]; scope: 'selected' | 'filtered'; total: number; filters: LeadQuery; onClose: () => void; onSent: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ sent: number; skipped: number; more?: number } | null>(null);
  const eligible = leads.filter(l => l.email && (l.marketingConsent?.status ?? 'none') === 'none').length;
  const send = async () => {
    setBusy(true); setError('');
    // Ticked leads go by id; otherwise the server applies the filters itself, so leads beyond the loaded page count too.
    try { setResult(await apiAskMarketingConsent(scope === 'selected' ? leads.map(l => l._id) : undefined, filters)); onSent(); }
    catch (e) { setError(errMsg(e, 'Could not send the emails.')); }
    setBusy(false);
  };
  return (
    <Modal title="Ask for permission to send marketing emails" onClose={onClose} width={520}
      footer={<div className="flex justify-end gap-2">
        {result ? <Button onClick={onClose}>Done</Button> : <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!leads.length} onClick={() => void send()}>Send permission email</Button></>}
      </div>}>
      {result ? (
        <div role="status" className="flex flex-col gap-1 text-[13px] text-charcoal">
          <p><strong>Sending to {result.sent} lead{result.sent === 1 ? '' : 's'}.</strong> The emails go out over the next few minutes.</p>
          {result.skipped > 0 && <p className="text-slate">Skipped {result.skipped}: no email, or already asked, agreed or unsubscribed.</p>}
          {!!result.more && <p className="text-slate">{result.more} more can be asked: click Ask for permission again to send the next batch.</p>}
          <p className="text-slate">Anyone who taps “Yes” is marked Agreed and goes to Brevo on the next sync.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 text-[13px] text-charcoal">
          <p>Each lead gets one short email from Solvexo asking <strong>“Can we keep you posted?”</strong> with a button to say yes. Only people who tap it are marked Agreed. Nobody is asked twice, and leads without an email, or who were already asked, agreed or unsubscribed, are skipped.</p>
          <p className="text-slate">
            {scope === 'selected'
              ? `${leads.length} selected lead${leads.length === 1 ? '' : 's'}, about ${eligible} can be asked.`
              : total > leads.length
                ? `${total} leads match these filters. Everyone among them with an email who hasn’t been asked yet gets it (up to 500 at a time).`
                : `${total} lead${total === 1 ? '' : 's'} matching these filters, about ${eligible} can be asked.`}
          </p>
          {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
        </div>
      )}
    </Modal>
  );
}

// ── Follow-ups ───────────────────────────────────────────────────────────────

function TasksTab({ isManager }: { isManager: boolean }) {
  const toast = useStableToast();
  const navigate = useNavigate();
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [status, setStatus] = useState<'open' | 'done'>('open');
  const [tasks, setTasks] = useState<SalesTask[] | null>(null);
  const [tick, setTick] = useState(0);
  const load = () => setTick(t => t + 1);
  useEffect(() => {
    let cancelled = false;
    apiListTasks({ scope, status })
      .then(r => { if (!cancelled) setTasks(r.data); })
      .catch(e => { if (!cancelled) { setTasks([]); toast.error(errMsg(e, 'Could not load follow-ups.')); } });
    return () => { cancelled = true; };
  }, [scope, status, tick, toast]);

  const toggle = async (t: SalesTask) => {
    setTasks(ts => ts?.filter(x => x._id !== t._id) ?? null);
    try { await apiUpdateTask(t._id, { done: !t.doneAt }); toast.success(t.doneAt ? 'Reopened.' : 'Done.'); }
    catch (e) { toast.error(errMsg(e, 'Could not update the task.')); load(); }
  };

  const groups = useMemo(() => {
    if (!tasks || status === 'done') return [{ label: '', items: tasks ?? [] }];
    const now = new Date(); const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    return [
      { label: 'Overdue', items: tasks.filter(t => new Date(t.dueAt).getTime() < now.getTime()) },
      { label: 'Today', items: tasks.filter(t => { const d = new Date(t.dueAt).getTime(); return d >= now.getTime() && d < end; }) },
      { label: 'Coming up', items: tasks.filter(t => new Date(t.dueAt).getTime() >= end) },
    ].filter(g => g.items.length);
  }, [tasks, status]);

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex flex-wrap gap-2">
        {isManager && <div className="w-[calc(50%-4px)] sm:w-40"><Select aria-label="Whose follow-ups" value={scope} onChange={e => { setTasks(null); setScope(e.target.value as 'mine' | 'all'); }}><option value="mine">Mine</option><option value="all">Whole team</option></Select></div>}
        <div className="w-[calc(50%-4px)] sm:w-40"><Select aria-label="Status" value={status} onChange={e => { setTasks(null); setStatus(e.target.value as 'open' | 'done'); }}><option value="open">To do</option><option value="done">Done</option></Select></div>
      </div>
      {!tasks ? <div className="h-32 rounded-xl bg-cream animate-pulse" /> : !tasks.length ? (
        <EmptyState icon={<CalendarClock size={28} />} title={status === 'open' ? 'Nothing to follow up' : 'No finished follow-ups yet'} description="Add a follow-up from any lead’s page." />
      ) : groups.map(g => (
        <div key={g.label || 'all'}>
          {g.label && <p className={clsx('text-[11px] font-bold uppercase tracking-wide mb-2', g.label === 'Overdue' ? 'text-error' : 'text-slate')}>{g.label} · {g.items.length}</p>}
          <ul className="rounded-xl border border-bone bg-white divide-y divide-bone">
            {g.items.map(t => (
              <li key={t._id} className="flex items-center gap-3 px-3 py-2.5">
                <input type="checkbox" aria-label={`Mark "${t.title}" ${t.doneAt ? 'not done' : 'done'}`} checked={!!t.doneAt} onChange={() => void toggle(t)} className="size-4 accent-brand-orange cursor-pointer" />
                <button onClick={() => navigate(`/admin/sales/leads/${t.leadId}`)} className="flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer">
                  <p className="text-[13px] font-medium text-charcoal truncate">{t.title}</p>
                  <p className="text-[12px] text-slate truncate">{t.leadName}{t.leadBusiness ? ` · ${t.leadBusiness}` : ''}{isManager && scope === 'all' && t.assigneeName ? ` · ${t.assigneeName}` : ''}</p>
                </button>
                <span className={clsx('text-[12px] shrink-0', !t.doneAt && isOverdue(t.dueAt) ? 'text-error font-semibold' : 'text-slate')}>{relDay(t.doneAt ?? t.dueAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ── Templates ──────────────────────────────────────────────────────────────

function TemplatesTab({ isManager }: { isManager: boolean }) {
  const toast = useStableToast();
  const [rows, setRows] = useState<SalesTemplate[] | null>(null);
  const [editing, setEditing] = useState<SalesTemplate | 'new' | null>(null);
  useEffect(() => { apiListTemplates().then(r => setRows(r.data)).catch(e => { setRows([]); toast.error(errMsg(e, 'Could not load templates.')); }); }, [toast]);

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-slate">Use <code className="text-charcoal">{'{{name}}'}</code>, <code className="text-charcoal">{'{{businessName}}'}</code> and <code className="text-charcoal">{'{{senderName}}'}</code>; they’re filled in when you send.</p>
        {isManager && <Button size="sm" onClick={() => setEditing('new')}><Plus size={14} /> New template</Button>}
      </div>
      {!rows ? <div className="h-32 rounded-xl bg-cream animate-pulse" /> : rows.map(t => (
        <div key={t._id} className="rounded-xl border border-bone bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="text-[13px] font-semibold text-charcoal flex items-center gap-2">{t.name}<Badge size="sm" color="gray">{reasonLabel(t.reason)}</Badge></p><p className="text-[12px] text-slate">Subject: {t.subject}</p></div>
            {isManager && (
              <div className="flex gap-1 shrink-0">
                <Button size="xs" variant="ghost" onClick={() => setEditing(t)}>Edit</Button>
                <Button size="xs" variant="ghost" aria-label={`Delete ${t.name}`} onClick={async () => { try { setRows((await apiDeleteTemplate(t._id)).data); toast.success('Template deleted.'); } catch (e) { toast.error(errMsg(e, 'Could not delete.')); } }}><Trash2 size={13} /></Button>
              </div>
            )}
          </div>
          <p className="text-[12px] text-charcoal whitespace-pre-line mt-2 line-clamp-4">{t.body}</p>
        </div>
      ))}
      {editing && (
        <TemplateModal template={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={async v => {
          setRows((await apiSaveTemplate(editing === 'new' ? null : editing._id, v)).data);
          setEditing(null); toast.success('Template saved.');
        }} />
      )}
    </div>
  );
}

function TemplateModal({ template, onClose, onSave }: { template: SalesTemplate | null; onClose: () => void; onSave: (v: { name: string; subject: string; body: string; reason: MessageReason }) => Promise<void> }) {
  const [v, setV] = useState({ name: template?.name ?? '', subject: template?.subject ?? '', body: template?.body ?? '', reason: (template ? template.reason ?? 'other' : 'follow_up') as MessageReason });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ok = v.name.trim() && v.subject.trim() && v.body.trim();
  return (
    <Modal title={template ? 'Edit template' : 'New template'} onClose={onClose} width={560}
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={!ok} loading={busy} onClick={async () => { setBusy(true); setError(''); try { await onSave(v); } catch (e) { setError(errMsg(e, 'Could not save.')); setBusy(false); } }}>Save</Button></div>}>
      <div className="flex flex-col gap-3">
        <Input label="Name" value={v.name} onChange={e => setV({ ...v, name: e.target.value })} />
        <Select label="Reason" value={v.reason} onChange={e => setV({ ...v, reason: e.target.value as MessageReason })}>
          {MESSAGE_REASONS.map(r => <option key={r} value={r}>{MESSAGE_REASON_LABELS[r]}</option>)}
        </Select>
        <Input label="Subject" value={v.subject} onChange={e => setV({ ...v, subject: e.target.value })} />
        <Textarea label="Message" rows={9} value={v.body} onChange={e => setV({ ...v, body: e.target.value })} />
        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}
