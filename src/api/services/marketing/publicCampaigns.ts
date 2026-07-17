import client from '../../client';
import { ENDPOINTS } from '../../endpoints';

export interface PublicCampaign {
  _id: string;
  name: string;
  description: string | null;
  bannerImage: string | null;
  endDate: string;
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number | null;
  storeCount: number;
}

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** Public — no auth required. Active platform-wide sale campaigns for the buyer marketplace/homepage banner. */
export function apiGetPublicActiveCampaigns() {
  return client.get<never, ApiResponse<PublicCampaign[]>>(ENDPOINTS.MARKETING.PUBLIC_CAMPAIGNS);
}
