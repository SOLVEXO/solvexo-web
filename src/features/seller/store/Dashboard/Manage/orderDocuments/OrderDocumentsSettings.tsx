import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button, Card, Input, SkeletonBox, Textarea, Toggle } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { apiGetOrderDocuments, saveOrderDocuments } from '@/api/services/orderDocuments';
import {
  buildDocumentsHtml, DEFAULT_DOCUMENT_SETTINGS, SAMPLE_DOCUMENT_ORDER,
  type DocKind, type OrderDocumentSettings, type OrderDocumentStore,
} from '@/utils/orderDocuments';

/** This section is flat: no card/button glow or drop shadows (focus rings are untouched). */
const NO_SHADOWS = '[&_.surface-panel]:!shadow-none [&_.surface-panel:hover]:!shadow-none [&_button]:!shadow-none [&_button:hover]:!shadow-none';
const SELECT = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none focus:border-brand-orange';

const PAPER = [
  { value: 'a4', label: 'A4' }, { value: 'a5', label: 'A5 (half page)' },
  { value: 'letter', label: 'US Letter' }, { value: 'thermal80', label: '80 mm receipt (thermal printer)' },
];
const SIZES = [{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }];
const ALIGNS = [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }];

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Card>
      <h3 className="text-[14px] font-bold text-charcoal m-0">{title}</h3>
      {hint ? <p className="text-[11.5px] text-slate mt-0.5 mb-3">{hint}</p> : <div className="mb-3" />}
      <div className="flex flex-col gap-3">{children}</div>
    </Card>
  );
}

function Row({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13px] text-charcoal">{label}</p>
        {hint && <p className="text-[11px] text-slate">{hint}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} ariaLabel={label} />
    </div>
  );
}

