import { Field, Select } from '@/components/comman/ui';
import { useShippingProfiles } from '@/hooks/shipping/useShippingProfiles';

/**
 * Shopify "Shipping profile" selector for a physical product. '' = General profile. Renders nothing until the
 * store has at least one custom profile, so stores that never use profiles see no new UI.
 */
export function ShippingProfileField({ storeId, value, onChange }: {
  storeId: string;
  value: string;
  onChange: (profileId: string) => void;
}) {
  const { data } = useShippingProfiles(storeId);
  const custom = (data?.profiles ?? []).filter(p => !p.isGeneral);
  if (custom.length === 0) return null;
  return (
    <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-bone">
        <p className="text-[13px] font-bold text-charcoal">Shipping</p>
      </div>
      <div className="px-5 py-4">
      <Field label="Shipping profile" hint="Decides which shipping rates and ship-from location apply to this product at checkout. Manage profiles under Shipping.">
        <Select value={value} onChange={e => onChange(e.target.value)} aria-label="Shipping profile">
          <option value="">General profile</option>
          {custom.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </Select>
      </Field>
      </div>
    </div>
  );
}
