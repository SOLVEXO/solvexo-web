import client from '../client';
import { ENDPOINTS } from '../endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** Public shape — a seller's review of the Solvexo platform (homepage social-proof). */
export interface Testimonial {
  id:               string;
  name:             string;
  storeName:        string | null;
  rating:           number;
  text:             string;
  isVerifiedSeller: boolean;
}

export type TestimonialStatus = 'pending' | 'approved' | 'rejected';

/** Admin-managed record — the raw schema, edited via the Testimonials admin page. */
export interface AdminTestimonial {
  _id:              string;
  sellerName:       string;
  storeName:        string | null;
  sellerId:         string | null;
  storeId:          string | null;
  status:           TestimonialStatus;
  submittedBy:      'admin' | 'seller';
  rating:           number;
  text:             string;
  isVerifiedSeller: boolean;
  order:            number;
  isActive:         boolean;
  createdAt:        string;
  updatedAt:        string;
}

/** A seller's own submission — same shape, used by their dashboard's "my
 *  story" card to show its current status instead of the submission form. */
export type MyTestimonialSubmission = AdminTestimonial;

export interface TestimonialStats { active: number; inactive: number }

export interface CreateTestimonialPayload {
  sellerName:       string;
  storeName?:       string;
  rating:           number;
  text:             string;
  isVerifiedSeller?: boolean;
  order?:           number;
  isActive?:        boolean;
}

export type UpdateTestimonialPayload = Partial<CreateTestimonialPayload>;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/testimonials — real, admin-curated seller reviews of Solvexo itself. */
export function apiGetTestimonials(limit = 6) {
  return client.get<never, { success: boolean; count: number; data: Testimonial[] }>(
    ENDPOINTS.TESTIMONIALS.LIST, { params: { limit } },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────
export function apiGetAllTestimonials() {
  return client.get<never, { success: boolean; count: number; stats: TestimonialStats; data: AdminTestimonial[] }>(
    ENDPOINTS.TESTIMONIALS.ADMIN_ALL,
  );
}

export function apiCreateTestimonial(payload: CreateTestimonialPayload) {
  return client.post<never, { success: boolean; message: string; data: AdminTestimonial }>(
    ENDPOINTS.TESTIMONIALS.CREATE, payload,
  );
}

export function apiUpdateTestimonial(id: string, payload: UpdateTestimonialPayload) {
  return client.put<never, { success: boolean; message: string; data: AdminTestimonial }>(
    ENDPOINTS.TESTIMONIALS.UPDATE(id), payload,
  );
}

export function apiToggleTestimonial(id: string) {
  return client.put<never, { success: boolean; message: string; data: AdminTestimonial }>(
    ENDPOINTS.TESTIMONIALS.TOGGLE(id), null,
  );
}

export function apiDeleteTestimonial(id: string) {
  return client.delete<never, { success: boolean; message: string }>(ENDPOINTS.TESTIMONIALS.DELETE(id));
}

export function apiApproveTestimonial(id: string) {
  // `{}` not `null` — an explicit empty object always serializes to a clean
  // JSON body regardless of axios/browser version; `null` is ambiguous
  // (some environments send no body at all, which can confuse a proxy or
  // body-parser expecting `Content-Type: application/json`).
  return client.patch<never, { success: boolean; message: string; data: AdminTestimonial }>(
    ENDPOINTS.TESTIMONIALS.APPROVE(id), {},
  );
}

export function apiRejectTestimonial(id: string) {
  return client.patch<never, { success: boolean; message: string; data: AdminTestimonial }>(
    ENDPOINTS.TESTIMONIALS.REJECT(id), {},
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SELLER — self-submit a story about Solvexo (goes to a pending queue for
// admin review; sellerName/storeName are derived server-side, never sent
// from here — see SubmitTestimonialDto's own doc comment on the backend).
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/testimonials/mine — this seller's own latest submission, if any. */
export function apiGetMyTestimonialSubmission() {
  return client.get<never, { success: boolean; data: MyTestimonialSubmission | null }>(ENDPOINTS.TESTIMONIALS.MINE);
}

export interface SubmitTestimonialPayload {
  rating: number;
  text:   string;
}

/** POST /api/testimonials/submit — refuses a second submission while one is pending/approved. */
export function apiSubmitTestimonial(payload: SubmitTestimonialPayload) {
  return client.post<never, { success: boolean; message: string; data: MyTestimonialSubmission }>(
    ENDPOINTS.TESTIMONIALS.SUBMIT, payload,
  );
}
