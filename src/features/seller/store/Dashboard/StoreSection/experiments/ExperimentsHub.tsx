import { useCallback, useEffect, useState } from 'react';
import { FlaskConical, Plus } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace, hasNavPermission } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge, Input } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { TokenStorage } from '@/api/services/auth';
import { apiListStorePages, type StorePageData } from '@/api/services/storePages';
import type { BadgeColor } from '@/types';
import {
  apiCreateExperiment, apiDeleteExperiment, apiExperimentAction, apiExperimentResults, apiExperimentWinner, apiListExperiments, apiUpdateExperiment,
  type ExperimentKind, type ExperimentResults, type ExperimentRow, type ExperimentStatus, type OverrideValue,
} from '@/api/services/experiments';

const STATUS_COLOR: Record<ExperimentStatus, BadgeColor> = { draft: 'gray', running: 'green', paused: 'yellow', stopped: 'blue' };
const VERDICT_TEXT: Record<ExperimentResults['verdict'], string> = {
  not_enough_data: 'Not enough data yet. Keep it running (at least 100 visits per version and 10 orders in total).',
  inconclusive: 'No clear difference so far.',
  leaning: 'One version looks better, but it is not certain yet.',
  likely: 'One version is very likely better.',
};
const errText = (e: unknown, f: string) => (e instanceof Error && e.message ? e.message : f);
const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—');

type Row = { key: string; value: string; type: 'text' | 'number' | 'bool'; on: boolean };
type Form = { name: string; kind: ExperimentKind; trafficPercent: string; splitB: string; pageId: string; sectionId: string; variantBName: string; rows: Row[] };
const EMPTY: Form = { name: '', kind: 'section', trafficPercent: '100', splitB: '50', pageId: '', sectionId: '', variantBName: 'Variant B', rows: [] };

/** A simple setting a test may change: text without markup, a number or yes/no. */
const simpleRows = (settings: Record<string, unknown> | undefined): Row[] => Object.entries(settings ?? {})
  .filter(([k, v]) => /^[A-Za-z][A-Za-z0-9_]{0,59}$/.test(k) && !['type', 'enabled', 'blocks', 'colorSchemeId', 'customCss'].includes(k) && ((typeof v === 'string' && v.length <= 500 && !/[<>]/.test(v)) || typeof v === 'number' || typeof v === 'boolean'))
  .map(([k, v]) => ({ key: k, value: String(v), type: typeof v === 'number' ? 'number' as const : typeof v === 'boolean' ? 'bool' as const : 'text' as const, on: false }));

const toOverrides = (rows: Row[]): Record<string, OverrideValue> => Object.fromEntries(rows.filter((r) => r.on && r.key.trim()).map((r) => [r.key.trim(), r.type === 'number' ? Number(r.value) : r.type === 'bool' ? r.value === 'true' : r.value]));

