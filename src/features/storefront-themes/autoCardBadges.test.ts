import { describe, it, expect, afterEach } from 'vitest';
import { cardBadgeOf, setAutoCardBadges } from './productCardExtras';

const accent = { bg: '#000000', ink: '#ffffff' };
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
afterEach(() => setAutoCardBadges({}));

describe('automatic card badges', () => {
  it('off by default: nothing appears', () => {
    expect(cardBadgeOf({ createdAt: daysAgo(1), purchaseCount: 500 }, accent)).toBeNull();
  });
  it('"New" for products added within the chosen days', () => {
    setAutoCardBadges({ autoBadgeNew: '14' });
    expect(cardBadgeOf({ createdAt: daysAgo(3) }, accent)?.text).toBe('New');
    expect(cardBadgeOf({ createdAt: daysAgo(20) }, accent)).toBeNull();
    expect(cardBadgeOf({}, accent)).toBeNull();
  });
  it('"Best seller" after enough sales', () => {
    setAutoCardBadges({ autoBadgeBest: '25' });
    expect(cardBadgeOf({ purchaseCount: 25 }, accent)?.text).toBe('Best seller');
    expect(cardBadgeOf({ purchaseCount: 24 }, accent)).toBeNull();
  });
  it('a badge the seller typed on the product always wins; New beats Best seller', () => {
    setAutoCardBadges({ autoBadgeNew: '30', autoBadgeBest: '10' });
    expect(cardBadgeOf({ cardBadgeText: 'Limited', createdAt: daysAgo(1), purchaseCount: 99 }, accent)?.text).toBe('Limited');
    expect(cardBadgeOf({ createdAt: daysAgo(1), purchaseCount: 99 }, accent)?.text).toBe('New');
  });
  it('junk settings turn it off', () => {
    setAutoCardBadges({ autoBadgeNew: 'abc', autoBadgeBest: 'off' });
    expect(cardBadgeOf({ createdAt: daysAgo(1), purchaseCount: 99 }, accent)).toBeNull();
  });
});
