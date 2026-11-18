import { buildCsv } from '@/utils/csvFile';
import type { SellerReturnItem } from '@/api/services/orders';
import { returnStatusLabel } from './returnStatus';

const day = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');
const RESOLUTION = { refund: 'Refund', exchange: 'Exchange', closed: 'Closed' } as const;
const REFUND_TO = { original: 'Original payment method', store_credit: 'Store credit' } as const;
const RESTOCK = { restock: 'Restocked', damaged: 'Damaged (not restocked)', none: 'Not restocked' } as const;

/** Same filter the page applies to the list: the search box looks at order number, customer and product. */
export function matchesReturnSearch(r: SellerReturnItem, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return r.orderNumber.toLowerCase().includes(q) || r.customer.name.toLowerCase().includes(q) || r.productName.toLowerCase().includes(q);
}

/** The returns list as a CSV: one row per returned line, with the money and the dates a seller reconciles against. */
export function returnsToCsv(rows: SellerReturnItem[]): string {
  const headers = ['Order', 'Customer', 'Customer email', 'Product', 'Quantity', 'Reason', 'Amount', 'Refunded amount', 'Status', 'Requested', 'Approved', 'Received', 'Resolved', 'Outcome', 'Refunded to', 'Restock', 'Return tracking'];
  return buildCsv(headers, rows.map(r => [
    r.orderNumber, r.customer.name, r.customer.email ?? '', r.productName, String(r.quantity), r.returnReason ?? '',
    String(r.amount), String(r.refundedAmount ?? 0), returnStatusLabel(r.returnStatus),
    day(r.returnRequestedAt), day(r.returnApprovedAt), day(r.returnReceivedAt), day(r.returnResolvedAt),
    r.returnResolution ? RESOLUTION[r.returnResolution] : '', r.returnRefundTo ? REFUND_TO[r.returnRefundTo] : '', r.returnRestock ? RESTOCK[r.returnRestock] : '',
    r.returnLabel?.trackingNumber ?? '',
  ]));
}
