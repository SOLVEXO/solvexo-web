import { describe, expect, it } from 'vitest';
import type { LiveShippingRate, ShippingZone } from '@/api/services/shipping';
import { buildShipOptions } from './shippingOptions';

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const zone = (o: Partial<ShippingZone>): ShippingZone => ({
  _id: 'z', storeId: 's', zoneType: 'shipping', country: 'Pakistan', province: '', city: '', shippingPrice: 5,
  estimatedDeliveryTime: '3 days', status: 'active', isDelete: false, createdAt: '', updatedAt: '', __v: 0, ...o,
}) as ShippingZone;
const addr = { country: 'Pakistan', city: 'Lahore', state: 'Punjab', addressLine1: '1 Road', zipCode: '54000' };

describe('buildShipOptions', () => {
  it('never offers other countries zones', () => {
    const r = buildShipOptions({ zones: [zone({ _id: 'pk' }), zone({ _id: 'us', country: 'United States' })], liveRates: [], address: addr, zoneCurrency: 'USD', sameCountry: same });
    expect(r.options.map(o => o._id)).toEqual(['pk']);
    expect(r.noMatching).toBe(false);
  });
  it('reports no match when the store ships nowhere near the address', () => {
    const r = buildShipOptions({ zones: [zone({ country: 'France' })], liveRates: [], address: addr, zoneCurrency: 'USD', sameCountry: same });
    expect(r.options).toEqual([]);
    expect(r.noMatching).toBe(true);
  });
  it('refines by city within the country and keeps pickup', () => {
    const r = buildShipOptions({
      zones: [zone({ _id: 'lhr', city: 'Lahore' }), zone({ _id: 'khi', city: 'Karachi' }), zone({ _id: 'pick', zoneType: 'pickup', country: 'Anywhere' })],
      liveRates: [], address: addr, zoneCurrency: 'USD', sameCountry: same,
    });
    expect(r.options.map(o => o._id)).toEqual(['lhr', 'pick']);
  });
  it('keeps live rates with their own currency, ahead of zone rates', () => {
    const live: LiveShippingRate = { rateId: 'r1', carrier: 'DHL', service: 'Express', amount: 12, currency: 'EUR', estimatedDays: 2 };
    const r = buildShipOptions({ zones: [zone({ _id: 'pk' })], liveRates: [live], address: addr, zoneCurrency: 'USD', sameCountry: same });
    expect(r.options[0]).toMatchObject({ _id: 'r1', kind: 'live', price: 12, priceCurrency: 'EUR', label: 'DHL - Express' });
    expect(r.options[1]).toMatchObject({ _id: 'pk', kind: 'zone', priceCurrency: 'USD' });
  });
  it('shows every zone before an address exists', () => {
    const r = buildShipOptions({ zones: [zone({ _id: 'a' }), zone({ _id: 'b', country: 'France' })], liveRates: [], address: null, zoneCurrency: 'USD', sameCountry: same });
    expect(r.options).toHaveLength(2);
  });
});
