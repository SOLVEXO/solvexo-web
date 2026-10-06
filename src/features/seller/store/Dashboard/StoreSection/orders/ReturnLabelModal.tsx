import { apiGetReturnLabelRates, apiPurchaseReturnLabel } from '@/api/services/orders';
import { LabelPurchaseModal } from './LabelPurchaseModal';

/** Shopify "Create return label" for approved returned items: carrier rates from the buyer back to the store. */
export function ReturnLabelModal({ storeId, orderId, orderNumber, itemIds, itemNames, onClose, onPurchased }: {
  storeId: string;
  orderId: string;
  orderNumber: string;
  itemIds: string[];
  itemNames: string[];
  onClose: () => void;
  onPurchased: () => void;
}) {
  return (
    <LabelPurchaseModal
      storeId={storeId}
      title={`Buy return label — ${orderNumber}`}
      buyLabel="Buy return label"
      intro={
        <p className="text-[12.5px] text-slate mb-3">
          Prepaid label from the customer back to your store for: {itemNames.join(', ')}. The customer is emailed the label.
        </p>
      }
      loadRates={pkg => apiGetReturnLabelRates(storeId, orderId, itemIds, pkg || undefined).then(res => res.data?.rates ?? [])}
      purchase={({ rateId, packageId }) =>
        apiPurchaseReturnLabel(storeId, orderId, { itemIds, rateId, packageId: packageId || undefined })}
      onClose={onClose}
      onPurchased={onPurchased}
    />
  );
}
