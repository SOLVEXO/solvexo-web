import { useState } from 'react';
import { AlertCircle, CheckCircle2, FileCheck2 } from 'lucide-react';
import { Button, Input, Select, Toggle } from '@/components/comman/ui';
import { SettingsCard, SettingsRow } from '@/components/comman/settings';
import { FbrInvoiceList } from '@/components/comman/fbr/FbrInvoiceList';
import { useKeyedLoad } from '@/components/comman/dashboard/useKeyedLoad';
import { useToast } from '@/contexts/ToastContext';
import {
  apiGetPlatformFbr, apiListPlatformFbrInvoices, apiPlatformFbrProvinces, apiResolvePlatformFbrInvoice, apiRetryPlatformFbrInvoice, apiTestPlatformFbr, apiUpdatePlatformFbr,
  type FbrMode, type FbrTestResult, type PlatformFbrSettings,
} from '@/api/services/fbrDi';

function errMsg(e: unknown, fallback: string) { return e instanceof Error && e.message ? e.message : fallback; }

type Editable = 'province' | 'scenarioId' | 'hsCode' | 'uom' | 'saleType';
const FIELDS: Editable[] = ['province', 'scenarioId', 'hsCode', 'uom', 'saleType'];

/**
 * Admin → Settings → Tax → FBR digital invoicing: Solvexo files an invoice with FBR for every plan fee a seller pays.
 * The security tokens are Railway variables (never typed or stored here); this page only switches reporting on/off and sets the invoice details.
 */
