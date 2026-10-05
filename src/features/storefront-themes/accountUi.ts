import type { Address, AddressPayload } from '@/api/services/address';
import type { MyReviewEntry, ReviewStatus } from '@/api/services/rating';

/** Shared (theme-agnostic) helpers for the buyer "Addresses" and "Reviews" pages. */

export const EMPTY_ADDRESS_FORM: AddressPayload = {
  label: 'Home', recipientName: '', phoneNumber: '',
  addressLine1: '', addressLine2: '', state: '', city: '', zipCode: '', country: '', isDefault: false,
};

/** Same required fields as the checkout's "new address" form. Returns '' when valid. */
export function validateAddressForm(f: AddressPayload): string {
  if (!f.recipientName.trim() || !f.phoneNumber.trim() || !f.addressLine1.trim()
    || !f.city.trim() || !f.state.trim() || !f.zipCode.trim() || !f.country) {
    return 'Please fill in every field.';
  }
  return '';
}

export function addressToForm(a: Address): AddressPayload {
  return {
    label: a.label || 'Home', recipientName: a.recipientName, phoneNumber: a.phoneNumber,
    addressLine1: a.addressLine1, addressLine2: a.addressLine2 ?? '', state: a.state,
    city: a.city, zipCode: a.zipCode, country: a.country ?? '', isDefault: a.isDefault,
  };
}

/** Default address first, then the rest in their original order. */
export function sortAddresses(list: Address[]): Address[] {
  return [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

export function addressLines(a: Address): string[] {
  return [
    a.addressLine1,
    a.addressLine2,
    [a.city, a.state, a.zipCode].filter(Boolean).join(', '),
    a.country ?? '',
  ].filter(Boolean);
}

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  published: 'Published',
  pending: 'Pending approval',
  rejected: 'Rejected',
};

export function reviewText(r: MyReviewEntry): string {
  const last = r.comments?.[r.comments.length - 1];
  return last?.text ?? '';
}

export function formatAccountDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
