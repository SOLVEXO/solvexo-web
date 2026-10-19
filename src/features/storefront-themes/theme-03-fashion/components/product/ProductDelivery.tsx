import { useEffect, useMemo, useState } from 'react';
import { Truck } from 'lucide-react';
import i18n from '@/i18n';
import { apiGetShippingZones, type ShippingZone } from '@/api/services/shipping';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { ts } from '@/utils/tStatic';
import { moneyText } from '../../../core/money';
import { fashionTheme as t } from '../../theme.config';
import { controlStyle } from '../../ui/controlStyle';
import { arrivalText, countryName } from './deliveryText';

/** Estimated delivery under the buy box, from the store's own shipping zones. Shows nothing when the store has no delivery
 *  window to promise, so it can never invent a date. */
export function ProductDelivery({ storeId }: { storeId: string }) {
  const { currency } = useCurrencyPreference();
  const [zones, setZones] = useState<ShippingZone[] | null>(null);
  const [country, setCountry] = useState('');
  const lang = i18n.language || 'en';

  useEffect(() => {
    let off = false;
    apiGetShippingZones(storeId, currency)
      .then(r => { if (!off) setZones((r.data ?? []).filter(z => z.zoneType === 'shipping' && z.status === 'active' && !z.isDelete)); })
      .catch(() => { if (!off) setZones([]); });
    return () => { off = true; };
  }, [storeId, currency]);

  const countries = useMemo(() => Array.from(new Set((zones ?? []).map(z => z.country).filter(Boolean))), [zones]);
  const active = country && countries.includes(country) ? country : countries[0];
  const best = useMemo(() => {
    const own = (zones ?? []).filter(z => z.country === active);
    // the cheapest rate that comes with a delivery window; the quickest one breaks a tie
    return own.filter(z => z.minDays != null || z.maxDays != null).sort((a, b) => a.shippingPrice - b.shippingPrice || (a.minDays ?? 99) - (b.minDays ?? 99))[0] ?? null;
  }, [zones, active]);

  if (!zones || !active || !best) return null;
  const arrival = arrivalText(best.minDays, best.maxDays, lang);
  if (!arrival) return null;
  const price = best.shippingPrice > 0 ? ts('product.shippingFrom', 'Shipping {{price}}', { price: moneyText(best.shippingPrice, currency) }) : ts('product.freeDelivery', 'Free delivery');
  const freeOver = best.freeShippingThreshold ? ts('product.freeShippingOver', 'Free shipping on orders over {{amount}}', { amount: moneyText(best.freeShippingThreshold, currency) }) : null;

  return (
    <div className="flex flex-col gap-2 p-4" style={{ background: t.colors.bgAlt, borderRadius: 18, fontFamily: t.fonts.body }} role="group" aria-label={ts('product.delivery', 'Delivery')}>
      <div className="flex items-start gap-3">
        <Truck size={18} aria-hidden className="mt-0.5 shrink-0" />
        <div className="min-w-0 text-sm">
          <p className="m-0 font-semibold">{arrival}</p>
          <p className="m-0" style={{ color: t.colors.inkMuted }}>{price}{countries.length === 1 ? ` · ${ts('product.deliveryTo', 'Delivery to {{country}}', { country: countryName(active, lang) })}` : ''}</p>
          {freeOver && <p className="m-0 mt-0.5" style={{ color: t.colors.inkMuted }}>{freeOver}</p>}
        </div>
      </div>
      {countries.length > 1 && (
        <select aria-label={ts('product.deliverTo', 'Deliver to')} value={active} onChange={e => setCountry(e.target.value)} style={{ ...controlStyle(), minHeight: 40, fontSize: 14, padding: '6px 14px' }}>
          {countries.map(c => <option key={c} value={c}>{countryName(c, lang)}</option>)}
        </select>
      )}
    </div>
  );
}
