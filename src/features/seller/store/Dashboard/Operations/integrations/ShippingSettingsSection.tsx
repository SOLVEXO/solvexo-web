import { useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { Button, Field, Input, Select } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { apiUpdateShippingSettings, type ShippingPackage } from '@/api/services/integrations';

interface DraftPackage {
  id?: string;
  name: string;
  length: string;
  width: string;
  height: string;
  unit: 'cm' | 'in';
  emptyWeight: string;
  isDefault: boolean;
}

function toDraft(p: ShippingPackage): DraftPackage {
  return {
    id: p.id, name: p.name, length: String(p.length), width: String(p.width), height: String(p.height),
    unit: p.unit, emptyWeight: String(p.emptyWeight ?? 0), isDefault: p.isDefault,
  };
}

const blankPackage = (isDefault: boolean): DraftPackage => ({
  name: '', length: '', width: '', height: '', unit: 'cm', emptyWeight: '0', isDefault,
});

/** Shopify "Packages" + live-rate handling fee, stored on the connected Shippo integration. */
export function ShippingSettingsSection({ storeId, config, onSaved }: {
  storeId: string;
  config: Record<string, unknown>;
  onSaved: () => void;
}) {
  const toast = useToast();
  const savedPackages = Array.isArray(config.packages) ? (config.packages as ShippingPackage[]) : [];
  const [feeType, setFeeType] = useState<'' | 'flat' | 'percent'>(
    config.handlingFeeType === 'flat' || config.handlingFeeType === 'percent' ? config.handlingFeeType : '',
  );
  const [feeValue, setFeeValue] = useState(config.handlingFeeValue ? String(config.handlingFeeValue) : '');
  const [packages, setPackages] = useState<DraftPackage[]>(savedPackages.map(toDraft));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (i: number, patch: Partial<DraftPackage>) =>
    setPackages(list => list.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const setDefault = (i: number) => setPackages(list => list.map((p, idx) => ({ ...p, isDefault: idx === i })));
  const remove = (i: number) => setPackages(list => {
    const next = list.filter((_, idx) => idx !== i);
    if (next.length > 0 && !next.some(p => p.isDefault)) next[0] = { ...next[0], isDefault: true };
    return next;
  });

  async function save() {
    setError('');
    const fee = feeType ? Number(feeValue || 0) : 0;
    if (feeType && (!Number.isFinite(fee) || fee < 0)) { setError('Handling fee must be 0 or more.'); return; }
    if (feeType === 'percent' && fee > 100) { setError('Handling fee percentage cannot exceed 100.'); return; }
    const parsed = [];
    for (const [i, p] of packages.entries()) {
      const length = Number(p.length), width = Number(p.width), height = Number(p.height), emptyWeight = Number(p.emptyWeight || 0);
      if (!p.name.trim()) { setError(`Package ${i + 1}: name is required.`); return; }
      if (![length, width, height].every(n => Number.isFinite(n) && n > 0)) { setError(`Package "${p.name || i + 1}": length, width and height must be greater than 0.`); return; }
      if (!Number.isFinite(emptyWeight) || emptyWeight < 0) { setError(`Package "${p.name}": empty weight must be 0 or more.`); return; }
      parsed.push({ id: p.id, name: p.name.trim(), length, width, height, unit: p.unit, emptyWeight, isDefault: p.isDefault });
    }
    setSaving(true);
    try {
      await apiUpdateShippingSettings(storeId, { handlingFeeType: feeType || null, handlingFeeValue: fee, packages: parsed });
      toast.success('Shipping settings saved.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save shipping settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-bone pt-4 flex flex-col gap-4">
      <p className="text-[11.5px] text-slate">
        Live rates ship from the address above unless a shipping profile has a ship-from location with a full address
        (Shipping &rarr; Manage profiles) — that location is then used for the profile's products.
      </p>
      <div>
        <p className="text-[12.5px] font-bold text-carbon mb-0.5">Handling fee</p>
        <p className="text-[11.5px] text-slate mb-2">Added on top of live carrier rates shown to buyers at checkout. Labels you buy are not affected.</p>
        <div className="grid grid-cols-2 gap-2.5 max-w-[360px]">
          <Field label="Type">
            <Select value={feeType} onChange={e => setFeeType(e.target.value as '' | 'flat' | 'percent')} disabled={saving}>
              <option value="">No handling fee</option>
              <option value="flat">Flat amount</option>
              <option value="percent">Percentage</option>
            </Select>
          </Field>
          <Field label={feeType === 'percent' ? 'Percent (%)' : 'Amount'}>
            <Input type="number" min={0} step="any" value={feeValue} onChange={e => setFeeValue(e.target.value)} disabled={saving || !feeType} />
          </Field>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-[12.5px] font-bold text-carbon">Packages</p>
          <Button size="sm" variant="outline" disabled={saving || packages.length >= 25} onClick={() => setPackages(l => [...l, blankPackage(l.length === 0)])}>
            <Plus size={13} /> Add package
          </Button>
        </div>
        <p className="text-[11.5px] text-slate mb-2">The default package sets the box size and empty weight used to quote live rates and labels. Without one, 20 × 15 × 10 cm is assumed.</p>
        {packages.length === 0 ? (
          <p className="text-[12px] text-slate">No saved packages yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {packages.map((p, i) => (
              <div key={p.id ?? `new-${i}`} className="border border-bone rounded-[10px] p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setDefault(i)}
                    disabled={saving}
                    className={`inline-flex items-center gap-1 text-[11.5px] font-semibold ${p.isDefault ? 'text-brand-orange' : 'text-slate hover:text-carbon'}`}
                    aria-pressed={p.isDefault}
                  >
                    <Star size={12} fill={p.isDefault ? 'currentColor' : 'none'} /> {p.isDefault ? 'Default package' : 'Make default'}
                  </button>
                  <Button size="sm" variant="outline" aria-label={`Remove package ${p.name || i + 1}`} disabled={saving} onClick={() => remove(i)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                  <div className="col-span-2 sm:col-span-6"><Field label="Name" required><Input value={p.name} maxLength={60} onChange={e => update(i, { name: e.target.value })} disabled={saving} /></Field></div>
                  <Field label="Length" required><Input type="number" min={0} step="any" value={p.length} onChange={e => update(i, { length: e.target.value })} disabled={saving} /></Field>
                  <Field label="Width" required><Input type="number" min={0} step="any" value={p.width} onChange={e => update(i, { width: e.target.value })} disabled={saving} /></Field>
                  <Field label="Height" required><Input type="number" min={0} step="any" value={p.height} onChange={e => update(i, { height: e.target.value })} disabled={saving} /></Field>
                  <Field label="Unit">
                    <Select value={p.unit} onChange={e => update(i, { unit: e.target.value as 'cm' | 'in' })} disabled={saving}>
                      <option value="cm">cm</option>
                      <option value="in">in</option>
                    </Select>
                  </Field>
                  <div className="col-span-2"><Field label="Empty weight (kg)"><Input type="number" min={0} step="any" value={p.emptyWeight} onChange={e => update(i, { emptyWeight: e.target.value })} disabled={saving} /></Field></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-[12px] text-error" role="alert">{error}</p>}
      <div>
        <Button size="sm" onClick={save} loading={saving}>Save shipping settings</Button>
      </div>
    </div>
  );
}
