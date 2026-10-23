import { ts } from '@/utils/tStatic';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useRecommendedProducts } from '../../../useRecommendedProducts';
import { FashionProductCard } from '../../components/FashionProductCard';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

/** The two headings the starter template ships with are translated; a heading the seller typed is shown as written. */
function starterHeading(heading: string | undefined) {
  if (heading === 'You may also like') return ts('pg.you_may_also_like', 'You may also like');
  if (heading === 'Complete the look') return ts('pg.complete_the_look', 'Complete the look');
  return heading;
}

/** "You may also like" / "Complete the look" — Shopify's Product recommendations (see `useRecommendedProducts` for the sources). */
export function RelatedProductsSection({ section, colors }: SharedSectionProps) {
  const { currency } = useCurrencyPreference();
  const s = section.settings;
  const { items } = useRecommendedProducts(s);
  if (!items || items.length === 0) return null;
  const cols = [2, 3, 4].includes(Number(s.columns)) ? Number(s.columns) : 4;
  return (
    <SectionShell colors={colors} heading={starterHeading(s.heading)}>
      <div className="grid fx-grid-gap" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${Math.floor(1100 / cols)}px), 1fr))` }}>
        {items.map(p => <FashionProductCard key={p._id} product={p} currency={currency} />)}
      </div>
    </SectionShell>
  );
}
