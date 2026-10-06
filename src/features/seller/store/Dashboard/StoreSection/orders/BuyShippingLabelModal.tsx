import { apiGetLabelRates, apiPurchaseShippingLabel } from '@/api/services/orders';
import { LabelPurchaseModal } from './LabelPurchaseModal';

/** Shopify "Buy shipping label": pick a package, choose a carrier rate, buy.
 *  Whole order by default; pass `items` to label (and fulfil) only part of it as one shipment. */
export function BuyShippingLabelModal({ storeId, orderId, orderNumber, items, notifyCustomer, onClose, onPurchased }: {
  storeId: string;
  orderId: string;
  orderNumber: string;
  /** Partial shipment: only these lines/quantities are weighed, labelled and fulfilled. */
  items?: { itemId: string; quantity: number }[];
  notifyCustomer?: boolean;
  onClose: () => void;
  onPurchased: () => void;
}) {
  const partial = !!items && items.length > 0;
  return (
    <LabelPurchaseModal
      storeId={storeId}
      title={`Buy shipping label — ${orderNumber}`}
      buyLabel={partial ? 'Buy label & fulfil items' : 'Buy label & mark shipped'}
      loadRates={pkg => apiGetLabelRates(storeId, orderId, pkg || undefined, items).then(res => res.data?.rates ?? [])}
      purchase={({ rateId, packageId }) =>
        apiPurchaseShippingLabel(orderId, storeId, { rateId, packageId: packageId || undefined, items, notifyCustomer })}
      onClose={onClose}
      onPurchased={onPurchased}
    />
  );
}
