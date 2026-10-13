import client from '../client';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

/** A question & answer the store shows on its `/faqs` page. */
export interface StoreFaq { _id: string; question: string; answer: string; order: number; isActive: boolean }
export interface PublicStoreFaq { _id: string; question: string; answer: string; order: number }
export type StoreFaqInput = { question: string; answer: string; order?: number; isActive?: boolean };

const base = (storeId: string) => `/api/store-faq/${storeId}`;

export const apiListStoreFaqs = (storeId: string) => client.get<never, ApiResponse<StoreFaq[]>>(base(storeId));
export const apiCreateStoreFaq = (storeId: string, body: StoreFaqInput) => client.post<never, ApiResponse<StoreFaq>>(base(storeId), body);
export const apiUpdateStoreFaq = (storeId: string, faqId: string, body: Partial<StoreFaqInput>) => client.patch<never, ApiResponse<StoreFaq>>(`${base(storeId)}/${faqId}`, body);
export const apiDeleteStoreFaq = (storeId: string, faqId: string) => client.delete<never, ApiResponse<null>>(`${base(storeId)}/${faqId}`);

/** The active FAQs of a store, in the seller's order (public, no login). */
export const apiListPublicStoreFaqs = (storeId: string) => client.get<never, ApiResponse<PublicStoreFaq[]>>(`/api/public/store-faqs/${storeId}`);
