import client from '../client';
import { ENDPOINTS } from '../endpoints';

export interface ShippingZone {
  _id: string;
  country: string;
  province: string;
  city: string;
  shippingPrice: number;
  estimatedDeliveryTime: string;
  status: 'active' | 'inactive';
  isDelete: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ShippingZonesResponse {
  message: string;
  data: ShippingZone[];
}

export function apiGetShippingZones() {
  return client.get<never, ShippingZonesResponse>(ENDPOINTS.SHIPPING.GET_SHIPPING_ZONES);
}
