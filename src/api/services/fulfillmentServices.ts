import client from '../client';

export type FulfillmentProviderKind = 'generic_http' | 'mock';
export interface FulfillmentServiceRow {
  _id: string;
  name: string;
  provider: FulfillmentProviderKind;
  endpointUrl: string | null;
  secretHint: string;
  status: 'active' | 'disabled';
  locationId: string | null;
  autoRoute: boolean;
  trackInventory: boolean;
  lastCallbackAt: string | null;
}
export type FulfillmentRequestStatus = 'pending' | 'sent' | 'accepted' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
export interface FulfillmentRequestRow {
  _id: string;
  serviceId: string;
  orderId: string;
  orderNumber: string;
  status: FulfillmentRequestStatus;
  attempts: number;
  lastError: string | null;
  externalId: string | null;
  tracking: { carrier: string | null; trackingNumber: string | null; trackingUrl: string | null } | null;
  items: { itemId: string; sku: string | null; title: string; quantity: number }[];
  createdAt: string;
}

const base = (storeId: string) => `/api/fulfillment-services/${storeId}`;

export const apiListFulfillmentServices = (storeId: string) => client.get(base(storeId)) as Promise<FulfillmentServiceRow[]>;
export const apiCreateFulfillmentService = (storeId: string, body: { name: string; provider: FulfillmentProviderKind; endpointUrl?: string; autoRoute?: boolean; trackInventory?: boolean }) =>
  client.post(base(storeId), body) as Promise<FulfillmentServiceRow & { secret: string }>;
export const apiUpdateFulfillmentService = (storeId: string, id: string, body: Partial<Pick<FulfillmentServiceRow, 'name' | 'endpointUrl' | 'status' | 'autoRoute' | 'trackInventory'>>) =>
  client.patch(`${base(storeId)}/${id}`, body) as Promise<FulfillmentServiceRow>;
export const apiRotateFulfillmentSecret = (storeId: string, id: string) =>
  client.post(`${base(storeId)}/${id}/rotate-secret`) as Promise<{ secret: string; secretHint: string }>;
export const apiDeleteFulfillmentService = (storeId: string, id: string) => client.delete(`${base(storeId)}/${id}`) as Promise<{ success: boolean }>;
export const apiListFulfillmentRequests = (storeId: string, params: { page?: number; limit?: number; status?: string; serviceId?: string } = {}) =>
  client.get(`${base(storeId)}/requests/list`, { params }) as Promise<{ items: FulfillmentRequestRow[]; total: number; page: number; limit: number }>;
export const apiSendOrderToFulfillment = (storeId: string, orderId: string, serviceId: string) =>
  client.post(`${base(storeId)}/requests`, { orderId, serviceId }) as Promise<FulfillmentRequestRow>;
export const apiRetryFulfillmentRequest = (storeId: string, id: string) => client.post(`${base(storeId)}/requests/${id}/retry`) as Promise<FulfillmentRequestRow>;
export const apiCancelFulfillmentRequest = (storeId: string, id: string) => client.post(`${base(storeId)}/requests/${id}/cancel`) as Promise<FulfillmentRequestRow>;
