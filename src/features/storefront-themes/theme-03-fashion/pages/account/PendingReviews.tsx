import { useMemo, useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Package } from 'lucide-react';
import { fashionTheme as t } from '../../theme.config';
import { Card, PillButton } from '../../ui/primitives';
import { useReviewedProducts } from '../../../useReviewedProducts';
import { usePendingReviews, type PendingReview } from '../../../usePendingReviews';
import { ReviewEditDialog } from './ReviewEditDialog';

const FIRST = 4;

/** "Waiting for your review": delivered products the buyer has not reviewed yet, each with a Write a review button. */
export function PendingReviews({ onReviewed }: { onReviewed: () => void }) {
  const { byProduct, reload } = useReviewedProducts();
  const reviewedIds = useMemo(() => new Set(byProduct.keys()), [byProduct]);
  const { pending, loading } = usePendingReviews(reviewedIds);
  const [writing, setWriting] = useState<PendingReview | null>(null);
  const [all, setAll] = useState(false);

  if (loading || pending.length === 0) return null;
  const shown = all ? pending : pending.slice(0, FIRST);

  return (
    <section aria-labelledby="pending-reviews-title" className="mb-8">
      <h2 id="pending-reviews-title" className="m-0 mb-1 text-xl font-semibold tracking-tight">{ts('pg.waiting_for_your_review', 'Waiting for your review')}</h2>
      <p className="m-0 mb-4 text-sm" style={{ color: t.colors.inkMuted }}>{ts('pg.pending_reviews_hint', 'Tell other shoppers what you think of what you received.')}</p>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {shown.map(p => (
          <li key={p.productId}>
            <Card>
              <div className="flex flex-wrap items-center gap-4">
                <div className="grid size-16 shrink-0 place-items-center overflow-hidden" style={{ background: t.colors.bgAlt, borderRadius: 12 }}>
                  {p.image ? <img src={p.image} alt="" className="size-full object-cover" /> : <Package size={20} style={{ color: t.colors.inkMuted }} aria-hidden />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[15px] font-medium">{p.name}</p>
                  <p className="m-0 mt-0.5 text-[13px]" style={{ color: t.colors.inkMuted }}>{ts('checkout.orderLabel', 'Order')} #{p.orderNumber}</p>
                </div>
                <PillButton variant="outline" onClick={() => setWriting(p)}>{ts('pg.write_a_review', 'Write a review')}</PillButton>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {pending.length > FIRST && (
        <button type="button" onClick={() => setAll(a => !a)} className="mt-3 cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold underline" style={{ color: t.colors.ink }}>
          {all ? ts('pg.show_fewer', 'Show fewer') : `${ts('pg.show_all', 'Show all')} (${pending.length})`}
        </button>
      )}
      {writing && (
        <ReviewEditDialog target={{ productId: writing.productId, productName: writing.name, variantId: writing.variantId, orderId: writing.orderId }}
          onClose={() => setWriting(null)} onSaved={() => { setWriting(null); reload(); onReviewed(); }} />
      )}
    </section>
  );
}
