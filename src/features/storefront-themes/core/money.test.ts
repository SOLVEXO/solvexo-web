import { describe, expect, it } from 'vitest';
import { displayMoney, displayMoneySum, type MoneyConverter } from './money';

const rates: Record<string, number> = { USD: 1, PKR: 280 };
const make = (currency: string, have: string[] = ['USD', 'PKR']): MoneyConverter => ({
  currency,
  canConvert: (from, to) => { const f = from ?? currency, t = to ?? currency; return f === t || (have.includes(f) && have.includes(t)); },
  convert: (a, from) => (from && from !== currency ? (a / rates[from]) * rates[currency] : a),
});

describe('displayMoney', () => {
  it('converts when rates exist', () => expect(displayMoney(make('USD'), 2800, 'PKR')).toBe('$10.00'));
  it('keeps the native currency (right symbol) when there is no rate', () => {
    const t = displayMoney(make('USD', []), 2800, 'PKR');
    expect(t).not.toContain('$');
    expect(t).toContain('2,800');
  });
  it('empty for missing amounts', () => expect(displayMoney(make('USD'), null, 'PKR')).toBe(''));
});

describe('displayMoneySum', () => {
  it('sums converted lines', () => expect(displayMoneySum(make('USD'), [{ amount: 280, from: 'PKR' }, { amount: 560, from: 'PKR' }])).toBe('$3.00'));
  it('sums natively without rates', () => expect(displayMoneySum(make('USD', []), [{ amount: 100, from: 'PKR' }, { amount: 50, from: 'PKR' }])).toContain('150'));
});
