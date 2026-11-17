import client from '../client';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** The answers of a field visit; option fields hold keys from `features/admin/pages/sales/visits/visitOptions.ts`. */
export interface VisitAnswers {
  storeName: string;
  unit?: string | null; floor?: string | null; area?: string | null;
  category?: string | null; categoryOther?: string | null; priceRange?: string | null; wholesale?: string | null;
  contactName?: string | null; contactRole?: string | null; whatsapp?: string | null; waPermission?: boolean; bestTime?: string | null;
  instagram?: string | null; facebook?: string | null; website?: string | null;
  sellsOn?: string[]; ordersPerMonth?: string | null; payments?: string[]; couriers?: string[]; courierBooking?: string | null;
  billing?: string | null; billingSoftware?: string | null; khata?: string | null; seasons?: string[]; bestSellers?: string | null;
  problem?: string | null; problemTags?: string[]; objections?: string[];
  interest: string; nextStep: string; nextStepAt?: string | null;
}
export interface VisitInput extends VisitAnswers {
  /** Made on the phone; the server stores a visit sent twice (offline retry) once. */
  clientId: string;
  visitedAt: string;
  location?: { lat: number; lng: number; accuracyM: number | null } | null;
  photoDataUrl?: string | null;
}
export interface SalesVisit extends VisitAnswers {
  _id: string; clientId: string; leadId: string; adminId: string; adminName: string | null; visitedAt: string; createdAt: string;
  location: { lat: number; lng: number; accuracyM: number | null } | null; photoUrl: string | null; taskId: string | null;
}
export interface VisitSummary { visits: number; shops: number; hot: number; demos: number; signups: number }
export interface VisitList { items: SalesVisit[]; total: number; page: number; limit: number; summary: VisitSummary }
export interface VisitSaved { visit: SalesVisit; leadId: string; alreadySaved: boolean; followUpOwner: string | null }
export interface VisitMatch {
  _id: string; leadId: string; storeName: string; area: string | null; visitedAt: string; adminName: string | null;
  interest: string; nextStep: string; nextStepAt: string | null; samePhone: boolean;
}
export interface VisitQuery { from?: string; to?: string; rep?: string; area?: string; interest?: string; q?: string; page?: number; limit?: number }

const BASE = '/api/admin/sales/visits';

// The form shows its own messages (and queues offline), so the automatic toasts stay off for saving.
export const apiSaveVisit = (input: VisitInput) => client.post<never, ApiResponse<VisitSaved>>(BASE, input, { toast: false, timeout: 45_000 });
export const apiListVisits = (params: VisitQuery = {}) => client.get<never, ApiResponse<VisitList>>(BASE, { params });
export const apiGetVisit = (id: string) => client.get<never, ApiResponse<SalesVisit>>(`${BASE}/${id}`);
export const apiUpdateVisit = (id: string, patch: Partial<VisitAnswers>) => client.patch<never, ApiResponse<SalesVisit>>(`${BASE}/${id}`, patch);
export const apiCheckVisit = (params: { phone?: string; storeName?: string; area?: string }) =>
  client.get<never, ApiResponse<VisitMatch[]>>(`${BASE}/check`, { params, toast: false });
export const apiVisitAreas = () => client.get<never, ApiResponse<string[]>>(`${BASE}/areas`, { toast: false });
