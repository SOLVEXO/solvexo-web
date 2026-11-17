import client from '@/api/client';

// These endpoints answer with the data itself (no `{ success, data }` wrapper).

export interface PublicQuestion { id: string; askerName: string; question: string; answer: string; answeredAt: string | null; askedAt: string }
export interface SellerQuestion {
  id: string; productId: string; productName: string; productSlug: string | null; askerName: string; askerEmail: string;
  question: string; answer: string; answeredAt: string | null; status: 'pending' | 'published' | 'hidden'; askedAt: string;
}
export interface SellerQuestionList { items: SellerQuestion[]; pagination: { page: number; limit: number; total: number; totalPages: number }; pending: number }

/** Storefront (no login): answered questions of a product. */
export const apiGetPublicQuestions = (storeId: string, productId: string) =>
  client.get<never, { items: PublicQuestion[] }>(`/api/public/product-questions/${encodeURIComponent(storeId)}/${encodeURIComponent(productId)}`);

export const apiAskQuestion = (storeId: string, productId: string, body: { name: string; email?: string; question: string; website?: string }) =>
  client.post<never, { ok: boolean; message: string }>(`/api/public/product-questions/${encodeURIComponent(storeId)}/${encodeURIComponent(productId)}`, body);

const base = (storeId: string) => `/api/product-questions/${encodeURIComponent(storeId)}`;
export const apiListQuestions = (storeId: string, params: { status?: string; page?: number }) => client.get<never, SellerQuestionList>(base(storeId), { params });
export const apiAnswerQuestion = (storeId: string, id: string, body: { answer: string; publish?: boolean }) => client.put<never, { ok: boolean }>(`${base(storeId)}/${id}/answer`, body);
export const apiSetQuestionStatus = (storeId: string, id: string, status: SellerQuestion['status']) => client.put<never, { ok: boolean }>(`${base(storeId)}/${id}/status`, { status });
export const apiDeleteQuestion = (storeId: string, id: string) => client.delete<never, { ok: boolean }>(`${base(storeId)}/${id}`);
