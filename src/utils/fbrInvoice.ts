import QRCode from 'qrcode';
import { apiGetOrderFbr } from '@/api/services/fbrDi';
import type { DocumentOrder } from '@/utils/orderDocuments';

/**
 * QR for an FBR invoice. FBR's rules (digital invoicing spec, section 6): QR version 2.0 (25x25), printed 1.0 x 1.0 inch.
 * Error correction L keeps a 22 to 28 character invoice number inside version 2. What the QR encodes is not stated by
 * FBR; Solvexo encodes the FBR invoice number.
 */
export function fbrQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { version: 2, errorCorrectionLevel: 'L', margin: 0, width: 192 });
}

/** The FBR number + QR of one order for the printed invoice, or null when it was not filed (or anything fails: printing must never break). */
export async function loadOrderFbr(storeId: string, orderId: string): Promise<DocumentOrder['fbr']> {
  try {
    const r = (await apiGetOrderFbr(storeId, orderId)).data;
    if (!r || r.status !== 'submitted' || !r.fbrInvoiceNumber) return null;
    return { invoiceNumber: r.fbrInvoiceNumber, qrDataUrl: await fbrQrDataUrl(r.qrText ?? r.fbrInvoiceNumber), dated: r.fbrDated, sandbox: r.mode === 'sandbox' };
  } catch {
    return null;
  }
}
