import { useEffect, useState } from 'react';
import { apiGetPosSettings, apiUpdatePosSettings, type PosSettings } from '@/api/commerce/posSettings';
import { DarkField, DarkInput, DarkTextarea, DarkButton, DarkSkeleton } from './darkUi';

interface SettingsTabProps { storeId: string }

export function SettingsTab({ storeId }: SettingsTabProps) {
  const [settings, setSettings] = useState<PosSettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const [taxRatePct, setTaxRatePct]     = useState('0');
  const [receiptHeader, setReceiptHeader] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('');

  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGetPosSettings(storeId)
      .then(res => {
        if (cancelled) return;
        const s = res.data;
        setSettings(s);
        setTaxRatePct(String((s.taxRate ?? 0) * 100));
        setReceiptHeader(s.receiptHeader ?? '');
        setReceiptFooter(s.receiptFooter ?? '');
        setBusinessName(s.businessName ?? '');
        setBusinessAddress(s.businessAddress ?? '');
        setCurrencySymbol(s.currencySymbol ?? '');
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load POS settings.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId]);

  async function handleSave() {
    setSaveError('');
    setSaved(false);
    setSaving(true);
    try {
      await apiUpdatePosSettings(storeId, {
        taxRate: Math.max(0, Math.min(100, parseFloat(taxRatePct) || 0)) / 100,
        receiptHeader: receiptHeader || undefined,
        receiptFooter: receiptFooter || undefined,
        businessName: businessName || undefined,
        businessAddress: businessAddress || undefined,
        currencySymbol: currencySymbol || undefined,
      });
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex flex-col gap-3 max-w-[520px]">{Array.from({ length: 5 }).map((_, i) => <DarkSkeleton key={i} height={54} />)}</div>;
  }
  if (error || !settings) {
    return <p className="text-[13px] text-error">{error}</p>;
  }

  return (
    <div className="max-w-[520px]">
      <p className="text-[15px] font-semibold text-white mb-4">POS Settings</p>

      <DarkField label="Tax Rate" hint="Applied to the sale subtotal when a sale doesn't specify its own tax amount.">
        <DarkInput rightIcon="%" inputMode="decimal" value={taxRatePct} onChange={e => setTaxRatePct(e.target.value)} placeholder="0" />
      </DarkField>
      <DarkField label="Currency Symbol">
        <DarkInput value={currencySymbol} onChange={e => setCurrencySymbol(e.target.value)} placeholder="$" />
      </DarkField>
      <DarkField label="Business Name">
        <DarkInput value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="My Store LLC" />
      </DarkField>
      <DarkField label="Business Address">
        <DarkInput value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder="123 Main St, Karachi" />
      </DarkField>
      <DarkField label="Receipt Header">
        <DarkTextarea value={receiptHeader} onChange={e => setReceiptHeader(e.target.value)} placeholder="Thank you for shopping with us!" rows={2} />
      </DarkField>
      <DarkField label="Receipt Footer">
        <DarkTextarea value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} placeholder="Returns accepted within 7 days." rows={2} />
      </DarkField>

      {saveError && <p className="text-[12px] text-error mb-3">{saveError}</p>}
      {saved && <p className="text-[12px] text-success mb-3">Settings saved.</p>}

      <DarkButton onClick={handleSave} loading={saving}>Save Settings</DarkButton>
    </div>
  );
}
