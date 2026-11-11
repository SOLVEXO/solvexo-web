import { useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { Button, Input, Select, Toggle } from '@/components/comman/ui';
import { FbrInvoiceList } from '@/components/comman/fbr/FbrInvoiceList';
import { useKeyedLoad } from '@/components/comman/dashboard/useKeyedLoad';
import { useToast } from '@/contexts/ToastContext';
import { isStaffSession } from '@/hooks/auth/useCan';
import {
  apiDeleteStoreFbrToken, apiGetStoreFbr, apiListStoreFbrInvoices, apiResolveStoreFbrInvoice, apiRetryStoreFbrInvoice, apiSetStoreFbrToken, apiStoreFbrProvinces,
  apiTestStoreFbr, apiUpdateStoreFbr, type FbrMode, type FbrTestResult, type StoreFbrSettings,
} from '@/api/services/fbrDi';

type Editable = 'province' | 'legalName' | 'hsCode' | 'uom' | 'saleType' | 'scenarioId';
const FIELDS: Editable[] = ['province', 'legalName', 'hsCode', 'uom', 'saleType', 'scenarioId'];

function errMsg(e: unknown, fallback: string) { return e instanceof Error && e.message ? e.message : fallback; }

/**
 * Settings → Taxes → FBR digital invoicing (Pakistani stores). The store files each sale with FBR using ITS OWN token from FBR's portal,
 * and tells Solvexo its province so Solvexo can invoice it too. Only the store owner can change it.
 */
export function FbrInvoicingCard({ storeId }: { storeId: string }) {
  const toast = useToast();
  const owner = !isStaffSession();
  const { data: loaded, error, retry } = useKeyedLoad(async () => (await apiGetStoreFbr(storeId)).data, storeId);
  const { data: provinceList } = useKeyedLoad(() => apiStoreFbrProvinces(storeId).then(r => r.data).catch(() => [] as string[]), `prov:${storeId}`);
  const [saved, setSaved] = useState<StoreFbrSettings | null>(null); // newest copy returned by a save / token change / test
  const [edits, setEdits] = useState<Partial<Record<Editable, string>>>({});
  const [tokenMode, setTokenMode] = useState<FbrMode>('sandbox');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [test, setTest] = useState<FbrTestResult | null>(null);
  const [refresh, setRefresh] = useState(0);

  const s = saved ?? loaded;
  if (error && !s) {
    return (
      <div role="alert" className="rounded-xl border border-error/30 bg-error-bg px-4 py-3 text-[12.5px] text-error flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5"><AlertCircle size={14} />{error}</span>
        <Button size="sm" variant="outline" onClick={retry}>Try again</Button>
      </div>
    );
  }
  if (!s) return <div className="h-24 rounded-xl bg-bone animate-pulse" aria-label="Loading FBR settings" />;

  const value = (k: Editable): string => edits[k] ?? (s[k] ?? '');
  const form = { province: value('province'), legalName: value('legalName'), hsCode: value('hsCode'), uom: value('uom'), saleType: value('saleType'), scenarioId: value('scenarioId') };
  const dirty = FIELDS.some(k => edits[k] !== undefined && edits[k] !== (s[k] ?? ''));
  const provinces = provinceList ?? [];
  const setField = (k: Editable, v: string) => setEdits(x => ({ ...x, [k]: v }));
  const tokenState = tokenMode === 'production' ? s.tokenProduction : s.tokenSandbox;

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } catch (e) { toast.error(errMsg(e, 'Something went wrong.')); } finally { setBusy(null); }
  };
  const save = (extra: Partial<{ enabled: boolean; mode: FbrMode }> = {}) => run('save', async () => { setSaved((await apiUpdateStoreFbr(storeId, { ...form, ...extra })).data); setEdits({}); toast.success('FBR settings saved.'); setRefresh(n => n + 1); });
  const saveToken = () => run('token', async () => { setSaved((await apiSetStoreFbrToken(storeId, tokenMode, token.trim())).data); setToken(''); toast.success('Token saved. It is stored encrypted and never shown again.'); });
  const removeToken = () => run('rmtoken', async () => { setSaved((await apiDeleteStoreFbrToken(storeId, tokenMode)).data); toast.success('Token removed.'); });
  const runTest = () => run('test', async () => { setTest(null); setTest((await apiTestStoreFbr(storeId)).data); setSaved((await apiGetStoreFbr(storeId)).data); });

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-bone p-4">
      <div>
        <p className="text-[13px] font-semibold text-charcoal">FBR digital invoicing</p>
        <p className="text-[11.5px] text-slate leading-relaxed mt-0.5">
          If your business is registered for sales tax, FBR needs an invoice for each sale. Turn this on and Solvexo files them for you, using your own FBR token. Orders placed after you turn it on are reported, a few minutes after the order.
        </p>
      </div>

      {s.solvexoInvoicesNeedInfo > 0 && (
        <div role="alert" className="rounded-lg border border-warning/40 bg-warning-bg px-3 py-2.5 text-[12.5px] text-charcoal">
          <b>Solvexo needs your province</b> to send you its plan invoices ({s.solvexoInvoicesNeedInfo} waiting). Choose it below and press Save details.
        </div>
      )}

      {s.blockers.length > 0 && (
        <ul className="rounded-lg bg-cream px-3 py-2.5 text-[12.5px] text-slate list-disc pl-6">{s.blockers.map(b => <li key={b}>{b}</li>)}</ul>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {provinces.length > 0 ? (
          <Select label="Your province (as FBR lists it)" value={form.province} disabled={!owner} onChange={e => setField('province', e.target.value)}>
            <option value="">Choose province</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        ) : (
          <Input label="Your province" value={form.province} maxLength={60} disabled={!owner} onChange={e => setField('province', e.target.value)} />
        )}
        <Input label="Registered business name" placeholder={s.identity.storeName} value={form.legalName} maxLength={120} disabled={!owner} onChange={e => setField('legalName', e.target.value)} />
        <Input label="Default HS code" placeholder="0000.0000" value={form.hsCode} maxLength={12} disabled={!owner} onChange={e => setField('hsCode', e.target.value)} />
        <Input label="Unit of measure (as FBR lists it)" value={form.uom} maxLength={80} disabled={!owner} onChange={e => setField('uom', e.target.value)} />
        <Input label="Sale type (as FBR lists it)" value={form.saleType} maxLength={80} disabled={!owner} onChange={e => setField('saleType', e.target.value)} />
        <Input label="Sandbox scenario" value={form.scenarioId} maxLength={5} disabled={!owner} onChange={e => setField('scenarioId', e.target.value.toUpperCase())} />
      </div>
      <p className="text-[11.5px] text-slate">The default HS code is used for any product whose variant has no HS code of its own (set one per product under Variants → Customs). Your NTN and business address come from Tax registration above.</p>

      {owner && (
        <div className="rounded-lg border border-bone p-3 flex flex-col gap-3">
          <p className="text-[12.5px] font-semibold text-charcoal flex items-center gap-1.5"><KeyRound size={13} /> FBR security token</p>
          <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto] items-end">
            <Select aria-label="Which token" value={tokenMode} onChange={e => setTokenMode(e.target.value as FbrMode)}>
              <option value="sandbox">Test (sandbox)</option>
              <option value="production" disabled>Live (locked)</option>
            </Select>
            <Input aria-label="Paste the token" type="password" autoComplete="off" placeholder={tokenState.set ? `Saved (${tokenState.hint}) — paste to replace` : 'Paste the token from the FBR portal'} value={token} onChange={e => setToken(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" loading={busy === 'token'} disabled={token.trim().length < 20} onClick={saveToken}>Save token</Button>
              {tokenState.set && <Button size="sm" variant="outline" loading={busy === 'rmtoken'} onClick={removeToken}>Remove</Button>}
            </div>
          </div>
          <p className="text-[11.5px] text-slate">Get your test token from FBR&apos;s digital invoicing portal (it is issued per business). It is stored encrypted and is never shown again, not even to you. Live filing is locked for now: only FBR&apos;s test system is used.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {owner && <Button size="sm" loading={busy === 'save'} disabled={!dirty} onClick={() => save()}>Save details</Button>}
        {owner && <Button size="sm" variant="outline" loading={busy === 'test'} disabled={dirty || !s.tokenSandbox.set} onClick={runTest}>Test with FBR sandbox</Button>}
      </div>
      {test && (
        <p role="status" className={`flex items-start gap-1.5 text-[12.5px] ${test.ok ? 'text-success' : 'text-error'}`}>
          {test.ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
          <span>{test.message}{!test.ok && test.errors.slice(1, 4).map((e, i) => <span key={i} className="block">{e.code ? `${e.code}: ` : ''}{e.message}</span>)}</span>
        </p>
      )}
      {!test && s.lastTestAt && <p className="text-[11.5px] text-slate">Last sandbox test: {s.lastTestOk ? 'passed' : 'failed'} — {s.lastTestMessage}</p>}

      <div className="divide-y divide-fog border-t border-fog">
        <div className="py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-charcoal">Report my sales to FBR</p>
            <p className="text-[11.5px] text-slate">{s.enabled ? `On (${s.mode === 'sandbox' ? 'test mode' : 'live'}).` : 'Off. Nothing is sent to FBR.'} Rupee orders only.</p>
          </div>
          <Toggle checked={s.enabled} disabled={!owner || !!busy || dirty} onChange={v => save({ enabled: v })} ariaLabel="Report my sales to FBR" />
        </div>
        <div className="py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-charcoal">Mode</p>
            <p className="text-[11.5px] text-slate">Test mode files into FBR&apos;s sandbox only. Live is disabled: production filing is locked until it has been verified and approved.</p>
          </div>
          <div className="w-[150px]">
            <Select aria-label="Mode" value={s.mode} disabled={!owner || !!busy || dirty} onChange={e => save({ mode: e.target.value as FbrMode })}>
              <option value="sandbox">Test</option>
              <option value="production" disabled>Live (locked)</option>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[12.5px] font-semibold text-charcoal mb-2">Invoices sent to FBR</p>
        <FbrInvoiceList referenceLabel="Order" stats={s.stats} refreshKey={refresh}
          load={async p => (await apiListStoreFbrInvoices(storeId, p)).data}
          retry={owner ? (id => apiRetryStoreFbrInvoice(storeId, id)) : undefined}
          resolve={owner ? ((id, body) => apiResolveStoreFbrInvoice(storeId, id, body)) : undefined} />
        <p className="text-[11.5px] text-slate mt-2">If an order you reported is later cancelled or refunded, it shows here as &quot;needs a credit/debit note&quot;. File that note in FBR&apos;s portal; Solvexo does not do it automatically.</p>
      </div>
    </div>
  );
}