/** A/B experiments: change one section (or a theme setting) for part of your visitors and compare orders. Only visitors who allowed analytics take part. */
export default function ExperimentsHub() {
  const { storeId } = useStoreWorkspace();
  const toast = useToast();
  const user = TokenStorage.getUser<{ role?: 'admin' | 'seller' | 'staff' | 'user'; permissions?: string[] }>();
  const canManage = hasNavPermission(user as never, ['experiments.manage']);
  const [rows, setRows] = useState<ExperimentRow[]>([]);
  const [pages, setPages] = useState<StorePageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ExperimentRow | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<{ exp: ExperimentRow; data: ExperimentResults | null; error: string } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; text: string; run: () => Promise<unknown>; ok: string } | null>(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true); setError('');
    apiListExperiments(storeId).then(setRows).catch((e: unknown) => setError(errText(e, 'Could not load experiments.'))).finally(() => setLoading(false));
  }, [storeId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const openForm = (e: ExperimentRow | 'new') => {
    setFormError(''); setEditing(e);
    if (e === 'new') setForm(EMPTY);
    else setForm({ name: e.name, kind: e.kind, trafficPercent: String(e.trafficPercent), splitB: String(e.splitB), pageId: '', sectionId: e.sectionId ?? '', variantBName: e.variantBName, rows: Object.entries(e.overrides).map(([k, v]) => ({ key: k, value: String(v), type: typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'bool' : 'text', on: true })) });
    if (pages.length === 0 && storeId) apiListStorePages(storeId).then((r) => setPages(r.data ?? [])).catch(() => { /* the section picker just stays empty */ });
  };
  const sectionsOfPage = pages.find((p) => p._id === form.pageId)?.sections ?? [];
  const pickSection = (id: string) => {
    const s = sectionsOfPage.find((x) => String(x._id) === id);
    setForm((f) => ({ ...f, sectionId: id, rows: s ? simpleRows(s.settings as Record<string, unknown>) : [] }));
  };

  const save = async () => {
    setSaving(true); setFormError('');
    try {
      const body = { name: form.name.trim(), kind: form.kind, trafficPercent: Number(form.trafficPercent), splitB: Number(form.splitB), variantBName: form.variantBName, overrides: toOverrides(form.rows), ...(form.kind === 'section' ? { sectionId: form.sectionId } : {}) };
      if (editing === 'new') await apiCreateExperiment(storeId, body);
      else if (editing) { const { kind: _kind, ...rest } = body; void _kind; await apiUpdateExperiment(storeId, editing._id, rest); }
      setEditing(null); toast.success('Experiment saved'); load();
    } catch (e: unknown) { setFormError(errText(e, 'Could not save the experiment.')); } finally { setSaving(false); }
  };
  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try { await fn(); toast.success(ok); load(); } catch (e: unknown) { toast.error(errText(e, 'That did not work.')); } finally { setBusy(''); }
  };
  const openResults = (exp: ExperimentRow) => {
    setResults({ exp, data: null, error: '' });
    apiExperimentResults(storeId, exp._id).then((data) => setResults({ exp, data, error: '' })).catch((e: unknown) => setResults({ exp, data: null, error: errText(e, 'Could not load the results.') }));
  };
  const setRow = (i: number, p: Partial<Row>) => setForm((f) => ({ ...f, rows: f.rows.map((r, k) => (k === i ? { ...r, ...p } : r)) }));

  const variantCard = (label: string, v: ExperimentResults['variants']['a'], leader: boolean) => (
    <div className={`rounded-xl border p-3 ${leader ? 'border-success' : 'border-border-soft'}`}>
      <p className="m-0 text-[13px] font-semibold text-charcoal">{label}{leader ? ' (ahead)' : ''}</p>
      <p className="m-0 text-[12.5px] text-slate">{v.visits} visits · {v.addedToCart} added to cart · {v.reachedCheckout} reached checkout</p>
      <p className="m-0 text-[15px] font-semibold text-charcoal">{v.orders} orders · {v.conversionRate}%</p>
    </div>
  );

  return (
    <>
      <StorePageHeader title="Experiments" subtitle="A/B test a section or a theme setting on part of your visitors. Only visitors who allowed analytics take part."
        actions={canManage ? <Button size="sm" icon={<Plus size={14} />} onClick={() => openForm('new')}>New experiment</Button> : undefined} />
      <div className="px-4 lg:px-7 pt-5 pb-10 w-full flex flex-col gap-4">
        {error ? <EmptyState icon={<FlaskConical size={22} />} title="Could not load" description={error} action={{ label: 'Retry', onClick: load }} />
          : loading && !rows.length ? <SkeletonBox className="h-24 w-full" />
            : rows.length === 0 ? <EmptyState icon={<FlaskConical size={22} />} title="No experiments yet" description="Example: show a different heading on your home page to half of your visitors and see which one brings more orders." />
              : (
                <ul className="flex flex-col gap-2 list-none p-0 m-0">
                  {rows.map((e) => (
                    <li key={e._id} className="rounded-xl border border-border-soft bg-white p-3 flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[13.5px] text-charcoal">{e.name}</span>
                        <Badge color={STATUS_COLOR[e.status]} size="sm">{e.status[0].toUpperCase() + e.status.slice(1)}</Badge>
                        <Badge color="gray" size="sm">{e.kind === 'section' ? 'Section' : 'Theme setting'}</Badge>
                        {e.winner && <Badge color="blue" size="sm">Winner: {e.winner === 'b' ? 'B (live for everyone)' : 'A (original)'}</Badge>}
                      </div>
                      <p className="text-[12.5px] text-slate m-0">{e.trafficPercent}% of visitors take part · {e.splitB}% of them see B · {Object.keys(e.overrides).length} change(s) · started {when(e.startedAt)}</p>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {e.status !== 'draft' && <Button size="sm" variant="secondary" onClick={() => openResults(e)}>Results</Button>}
                        {canManage && e.status === 'draft' && <><Button size="sm" variant="secondary" onClick={() => openForm(e)}>Edit</Button><Button size="sm" loading={busy === e._id} onClick={() => void run(e._id, () => apiExperimentAction(storeId, e._id, 'start'), 'Experiment started')}>Start</Button></>}
                        {canManage && e.status === 'running' && <Button size="sm" variant="secondary" loading={busy === e._id} onClick={() => void run(e._id, () => apiExperimentAction(storeId, e._id, 'pause'), 'Paused')}>Pause</Button>}
                        {canManage && e.status === 'paused' && <Button size="sm" variant="secondary" loading={busy === e._id} onClick={() => void run(e._id, () => apiExperimentAction(storeId, e._id, 'resume'), 'Resumed')}>Resume</Button>}
                        {canManage && (e.status === 'running' || e.status === 'paused') && <Button size="sm" variant="outline" onClick={() => setConfirm({ title: 'Stop this experiment?', text: 'Visitors go back to the normal store. You can then pick a winner.', ok: 'Experiment stopped', run: () => apiExperimentAction(storeId, e._id, 'stop') })}>Stop</Button>}
                        {canManage && e.status === 'stopped' && !e.winner && <><Button size="sm" variant="secondary" onClick={() => setConfirm({ title: 'Use variant B for everyone?', text: 'Variant B is shown to every visitor. Your section is not changed, so you can switch it off later.', ok: 'Variant B is live', run: () => apiExperimentWinner(storeId, e._id, 'b') })}>Use B for everyone</Button><Button size="sm" variant="outline" onClick={() => setConfirm({ title: 'Keep the original?', text: 'Everyone keeps seeing the original (A).', ok: 'Original kept', run: () => apiExperimentWinner(storeId, e._id, 'a') })}>Keep original</Button></>}
                        {canManage && e.status !== 'running' && <Button size="sm" variant="outline" onClick={() => setConfirm({ title: 'Delete this experiment?', text: 'Its results are removed from the list.', ok: 'Experiment deleted', run: () => apiDeleteExperiment(storeId, e._id) })}>Delete</Button>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'New experiment' : 'Edit experiment'} onClose={() => setEditing(null)} width={640} mobileSheet
          footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} loading={saving} disabled={!form.name.trim()}>Save</Button></div>}>
          <div className="flex flex-col gap-3">
            <Input label="Name" value={form.name} maxLength={80} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <label className="flex flex-col gap-1 text-[13px] text-charcoal">What do you want to test?
              <select className="h-10 rounded-lg border border-border-soft px-2" value={form.kind} disabled={editing !== 'new'} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as ExperimentKind, rows: [], sectionId: '' }))}>
                <option value="section">A section on a page (text, numbers, switches)</option>
                <option value="theme_settings">A theme setting (custom.*)</option>
              </select>
            </label>
            {form.kind === 'section' && (
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-[13px] text-charcoal">Page
                  <select className="h-10 rounded-lg border border-border-soft px-2" value={form.pageId} onChange={(e) => setForm((f) => ({ ...f, pageId: e.target.value, sectionId: '', rows: [] }))}>
                    <option value="">Choose a page</option>{pages.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[13px] text-charcoal">Section
                  <select className="h-10 rounded-lg border border-border-soft px-2" value={form.sectionId} onChange={(e) => pickSection(e.target.value)} disabled={!form.pageId && !form.sectionId}>
                    <option value="">Choose a section</option>{sectionsOfPage.map((s) => <option key={String(s._id)} value={String(s._id)}>{s.type}{typeof s.settings?.heading === 'string' && s.settings.heading ? ` · ${s.settings.heading}` : ''}</option>)}
                  </select>
                </label>
              </div>
            )}
            <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
              <legend className="text-[13px] font-medium text-charcoal mb-1">What changes in variant B (tick the settings you want to change)</legend>
              {form.rows.map((r, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input type="checkbox" aria-label={`Change ${r.key || 'setting'}`} className="accent-brand-orange" checked={r.on} onChange={(e) => setRow(i, { on: e.target.checked })} />
                  <input aria-label="Setting name" className="h-9 w-40 rounded-lg border border-border-soft px-2 text-[13px]" value={r.key} placeholder={form.kind === 'theme_settings' ? 'custom.toastStyle' : 'heading'} onChange={(e) => setRow(i, { key: e.target.value })} />
                  {r.type === 'bool'
                    ? <select aria-label="Setting value" className="h-9 rounded-lg border border-border-soft px-2 text-[13px]" value={r.value} onChange={(e) => setRow(i, { value: e.target.value })}><option value="true">yes</option><option value="false">no</option></select>
                    : <input aria-label="Setting value" type={r.type === 'number' ? 'number' : 'text'} className="h-9 min-w-0 flex-1 rounded-lg border border-border-soft px-2 text-[13px]" value={r.value} onChange={(e) => setRow(i, { value: e.target.value, on: true })} />}
                </div>
              ))}
              {form.rows.length < 20 && <Button size="sm" variant="secondary" className="w-fit" onClick={() => setForm((f) => ({ ...f, rows: [...f.rows, { key: '', value: '', type: 'text', on: true }] }))}>Add a setting by name</Button>}
            </fieldset>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Visitors who take part (%)" type="number" value={form.trafficPercent} onChange={(e) => setForm((f) => ({ ...f, trafficPercent: e.target.value }))} />
              <Input label="Of them, see B (%)" type="number" value={form.splitB} onChange={(e) => setForm((f) => ({ ...f, splitB: e.target.value }))} />
              <Input label="Name of B" value={form.variantBName} maxLength={80} onChange={(e) => setForm((f) => ({ ...f, variantBName: e.target.value }))} />
            </div>
            {formError && <p role="alert" className="text-[12.5px] text-error m-0">{formError}</p>}
          </div>
        </Modal>
      )}

      {results && (
        <Modal title={`Results: ${results.exp.name}`} onClose={() => setResults(null)} width={560} mobileSheet footer={<div className="flex justify-end"><Button onClick={() => setResults(null)}>Close</Button></div>}>
          {results.error ? <p role="alert" className="text-[13px] text-error m-0">{results.error}</p> : !results.data ? <SkeletonBox className="h-24 w-full" /> : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">{variantCard('A (original)', results.data.variants.a, results.data.leader === 'a' && results.data.verdict !== 'not_enough_data')}{variantCard(`B (${results.exp.variantBName || 'changed'})`, results.data.variants.b, results.data.leader === 'b' && results.data.verdict !== 'not_enough_data')}</div>
              <p role="status" className="text-[13px] text-charcoal m-0">{VERDICT_TEXT[results.data.verdict]}{results.data.p != null ? ` (p = ${results.data.p})` : ''}</p>
              <p className="text-[12px] text-slate m-0">A visit counts once. Orders, cart and checkout steps come from the same visit. Visitors who did not allow analytics are not part of any test.</p>
            </div>
          )}
        </Modal>
      )}

      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)} width={440} mobileSheet
          footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button><Button onClick={() => { const c = confirm; setConfirm(null); void run('c', c.run, c.ok); }}>Confirm</Button></div>}>
          <p className="text-[13px] text-charcoal m-0">{confirm.text}</p>
        </Modal>
      )}
    </>
  );
}
