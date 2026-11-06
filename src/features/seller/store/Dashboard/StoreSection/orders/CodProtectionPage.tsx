import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { apiGetCodSettings, apiSaveCodSettings, type CodSettings } from '@/api/services/codProtection';
import { errorMessage } from '@/api/errorMessage';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Button, Card, EmptyState, Input, Textarea } from '@/components/comman/ui';

interface Form {
  enabled: boolean; confirmNewCustomers: boolean; highRiskPrepayOnly: boolean;
  maxCodAmount: string; confirmAboveAmount: string; highRiskScore: string; confirmationHours: string;
  flaggedCities: string; blockedPhones: string; blockedAddresses: string;
}

const toForm = (s: CodSettings): Form => ({
  enabled: s.enabled, confirmNewCustomers: s.confirmNewCustomers, highRiskPrepayOnly: s.highRiskPrepayOnly,
  maxCodAmount: s.maxCodAmount == null ? '' : String(s.maxCodAmount), confirmAboveAmount: s.confirmAboveAmount == null ? '' : String(s.confirmAboveAmount),
  highRiskScore: String(s.highRiskScore), confirmationHours: String(s.confirmationHours),
  flaggedCities: s.flaggedCities.join('\n'), blockedPhones: s.blockedPhones.map(p => `+${p}`).join('\n'), blockedAddresses: s.blockedAddresses.join('\n'),
});
const lines = (v: string) => v.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

export default function CodProtectionPage() {
  const { storeId } = useStoreWorkspace();
  const toast = useToast();
  const canEdit = can('settings.payments.manage');
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!canEdit) return;
    let off = false;
    apiGetCodSettings(storeId).then(s => { if (!off) { setForm(toForm(s)); setError(null); } }).catch(e => { if (!off) setError(errorMessage(e)); });
    return () => { off = true; };
  }, [storeId, canEdit, tick]);

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const saved = await apiSaveCodSettings(storeId, {
        enabled: form.enabled, confirmNewCustomers: form.confirmNewCustomers, highRiskPrepayOnly: form.highRiskPrepayOnly,
        maxCodAmount: numOrNull(form.maxCodAmount), confirmAboveAmount: numOrNull(form.confirmAboveAmount),
        highRiskScore: Number(form.highRiskScore), confirmationHours: Number(form.confirmationHours),
        flaggedCities: lines(form.flaggedCities), blockedPhones: lines(form.blockedPhones), blockedAddresses: lines(form.blockedAddresses),
      });
      setForm(toForm(saved));
      toast.success('COD protection saved');
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  }
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => (f ? { ...f, [k]: e.target.value } : f));
  const check = (k: 'enabled' | 'confirmNewCustomers' | 'highRiskPrepayOnly') => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => (f ? { ...f, [k]: e.target.checked } : f));

  return (
    <>
      <StorePageHeader title="COD protection" subtitle="Cut fake and undeliverable cash-on-delivery orders" />
      <div className="flex w-full flex-col gap-4 px-4 pb-8 pt-5 lg:px-7">
        {!canEdit ? <EmptyState icon={<Lock size={22} />} title="No access" description="Your role cannot change payment settings." />
          : error ? (
            <div role="alert" className="flex items-center gap-3 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-[13px] text-error">
              <span className="flex-1">{error}</span><Button size="xs" variant="outline" onClick={() => setTick(t => t + 1)}>Retry</Button>
            </div>
          ) : !form ? <p className="text-[13px] text-slate" aria-busy="true">Loading…</p> : (
            <>
              <Card padding="md">
                <label className="flex items-start gap-3 text-[13px] text-carbon">
                  <input type="checkbox" className="mt-0.5" checked={form.enabled} onChange={check('enabled')} />
                  <span><strong className="block text-[14px]">Protect cash-on-delivery orders</strong>
                    Check every COD order against the rules below, using only your own history with the customer. Orders that need it are held until the customer confirms by a link we send (email, and WhatsApp when you have it set up). Unconfirmed orders are cancelled automatically and the stock goes back.</span>
                </label>
              </Card>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card padding="md"><h2 className="m-0 mb-3 text-[14px] font-semibold text-carbon">Ask for confirmation</h2>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 text-[13px] text-carbon"><input type="checkbox" checked={form.confirmNewCustomers} onChange={check('confirmNewCustomers')} /> First order from this customer with your store</label>
                    <Input label="Orders from this total up (store currency, empty = never)" type="number" min={1} value={form.confirmAboveAmount} onChange={set('confirmAboveAmount')} />
                    <Textarea label="Flagged delivery cities (one per line)" rows={4} value={form.flaggedCities} onChange={set('flaggedCities')} />
                    <Input label="Hours the customer has to confirm" type="number" min={1} max={168} value={form.confirmationHours} onChange={set('confirmationHours')} />
                  </div>
                </Card>
                <Card padding="md"><h2 className="m-0 mb-3 text-[14px] font-semibold text-carbon">Refuse cash on delivery</h2>
                  <div className="flex flex-col gap-3">
                    <Input label="Maximum COD order total (store currency, empty = no limit)" type="number" min={1} value={form.maxCodAmount} onChange={set('maxCodAmount')} />
                    <Textarea label="Blocked phone numbers (one per line, any format)" rows={4} value={form.blockedPhones} onChange={set('blockedPhones')} />
                    <Textarea label="Blocked address fragments (one per line, at least 6 characters)" rows={4} value={form.blockedAddresses} onChange={set('blockedAddresses')} />
                    <p className="m-0 text-xs text-slate">These customers can still pay by card or bank transfer.</p>
                  </div>
                </Card>
              </div>

              <Card padding="md"><h2 className="m-0 mb-3 text-[14px] font-semibold text-carbon">Risk score</h2>
                <div className="flex flex-col gap-3 sm:max-w-md">
                  <p className="m-0 text-xs text-slate">Every order gets a score from 0 to 100 from this customer's earlier orders with you (cancelled COD orders, returns, parcels that came back undelivered) and the rules above.</p>
                  <Input label="High risk from score" type="number" min={10} max={100} value={form.highRiskScore} onChange={set('highRiskScore')} />
                  <label className="flex items-start gap-2 text-[13px] text-carbon"><input type="checkbox" className="mt-0.5" checked={form.highRiskPrepayOnly} onChange={check('highRiskPrepayOnly')} /> High-risk customers cannot use cash on delivery at all (otherwise they only need to confirm)</label>
                </div>
              </Card>

              <div><Button loading={saving} onClick={() => void save()}>Save</Button></div>
            </>
          )}
      </div>
    </>
  );
}
