import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Address {
  _id:          string;
  userId:       string;
  label:        string;
  recipientName: string;
  phoneNumber:  string;
  addressLine1: string;
  addressLine2: string;
  state:        string;
  city:         string;
  zipCode:      string;
  isDefault:    boolean;
  status:       string;
  isDelete:     boolean;
  createdAt:    string;
  updatedAt:    string;
}

export interface AddressPayload {
  label:        string;
  recipientName: string;
  phoneNumber:  string;
  addressLine1: string;
  addressLine2?: string;
  state:        string;
  city:         string;
  zipCode:      string;
  isDefault?:   boolean;
}

interface AddressResponse  { success?: boolean; message: string; data: Address }
interface AddressListResponse { message: string; data: Address[] }

// ── API ───────────────────────────────────────────────────────────────────────

export function apiAddAddress(payload: AddressPayload) {
  return client.post<never, AddressResponse>(ENDPOINTS.ADDRESS.ADD, payload);
}

export function apiGetMyAddresses() {
  return client.get<never, AddressListResponse>(ENDPOINTS.ADDRESS.GET_ALL);
}

export function apiGetDefaultAddress() {
  return client.get<never, AddressResponse>(ENDPOINTS.ADDRESS.GET_DEFAULT);
}

export function apiUpdateAddress(addressId: string, payload: Partial<AddressPayload>) {
  return client.post<never, AddressResponse>(ENDPOINTS.ADDRESS.UPDATE, { addressId, ...payload });
}
