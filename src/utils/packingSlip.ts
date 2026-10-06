import type { SellerOrderDetail } from '@/api/services/product';

export interface PackingSlipItem {
  name: string;
  options: { name: string; value: string }[];
  sku: string | null;
  quantity: number;
}

export interface PackingSlipOrder {
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  isPickup: boolean;
  pickupLocation: string | null;
  shippingAddress: {
    recipientName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    zipCode: string;
  } | null;
  items: PackingSlipItem[];
  note: string | null;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** Maps the seller order detail response to the minimal packing-slip shape; tolerant of missing fields. */
export function toPackingSlipOrder(detail: SellerOrderDetail | null | undefined, fallbackNumber = ''): PackingSlipOrder {
  // Pickup fields are not part of the typed detail yet — read them loosely.
  const loose = (detail ?? {}) as unknown as Record<string, unknown>;
  const pickupObj = (loose.pickupLocation ?? loose.pickup) as Record<string, unknown> | string | null | undefined;
  const pickupName =
    typeof pickupObj === 'string' ? pickupObj
      : pickupObj && typeof pickupObj === 'object' ? str(pickupObj.name) || str(pickupObj.address) : '';
  const isPickup = loose.fulfillmentMethod === 'pickup';
  const items = (detail?.sellerOrder?.items ?? [])
    .filter(i => i.status !== 'cancelled' && i.type !== 'digital')
    .map(i => ({
      name: i.name ?? '',
      options: Array.isArray(i.options) ? i.options : [],
      sku: i.sku ?? null,
      quantity: i.quantity ?? 0,
    }));
  return {
    orderNumber: detail?.orderNumber || fallbackNumber,
    createdAt: detail?.createdAt ?? '',
    customerName: detail?.buyer?.name ?? '',
    customerEmail: detail?.buyer?.email ?? '',
    customerPhone: detail?.buyer?.phone ?? '',
    isPickup,
    pickupLocation: pickupName || null,
    shippingAddress: detail?.shippingAddress ?? null,
    items,
    note: detail?.note?.trim() ? detail.note.trim() : null,
  };
}

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function slipHtml(o: PackingSlipOrder, storeName: string): string {
  let shipTo: string;
  if (o.isPickup) {
    shipTo = `<strong>Local pickup</strong>${o.pickupLocation ? `<br>${esc(o.pickupLocation)}` : ''}`;
  } else if (o.shippingAddress) {
    const a = o.shippingAddress;
    shipTo = [
      `<strong>${esc(a.recipientName)}</strong>`,
      esc(a.addressLine1),
      a.addressLine2 ? esc(a.addressLine2) : '',
      esc([a.city, a.state, a.zipCode].filter(Boolean).join(', ')),
      a.phoneNumber ? esc(a.phoneNumber) : '',
    ].filter(Boolean).join('<br>');
  } else {
    shipTo = '<em>No shipping address</em>';
  }

  const rows = o.items.length
    ? o.items.map(i => {
        const opts = i.options.map(op => `${esc(op.name)}: ${esc(op.value)}`).join(' / ');
        return `<tr><td>${esc(i.name)}${opts ? `<div class="sub">${opts}</div>` : ''}</td><td>${i.sku ? esc(i.sku) : ''}</td><td class="qty">${esc(i.quantity)}</td></tr>`;
      }).join('')
    : '<tr><td colspan="3"><em>No physical items</em></td></tr>';

  return `<section class="slip">
<div class="head"><div><h1>${esc(storeName)}</h1><p>Packing slip</p></div><div class="r"><strong>Order ${esc(o.orderNumber)}</strong><br>${esc(fmtDate(o.createdAt))}</div></div>
<div class="cols"><div><h2>${o.isPickup ? 'Pickup' : 'Ship to'}</h2><p>${shipTo}</p></div>
<div><h2>Customer</h2><p>${esc(o.customerName)}${o.customerEmail ? `<br>${esc(o.customerEmail)}` : ''}${o.customerPhone ? `<br>${esc(o.customerPhone)}` : ''}</p></div></div>
<table><thead><tr><th>Item</th><th>SKU</th><th class="qty">Qty</th></tr></thead><tbody>${rows}</tbody></table>
${o.note ? `<div class="note"><h2>Notes</h2><p>${esc(o.note)}</p></div>` : ''}
</section>`;
}

/**
 * Opens a print-ready document with one packing slip per order and triggers the print dialog.
 * Returns false when the browser blocked the new window.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for API parity; slips show no money totals
export function openPackingSlips(orders: PackingSlipOrder[], storeName: string, _currencySymbol?: string): boolean {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Packing slips</title><style>
body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:24px;font-size:13px}
.slip{page-break-after:always;break-after:page;margin-bottom:32px}
.slip:last-child{page-break-after:auto;break-after:auto}
.head{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:16px}
h1{font-size:20px;margin:0}.head p{margin:2px 0 0;color:#555}.r{text-align:right}
h2{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#555;margin:0 0 4px}
.cols{display:flex;gap:40px;margin-bottom:18px}.cols p{margin:0;line-height:1.5}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px 6px;border-bottom:1px solid #ddd;vertical-align:top}
th{font-size:11px;text-transform:uppercase;color:#555}.qty{text-align:right;width:60px}.sub{color:#555;font-size:12px;margin-top:2px}
.note{margin-top:18px;padding:10px;border:1px solid #ccc}.note p{margin:0;white-space:pre-wrap}
@media print{body{padding:0}.slip{margin-bottom:0}}
</style></head><body>${orders.map(o => slipHtml(o, storeName)).join('')}
<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},200)})</script>
</body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const w = window.open(url, '_blank');
  if (!w) {
    URL.revokeObjectURL(url);
    return false;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
