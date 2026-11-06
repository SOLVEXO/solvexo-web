import client from '../client';

/** Buyer-side wholesale (B2B) calls. Prices and rules always come from the server; checkout recomputes them itself. */

export type WholesaleStanding =
  | { status: 'none' }
  | { status: 'pending'; companyName: string }
  | { status: 'rejected'; companyName: string; decisionNote: string | null }
  | {
      status: 'approved';
      companyName: string;
      locationName: string;
      role: 'ordering' | 'location_admin';
      taxExempt: boolean;
      paymentTerms: { type: 'due_on_order' | 'net' | 'due_on_fulfilment'; netDays?: number | null } | null;
      allowedPaymentMethods: string[];
      hasCatalog: boolean;
    };

export interface QuickOrderLine {
  sku: string;
  quantity: number;
  ok: boolean;
  error?: string;
  suggested?: number;
  productId?: string;
  variantId?: string;
  name?: string;
  type?: 'physical' | 'digital';
  unitPrice?: number;
}

export interface B2BPriceLine {
  variantId: string;
  available: boolean;
  quantity?: number;
  retailPrice?: number;
  unitPrice?: number;
  error?: string;
  suggested?: number;
  rule?: { min: number; max: number | null; increment: number };
  priceBreaks?: { minQty: number; price: number }[];
}

const BASE = '/api/b2b/storefront';

export const apiGetWholesaleStanding = (storeId: string) =>
  client.get(`${BASE}/me`, { params: { storeId } }) as Promise<WholesaleStanding>;

export const apiApplyForWholesale = (storeId: string, body: { companyName: string; taxId?: string; phone?: string; message?: string }) =>
  client.post(`${BASE}/apply`, { storeId, ...body }) as Promise<{ id: string; status: 'pending' }>;

export const apiGetB2BPrices = (storeId: string, lines: { variantId: string; quantity: number }[]) =>
  client.post(`${BASE}/prices`, { storeId, lines }) as Promise<{ b2b: boolean; company?: string; lines: B2BPriceLine[] }>;

export const apiQuickOrderResolve = (storeId: string, lines: { sku: string; quantity: number }[]) =>
  client.post(`${BASE}/quick-order`, { storeId, lines }) as Promise<{ lines: QuickOrderLine[] }>;

export const apiSetB2BPoNumber = (checkoutId: string, poNumber: string) =>
  client.post('/api/checkout/b2b-po-number', { checkoutId, poNumber }) as Promise<{ success: boolean }>;
