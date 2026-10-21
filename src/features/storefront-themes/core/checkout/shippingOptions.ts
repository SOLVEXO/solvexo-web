import type { LiveShippingRate, ShippingZone } from '@/api/services/shipping';
import { zoneArrivalRange, zoneLabel, zoneMatchesAddress } from '@/utils/shippingZoneDisplay';
import { ts } from '@/utils/tStatic';

/** One selectable delivery option: a live carrier rate or one of the store's own zone rates. */
export interface ShipOption {
  /** Live rate id or zone id (this is what the backend receives). */
  _id: string;
  kind: 'live' | 'zone';
  label: string;
  /** Amount exactly as the source returned it, in `priceCurrency`. */
  price: number;
  priceCurrency: string;
  eta: string | null;
  arrival: string | null;
  zoneType: string;
  groupKey?: string;
  pickupAddress?: string | null;
  pickupInstructions?: string | null;
}

export interface AddressLike {
  country?: string | null; city?: string | null; state?: string | null; addressLine1?: string | null; zipCode?: string | null;
  latitude?: number | null; longitude?: number | null;
}

interface BuildArgs {
  zones: ShippingZone[];
  liveRates: LiveShippingRate[];
  address: AddressLike | null;
  /** Currency the zones were requested in (the server converts zone prices into it). */
  zoneCurrency: string;
  sameCountry: (a: string, b: string) => boolean;
}

/**
 * Country is the required first filter (a zero-match must never fall back to other countries' zones); city / province
 * only refine inside the buyer's own country. Pickup and local delivery are always kept.
 */
export function buildShipOptions({ zones, liveRates, address, zoneCurrency, sameCountry }: BuildArgs): { options: ShipOption[]; noMatching: boolean } {
  const live: ShipOption[] = liveRates.map(r => ({
    _id: r.rateId, kind: 'live', label: [r.carrier, r.service].filter(Boolean).join(' - ') || ts('pg.carrier_rate', 'Carrier rate'),
    price: r.amount, priceCurrency: r.currency,
    eta: r.estimatedDays ? ts('checkout.businessDays', '{{count}} business days', { count: r.estimatedDays }) : ts('checkout.varies', 'Varies'),
    arrival: null, zoneType: 'shipping',
  }));

  const inCountry = address ? zones.filter(z => zoneMatchesAddress(z, address, sameCountry)) : zones;
  let matching: ShippingZone[];
  if (address) {
    const special = inCountry.filter(z => z.zoneType === 'pickup' || z.zoneType === 'local_delivery');
    const normal = inCountry.filter(z => z.zoneType !== 'pickup' && z.zoneType !== 'local_delivery');
    const city = (address.city ?? '').toLowerCase();
    const state = (address.state ?? '').toLowerCase();
    const refined = normal.filter(z => (z.city && z.city.toLowerCase() === city) || (z.province && z.province.toLowerCase() === state));
    matching = [...(refined.length > 0 ? refined : normal), ...special];
  } else {
    matching = inCountry;
  }

  const flat: ShipOption[] = matching.map(z => ({
    _id: z._id, kind: 'zone', label: zoneLabel(z), price: z.shippingPrice, priceCurrency: zoneCurrency,
    eta: z.estimatedDeliveryTime || null, arrival: zoneArrivalRange(z), zoneType: z.zoneType,
    groupKey: z.groupKey, pickupAddress: z.pickupAddress ?? null, pickupInstructions: z.pickupInstructions ?? null,
  }));

  return { options: [...live, ...flat], noMatching: !!address && zones.length > 0 && live.length === 0 && flat.length === 0 };
}