function Pick({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] font-medium text-charcoal">{label}</span>
      <select className={SELECT} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

/**
 * Settings → Order documents: how the packing slip and the invoice look for this store (logo, watermark, business
 * details, paper size, what each document shows), with a live preview of the exact document that gets printed.
 */
export function OrderDocumentsSettings({ storeId, canManage }: { storeId: string; canManage: boolean }) {
  const toast = useToast();
  const [saved, setSaved] = useState<OrderDocumentSettings | null>(null);
  const [draft, setDraft] = useState<OrderDocumentSettings | null>(null);
  const [store, setStore] = useState<OrderDocumentStore | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewKind, setPreviewKind] = useState<DocKind>('slip');

  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let off = false;
    apiGetOrderDocuments(storeId)
      .then(res => { if (!off) { setSaved(res.data.settings); setDraft(res.data.settings); setStore(res.data.store); } })
      .catch((e: unknown) => { if (!off) setError(e instanceof Error ? e.message : 'Could not load the document settings.'); });
    return () => { off = true; };
  }, [storeId, attempt]);
  const load = () => { setError(''); setAttempt(n => n + 1); };

  const set = <K extends keyof OrderDocumentSettings>(key: K, value: OrderDocumentSettings[K]) =>
    setDraft(d => (d ? { ...d, [key]: value } : d));
  const text = (key: keyof OrderDocumentSettings) => (e: { target: { value: string } }) => set(key, (e.target.value || null) as never);

  const dirty = useMemo(() => !!(saved && draft && JSON.stringify(saved) !== JSON.stringify(draft)), [saved, draft]);

  const previewHtml = useMemo(
    () => (draft && store ? buildDocumentsHtml(previewKind, [SAMPLE_DOCUMENT_ORDER], draft, store, { preview: true }) : ''),
    [draft, store, previewKind],
  );

  const save = async () => {
    if (!draft || !saved) return;
    const patch: Record<string, unknown> = {};
    for (const key of Object.keys(DEFAULT_DOCUMENT_SETTINGS) as (keyof OrderDocumentSettings)[]) {
      if (JSON.stringify(draft[key]) !== JSON.stringify(saved[key])) patch[key] = draft[key];
    }
    setSaving(true);
    try {
      const next = await saveOrderDocuments(storeId, patch as Partial<OrderDocumentSettings>);
      setSaved(next.settings); setDraft(next.settings); setStore(next.store);
      toast.success('Order documents saved.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-error/30 bg-error-bg p-4 text-[13px] text-error" role="alert">
        <AlertCircle size={16} /> <span className="flex-1">{error}</span>
        <Button size="sm" variant="outline" onClick={load}>Retry</Button>
      </div>
    );
  }
  if (!draft || !store) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
        <div className="flex flex-col gap-4">{[0, 1, 2].map(i => <SkeletonBox key={i} height={180} rounded="12px" />)}</div>
        <SkeletonBox height={560} rounded="12px" />
      </div>
    );
  }

  const off = !canManage;
  const logoAvailable = !!store.logo;

  return (
    <div className={`flex flex-col gap-5 w-full ${NO_SHADOWS}`}>
      <div>
        <h2 className="text-[18px] font-bold text-carbon">Order documents</h2>
        <p className="text-[12.5px] text-slate mt-0.5">Design the packing slip and the invoice you print from Orders. The preview on the right is exactly what gets printed.</p>
        {off && <p className="text-[12px] text-slate mt-1">You can look at these settings, but only people who manage store settings can change them.</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 items-start">
        <fieldset disabled={off} className="flex flex-col gap-4 border-0 p-0 m-0 min-w-0">
          <Section title="Your business details" hint="Printed in the header of both documents. Left empty, your store name and contact email are used.">
            <Input label="Business name" value={draft.companyName ?? ''} placeholder={store.name} maxLength={80} onChange={text('companyName')} />
            <Textarea label="Address" rows={3} maxLength={300} value={draft.addressText ?? ''} placeholder={'Street, city, country'} onChange={text('addressText')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Phone" value={draft.phone ?? ''} placeholder={store.phone ?? ''} maxLength={40} onChange={text('phone')} />
              <Input label="Email" type="email" value={draft.email ?? ''} placeholder={store.contactEmail ?? ''} maxLength={200} onChange={text('email')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Tax number label" value={draft.taxIdLabel ?? ''} placeholder="Tax ID" maxLength={30} onChange={text('taxIdLabel')} />
              <Input label="Tax number" value={draft.taxIdValue ?? ''} maxLength={60} onChange={text('taxIdValue')} />
            </div>
          </Section>

          <Section title="Look">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Pick label="Paper size" value={draft.paperSize} options={PAPER} onChange={v => set('paperSize', v as OrderDocumentSettings['paperSize'])} />
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-charcoal">Accent colour</span>
                <span className="flex items-center gap-2">
                  <input type="color" aria-label="Accent colour" className="h-9 w-12 rounded border border-bone bg-white p-0.5 cursor-pointer"
                    value={draft.accentColor ?? '#111111'} onChange={e => set('accentColor', e.target.value)} />
                  <span className="text-[12px] text-slate">{draft.accentColor ?? 'Black (default)'}</span>
                  {draft.accentColor && <button type="button" className="text-[12px] text-brand-orange bg-transparent border-0 cursor-pointer" onClick={() => set('accentColor', null)}>Reset</button>}
                </span>
              </label>
            </div>
            <Row label="Show my logo in the header" hint={logoAvailable ? undefined : 'Add a logo in Store Profile first.'} checked={draft.showLogo} onChange={v => set('showLogo', v)} />
            {draft.showLogo && logoAvailable && (
              <Row label="Also print my business name next to the logo" hint="Off: the logo replaces the name, like a letterhead." checked={draft.showNameWithLogo} onChange={v => set('showNameWithLogo', v)} />
            )}
            {draft.showLogo && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Pick label="Logo size" value={draft.logoSize} options={SIZES} onChange={v => set('logoSize', v as OrderDocumentSettings['logoSize'])} />
                <Pick label="Logo position" value={draft.logoAlign} options={ALIGNS} onChange={v => set('logoAlign', v as OrderDocumentSettings['logoAlign'])} />
              </div>
            )}
          </Section>

          <Section title="Watermark" hint="A faint mark behind the text on every page. Off by default.">
            <Row label="Add a watermark" checked={draft.watermarkEnabled} onChange={v => set('watermarkEnabled', v)} />
            {draft.watermarkEnabled && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Pick label="What to show" value={draft.watermarkType} onChange={v => set('watermarkType', v as 'logo' | 'text')}
                    options={[{ value: 'logo', label: 'My logo' }, { value: 'text', label: 'Text' }]} />
                  <Pick label="Layout" value={draft.watermarkPosition} onChange={v => set('watermarkPosition', v as 'center' | 'tiled')}
                    options={[{ value: 'center', label: 'One, in the middle' }, { value: 'tiled', label: 'Repeated all over' }]} />
                </div>
                {draft.watermarkType === 'logo' && !logoAvailable && (
                  <p className="text-[11.5px] text-error m-0">You have no logo yet, so your store name is used. Add a logo in Store Profile.</p>
                )}
                {draft.watermarkType === 'text' && (
                  <Input label="Watermark text" value={draft.watermarkText ?? ''} placeholder={store.name} maxLength={40} onChange={text('watermarkText')} />
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Pick label="Size" value={draft.watermarkSize} options={SIZES} onChange={v => set('watermarkSize', v as OrderDocumentSettings['watermarkSize'])} />
                  <Pick label="Tilt" value={String(draft.watermarkAngle)} onChange={v => set('watermarkAngle', Number(v) as OrderDocumentSettings['watermarkAngle'])}
                    options={[{ value: '0', label: 'Straight' }, { value: '-30', label: 'Slightly tilted' }, { value: '-45', label: 'Diagonal' }]} />
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-charcoal">Strength: {draft.watermarkOpacity}%</span>
                  <input type="range" min={3} max={25} step={1} value={draft.watermarkOpacity} aria-label="Watermark strength"
                    onChange={e => set('watermarkOpacity', Number(e.target.value))} className="w-full accent-brand-orange" />
                  <span className="text-[11px] text-slate">Keep it light so the text stays easy to read.</span>
                </label>
              </>
            )}
          </Section>

          <Section title="Packing slip" hint="For whoever packs the order. Switch prices off for a plain picking list.">
            <Row label="Show prices and totals" checked={draft.slipShowPrices} onChange={v => set('slipShowPrices', v)} />
            <Row label="Show product images" checked={draft.slipShowImages} onChange={v => set('slipShowImages', v)} />
            <Row label="Show SKU" checked={draft.slipShowSku} onChange={v => set('slipShowSku', v)} />
            <Row label="Tick boxes to check items off" checked={draft.slipShowCheckbox} onChange={v => set('slipShowCheckbox', v)} />
            <Row label="Show the customer's note" checked={draft.slipShowNote} onChange={v => set('slipShowNote', v)} />
            <Row label="Show payment status" hint="Cash on delivery orders show the amount to collect." checked={draft.slipShowPayment} onChange={v => set('slipShowPayment', v)} />
            <Textarea label="Thank-you message" rows={2} maxLength={300} value={draft.slipMessage ?? ''} placeholder="Thank you for shopping with us!" onChange={text('slipMessage')} />
            <Textarea label="Footer" rows={2} maxLength={300} value={draft.slipFooter ?? ''} placeholder="Returns accepted within 7 days. Questions? Write to us." onChange={text('slipFooter')} />
          </Section>

          <Section title="Invoice" hint="For your customer: items, discounts, shipping, tax, total and what is still to pay.">
            <Input label="Document title" value={draft.invoiceTitle ?? ''} placeholder="Invoice" maxLength={30} onChange={text('invoiceTitle')} />
            <Row label="Show product images" checked={draft.invoiceShowImages} onChange={v => set('invoiceShowImages', v)} />
            <Row label="Show SKU" checked={draft.invoiceShowSku} onChange={v => set('invoiceShowSku', v)} />
            <Row label="Show my tax number" checked={draft.invoiceShowTaxId} onChange={v => set('invoiceShowTaxId', v)} />
            <Textarea label="Terms and notes" rows={3} maxLength={600} value={draft.invoiceTerms ?? ''} placeholder="Payment terms, bank details, return policy…" onChange={text('invoiceTerms')} />
            <Textarea label="Footer" rows={2} maxLength={300} value={draft.invoiceFooter ?? ''} placeholder="Thank you for your business." onChange={text('invoiceFooter')} />
          </Section>
        </fieldset>

        <div className="xl:sticky xl:top-4 flex flex-col gap-3 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div role="tablist" aria-label="Preview" className="inline-flex rounded-lg border border-bone bg-white p-0.5">
              {(['slip', 'invoice'] as const).map(k => (
                <button key={k} type="button" role="tab" aria-selected={previewKind === k} onClick={() => setPreviewKind(k)}
                  className={`px-3 py-1.5 text-[12.5px] rounded-md border-0 cursor-pointer ${previewKind === k ? 'bg-carbon text-white' : 'bg-transparent text-charcoal'}`}>
                  {k === 'slip' ? 'Packing slip' : 'Invoice'}
                </button>
              ))}
            </div>
            <span className="text-[11.5px] text-slate">Sample order</span>
          </div>
          <iframe title="Document preview" srcDoc={previewHtml} sandbox="" className="w-full rounded-xl border border-bone bg-white" style={{ height: 'min(80vh, 760px)' }} />
        </div>
      </div>

      {canManage && (
        <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-end gap-3 border-t border-bone bg-white/95 px-1 py-3 backdrop-blur">
          <span className="mr-auto text-[12px] text-slate" role="status">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
          <Button variant="outline" size="sm" disabled={!dirty || saving} onClick={() => setDraft(saved)}>Discard</Button>
          <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>Save</Button>
        </div>
      )}
    </div>
  );
}
