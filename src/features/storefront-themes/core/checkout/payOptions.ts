import type { PublicPaymentMethod } from '@/api/services/integrations';
import type { CardOrCod } from './useCheckoutCreation';

export type PayKind = 'stripe' | 'cod' | 'gateway' | 'manual';

export interface PayOption {
  key: string;
  kind: PayKind;
  label: string;
  hint: string;
  logo?: string;
  provider?: string;
  methodId?: string;
  instructions?: string;
}

interface Args {
  allowed: CardOrCod[];
  extras: PublicPaymentMethod[];
  stripeConfigured: boolean;
  /** Order total is zero (not covered by store credit): nothing to charge, so card / hosted gateways make no sense. */
  zeroTotal: boolean;
}

/** One flat list of everything the buyer can pay with, in the order: card, COD, hosted gateways, manual methods. */
export function buildPayOptions({ allowed, extras, stripeConfigured, zeroTotal }: Args): PayOption[] {
  const out: PayOption[] = [];
  if (allowed.includes('stripe') && stripeConfigured && !zeroTotal) {
    out.push({ key: 'stripe', kind: 'stripe', label: 'Credit / debit card', hint: 'Pay securely with your card.' });
  }
  if (allowed.includes('cash_on_delivery')) {
    out.push({ key: 'cash_on_delivery', kind: 'cod', label: 'Cash on delivery', hint: 'Pay in cash when your order arrives.' });
  }
  for (const m of extras) {
    const manual = m.provider === 'manual' && !!m.methodId;
    if (!manual && zeroTotal) continue;
    out.push({
      key: `x:${m.methodId ?? m.provider}`,
      kind: manual ? 'manual' : 'gateway',
      label: m.displayName,
      hint: manual ? 'Place your order, then pay the store directly.' : `Pay with ${m.displayName}.`,
      logo: m.logo, provider: m.provider, methodId: m.methodId, instructions: m.instructions,
    });
  }
  return out;
}

/** The buyer's pick while it is still offered; a single option is chosen automatically. */
export function resolveSelected(options: PayOption[], chosenKey: string | null): PayOption | null {
  return options.find(o => o.key === chosenKey) ?? (options.length === 1 ? options[0] : null);
}
