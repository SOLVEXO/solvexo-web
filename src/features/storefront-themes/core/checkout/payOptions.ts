import type { PublicPaymentMethod } from '@/api/services/integrations';
import type { CardOrCod } from './useCheckoutCreation';
import { ts } from '@/utils/tStatic';

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
    out.push({ key: 'stripe', kind: 'stripe', label: ts('pg.credit_debit_card', 'Credit / debit card'), hint: ts('pg.pay_securely_with_your_card', 'Pay securely with your card.') });
  }
  if (allowed.includes('cash_on_delivery')) {
    out.push({ key: 'cash_on_delivery', kind: 'cod', label: ts('order.method.cod', 'Cash on delivery'), hint: ts('pg.pay_in_cash_when_your_order_arrives', 'Pay in cash when your order arrives.') });
  }
  for (const m of extras) {
    const manual = m.provider === 'manual' && !!m.methodId;
    if (!manual && zeroTotal) continue;
    out.push({
      key: `x:${m.methodId ?? m.provider}`,
      kind: manual ? 'manual' : 'gateway',
      label: m.displayName,
      hint: manual ? ts('pg.place_your_order_then_pay_the_store', 'Place your order, then pay the store directly.') : ts('pg.pay_with_name', 'Pay with {{name}}.', { name: m.displayName }),
      logo: m.logo, provider: m.provider, methodId: m.methodId, instructions: m.instructions,
    });
  }
  return out;
}

/** The buyer's pick while it is still offered; a single option is chosen automatically. */
export function resolveSelected(options: PayOption[], chosenKey: string | null): PayOption | null {
  return options.find(o => o.key === chosenKey) ?? (options.length === 1 ? options[0] : null);
}
