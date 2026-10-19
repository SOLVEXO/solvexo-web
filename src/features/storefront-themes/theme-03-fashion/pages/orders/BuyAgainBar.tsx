import { Link } from 'react-router-dom';
import { ts } from '@/utils/tStatic';
import type { OrderDetail } from '@/api/services/orders';
import { fashionTheme as t } from '../../theme.config';
import { Notice, PillButton } from '../../ui/primitives';
import { canRequestReturn } from '../../../orderUi';
import { useBuyAgain } from '../../../useBuyAgain';

/** "Buy again" + "Request a return" (only once delivered). No cancel button: buyers cannot cancel orders. */
export function BuyAgainBar({ order }: { order: OrderDetail }) {
  const buyAgain = useBuyAgain();
  const res = buyAgain.result;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <PillButton loading={buyAgain.busy} onClick={() => buyAgain.run(order)}>{ts('pg.buy_again', 'Buy again')}</PillButton>
        {canRequestReturn(order) && (
          <Link to="/returns" className="fx-pill" style={{ border: `1px solid ${t.colors.border}`, color: t.colors.ink, borderRadius: t.buttonRadiusPx }}>{ts('orders.requestReturn', 'Request a return')}</Link>
        )}
      </div>
      <div aria-live="polite" className="flex flex-col gap-2">
        {res && res.added > 0 && (
          <Notice tone="success">{res.added} {res.added === 1 ? 'item' : 'items'} added to your cart. <Link to="/cart" className="font-medium underline" style={{ color: 'inherit' }}>{ts('orders.goToCart', 'Go to cart')}</Link></Notice>
        )}
        {res && res.added === 0 && res.errors.length === 0 && <Notice>{ts('orders.nothingToReorder', 'Nothing in this order can be added to your cart again.')}</Notice>}
        {res?.errors.map(e => <Notice key={e} tone="error">{e}</Notice>)}
      </div>
    </div>
  );
}
