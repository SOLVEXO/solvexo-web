import client from '../client';

/** COD protection (cash-on-delivery rules, confirmation, risk). Seller calls need the store id in the path; the buyer link uses a signed token. */

export interface CodSettings {
  enabled: boolean;
  maxCodAmount: number | null;
  confirmNewCustomers: boolean;
  confirmAboveAmount: number | null;
  flaggedCities: string[];
  blockedPhones: string[];
  blockedAddresses: string[];
  highRiskScore: number;
  highRiskPrepayOnly: boolean;
  confirmationHours: number;
}

export interface CodStats {
  days: number; currency: string; codOrders: number; asked: number; confirmed: number; cancelled: number; expired: number; awaiting: number;
  confirmationRate: number | null; bookedOrders: number; rtoOrders: number; rtoRate: number | null; savedAmount: number;
}

export type CodConfirmStatus = 'awaiting' | 'confirmed' | 'cancelled' | 'expired';
export interface CodPublicView { storeName: string; orderNumber: string; total: number; currency: string; itemCount: number; status: CodConfirmStatus; expiresAt: string }

const seller = (storeId: string) => `/api/cod-protection/${storeId}`;

export const apiGetCodSettings = (storeId: string) => client.get(`${seller(storeId)}/settings`) as Promise<CodSettings>;
export const apiSaveCodSettings = (storeId: string, body: Partial<CodSettings>) => client.put(`${seller(storeId)}/settings`, body) as Promise<CodSettings>;
export const apiGetCodStats = (storeId: string, days: number) => client.get(`${seller(storeId)}/stats`, { params: { days } }) as Promise<CodStats>;
export const apiConfirmCodOrder = (storeId: string, orderId: string, note?: string) => client.post(`${seller(storeId)}/orders/${orderId}/confirm`, { note }) as Promise<{ success: boolean }>;
export const apiResendCodConfirmation = (storeId: string, orderId: string) => client.post(`${seller(storeId)}/orders/${orderId}/resend-confirmation`) as Promise<{ sent: string[] }>;

export const apiGetCodConfirmation = (token: string) => client.get(`/api/public/cod/${encodeURIComponent(token)}`) as Promise<CodPublicView>;
export const apiConfirmCodByLink = (token: string) => client.post(`/api/public/cod/${encodeURIComponent(token)}/confirm`) as Promise<CodPublicView>;
export const apiCancelCodByLink = (token: string) => client.post(`/api/public/cod/${encodeURIComponent(token)}/cancel`) as Promise<CodPublicView>;
