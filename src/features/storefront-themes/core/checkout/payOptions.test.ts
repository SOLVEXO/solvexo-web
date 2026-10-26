import { describe, expect, it } from 'vitest';
import type { PublicPaymentMethod } from '@/api/services/integrations';
import { buildPayOptions, resolveSelected } from './payOptions';

const safepay = { provider: 'safepay', displayName: 'Safepay', currency: 'PKR' } as PublicPaymentMethod;
const manual = { provider: 'manual', methodId: 'm1', displayName: 'Bank transfer', currency: 'PKR', instructions: 'Send to IBAN' } as PublicPaymentMethod;

describe('buildPayOptions', () => {
  it('lists card, cod, gateways and manual methods in order', () => {
    const o = buildPayOptions({ allowed: ['stripe', 'cash_on_delivery'], extras: [safepay, manual], stripeConfigured: true, zeroTotal: false });
    expect(o.map(x => x.kind)).toEqual(['stripe', 'cod', 'gateway', 'manual']);
    expect(o[3]).toMatchObject({ key: 'x:m1', methodId: 'm1', instructions: 'Send to IBAN' });
  });
  it('hides the card option when Stripe is not configured', () => {
    expect(buildPayOptions({ allowed: ['stripe'], extras: [], stripeConfigured: false, zeroTotal: false })).toEqual([]);
  });
  it('does not offer a gateway that cannot charge this checkout currency, but keeps manual methods', () => {
    const paypalUsd = { provider: 'paypal', displayName: 'PayPal', currency: 'USD', payCurrency: 'USD', available: false } as PublicPaymentMethod;
    const mollie = { provider: 'mollie', displayName: 'Mollie', currency: 'EUR', payCurrency: 'EUR', available: true } as PublicPaymentMethod;
    const o = buildPayOptions({ allowed: [], extras: [paypalUsd, mollie, manual], stripeConfigured: false, zeroTotal: false });
    expect(o.map(x => x.provider ?? x.kind)).toEqual(['mollie', 'manual']);
  });
  it('drops card and hosted gateways for a zero total but keeps cod and manual', () => {
    const o = buildPayOptions({ allowed: ['stripe', 'cash_on_delivery'], extras: [safepay, manual], stripeConfigured: true, zeroTotal: true });
    expect(o.map(x => x.kind)).toEqual(['cod', 'manual']);
  });
});

describe('resolveSelected', () => {
  const two = buildPayOptions({ allowed: ['stripe', 'cash_on_delivery'], extras: [], stripeConfigured: true, zeroTotal: false });
  it('needs an explicit pick when several options exist', () => {
    expect(resolveSelected(two, null)).toBeNull();
    expect(resolveSelected(two, 'cash_on_delivery')?.kind).toBe('cod');
  });
  it('auto-selects a single option and ignores a pick that disappeared', () => {
    const one = two.slice(0, 1);
    expect(resolveSelected(one, null)?.kind).toBe('stripe');
    expect(resolveSelected(two, 'x:gone')).toBeNull();
  });
});
