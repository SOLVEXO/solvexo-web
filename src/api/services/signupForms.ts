import client from '../client';

// Email signup popup (Shopify: Forms app). Seller settings + report under /api/signup-forms/:storeId,
// the storefront side under /api/signup-forms/public/:storeId.

interface Api<T> { success: boolean; message?: string; data: T }

export interface SignupFormSettings {
  enabled: boolean;
  heading: string;
  body: string;
  buttonLabel: string;
  successHeading: string;
  successMessage: string;
  discountCode: string | null;
  showAfterPageViews: number;
  delaySeconds: number;
  exitIntent: boolean;
  teaser: boolean;
  teaserText: string;
}

export interface SignupFormForSeller extends SignupFormSettings {
  views: number;
  submissions: number;
}

/** What a shopper's browser gets (no counters, no discount code until they subscribe). */
export type PublicSignupForm = Omit<SignupFormSettings, 'enabled' | 'discountCode'>;

export function apiGetSignupForm(storeId: string) {
  return client.get<never, Api<SignupFormForSeller>>(`/api/signup-forms/${storeId}`);
}

export function apiUpdateSignupForm(storeId: string, payload: Partial<SignupFormSettings>) {
  return client.put<never, Api<SignupFormForSeller>>(`/api/signup-forms/${storeId}`, payload);
}

export function apiGetPublicSignupForm(storeId: string) {
  return client.get<never, Api<PublicSignupForm | null>>(`/api/signup-forms/public/${storeId}`);
}

export function apiRecordSignupFormView(storeId: string) {
  return client.post<never, Api<null>>(`/api/signup-forms/public/${storeId}/view`, {});
}

export function apiSubmitSignupForm(storeId: string, email: string) {
  return client.post<never, Api<{ pendingConfirmation: boolean; discountCode: string | null }>>(`/api/signup-forms/public/${storeId}/submit`, { email });
}