export function AdminFbrInvoicing() {
  const toast = useToast();
  const { data: loaded, error: loadError, retry } = useKeyedLoad(async () => (await apiGetPlatformFbr()).data, 'platform');
  const { data: provinceList } = useKeyedLoad(() => apiPlatformFbrProvinces().then(r => r.data).catch(() => [] as string[]), 'provinces');
  const [saved, setSaved] = useState<PlatformFbrSettings | null>(null); // newest copy returned by a save / test
  const [edits, setEdits] = useState<Partial<Record<Editable, string>>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<FbrTestResult | null>(null);
  const [refresh, setRefresh] = useState(0);

  const s = saved ?? loaded;
  if (loadError && !s) {
    return (
      <div className="px-4 sm:px-7 pb-6">
        <div role="alert" className="rounded-xl border border-error/30 bg-error-bg px-4 py-3 text-[12.5px] text-error flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5"><AlertCircle size={14} />{loadError}</span>
          <Button size="sm" variant="outline" onClick={retry}>Try again</Button>
        </div>
      </div>
    );
  }
  if (!s) return <div className="px-4 sm:px-7 pb-6"><div className="h-32 rounded-xl bg-bone animate-pulse" aria-label="Loading FBR settings" /></div>;

  const value = (k: Editable): string => edits[k] ?? (s[k] ?? '');
  const dirty = FIELDS.some(k => edits[k] !== undefined && edits[k] !== (s[k] ?? ''));
  const form = { province: value('province'), scenarioId: value('scenarioId'), hsCode: value('hsCode'), uom: value('uom'), saleType: value('saleType') };
  const tokenVar = (m: FbrMode) => (m === 'production' ? 'FBR_DI_TOKEN_PRODUCTION' : 'FBR_DI_TOKEN_SANDBOX');
  const missingIdentity = [!s.identity.ntn && 'NTN', !s.identity.legalName && 'registered business name', !s.identity.address && 'registered address'].filter(Boolean) as string[];
  const provinces = provinceList ?? [];

  const save = async (extra: Partial<{ enabled: boolean; mode: FbrMode }> = {}) => {
    setSaving(true);
    try {
      setSaved((await apiUpdatePlatformFbr({ ...form, ...extra })).data);
      setEdits({});
      toast.success('FBR invoicing settings saved.');
      setRefresh(n => n + 1);
    } catch (e) { toast.error(errMsg(e, 'Could not save.')); } finally { setSaving(false); }
  };
  const runTest = async () => {
    setTesting(true); setTest(null);
    try { setTest((await apiTestPlatformFbr()).data); setSaved((await apiGetPlatformFbr()).data); } catch (e) { setTest({ ok: false, message: errMsg(e, 'Test failed'), errors: [] }); } finally { setTesting(false); }
  };

  return (
    <div className="px-4 sm:px-7 pb-8 flex flex-col gap-5">
      <SettingsCard
        title="FBR digital invoicing"
        icon={<FileCheck2 size={14} />}
        description="Solvexo files a sales-tax invoice with FBR for every plan fee a seller pays. Plan invoices paid after you switch it on are reported; older ones never are."
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-cream px-3 py-2.5 text-[12.5px] leading-relaxed text-slate">
            <b>Your invoice details</b> come from the Tax profile above: {s.identity.legalName || '—'}, NTN {s.identity.ntn || '—'}, {s.identity.address || '—'}.
            {missingIdentity.length > 0 && <span className="text-error"> Missing: {missingIdentity.join(', ')}.</span>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(['sandbox'] as FbrMode[]).map(m => (
              <div key={m} className="rounded-lg border border-bone px-3 py-2.5 text-[12.5px]">
                <p className="font-semibold text-charcoal">Test (sandbox) token</p>
                <p className={`mt-0.5 flex items-center gap-1.5 ${s.tokenConfigured[m] ? 'text-success' : 'text-slate'}`}>
                  {s.tokenConfigured[m] ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {s.tokenConfigured[m] ? 'Found on the server' : <>Not set. Add <code className="font-mono">{tokenVar(m)}</code> in Railway → Variables, then redeploy.</>}
                </p>
              </div>
            ))}
            <div className="rounded-lg border border-bone px-3 py-2.5 text-[12.5px] text-slate">
              <p className="font-semibold text-charcoal">Live (production) filing: locked</p>
              <p className="mt-0.5">Only FBR&apos;s test system is used for now. Live filing stays switched off until it has been verified and approved.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {provinces.length > 0 ? (
              <Select label="Solvexo's province (as FBR lists it)" value={form.province} onChange={e => setEdits(x => ({ ...x, province: e.target.value }))}>
                <option value="">Choose province</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            ) : (
              <Input label="Solvexo's province" value={form.province} maxLength={60} onChange={e => setEdits(x => ({ ...x, province: e.target.value }))} />
            )}
            <Input label="HS code for the plan fee" placeholder="0000.0000" value={form.hsCode} maxLength={12} onChange={e => setEdits(x => ({ ...x, hsCode: e.target.value }))} />
            <Input label="Sale type (as FBR lists it)" value={form.saleType} maxLength={80} onChange={e => setEdits(x => ({ ...x, saleType: e.target.value }))} />
            <Input label="Unit of measure (as FBR lists it)" value={form.uom} maxLength={80} onChange={e => setEdits(x => ({ ...x, uom: e.target.value }))} />
            <Input label="Sandbox scenario" placeholder="SN019" value={form.scenarioId} maxLength={5} onChange={e => setEdits(x => ({ ...x, scenarioId: e.target.value.toUpperCase() }))} />
          </div>
          <p className="text-[11.5px] text-slate">Ask your accountant for the HS / service code and the sale type that apply to software subscriptions. SN019 is FBR&apos;s test scenario for &quot;services rendered or provided&quot;.</p>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={saving} disabled={!dirty} onClick={() => save()}>Save details</Button>
            <Button size="sm" variant="outline" loading={testing} disabled={dirty || !s.tokenConfigured.sandbox} onClick={runTest}>Test with FBR sandbox</Button>
          </div>
          {dirty && <p className="text-[11.5px] text-slate">Save your changes before testing.</p>}
          {test && (
            <p role="status" className={`flex items-start gap-1.5 text-[12.5px] ${test.ok ? 'text-success' : 'text-error'}`}>
              {test.ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
              <span>{test.message}{!test.ok && test.errors.slice(1, 4).map((e, i) => <span key={i} className="block">{e.code ? `${e.code}: ` : ''}{e.message}</span>)}</span>
            </p>
          )}
          {!test && s.lastTestAt && <p className="text-[11.5px] text-slate">Last sandbox test: {s.lastTestOk ? 'passed' : 'failed'} — {s.lastTestMessage}</p>}
        </div>

        <div className="mt-2 divide-y divide-fog border-t border-fog">
          <SettingsRow label="Report to FBR" description={s.enabled ? 'On. New plan invoices are filed automatically a few minutes after payment.' : 'Off. Nothing is sent to FBR.'}>
            <Toggle checked={s.enabled} onChange={v => save({ enabled: v })} disabled={saving || dirty} ariaLabel="Report plan invoices to FBR" />
          </SettingsRow>
          <SettingsRow label="Mode" description="Sandbox files into FBR's test system only. Live is disabled: production filing is locked until it has been verified and approved.">
            <div className="w-[160px]">
              <Select aria-label="Mode" value={s.mode} disabled={saving || dirty} onChange={e => save({ mode: e.target.value as FbrMode })}>
                <option value="sandbox">Sandbox (test)</option>
                <option value="production" disabled>Live (locked)</option>
              </Select>
            </div>
          </SettingsRow>
        </div>
      </SettingsCard>

      <SettingsCard title="Invoices sent to FBR" icon={<FileCheck2 size={14} />} description="Each paid plan invoice, its FBR number, and the exact reason when FBR did not accept it. A refunded invoice needs its credit/debit note filed by your accountant in FBR's portal.">
        <FbrInvoiceList referenceLabel="Plan invoice" stats={s.stats} refreshKey={refresh}
          load={async p => (await apiListPlatformFbrInvoices(p)).data}
          retry={id => apiRetryPlatformFbrInvoice(id)}
          resolve={(id, body) => apiResolvePlatformFbrInvoice(id, body)} />
      </SettingsCard>
    </div>
  );
}
