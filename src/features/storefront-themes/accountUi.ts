import type { Address, AddressPayload } from '@/api/services/address';
import type { MyReviewEntry, ReviewStatus } from '@/api/services/rating';
import { ts } from '@/utils/tStatic';
import { activeLocale } from './core/locale';

/** Shared (theme-agnostic) helpers for the buyer "Addresses" and "Reviews" pages. */

export const EMPTY_ADDRESS_FORM: AddressPayload = {
  label: 'Home', recipientName: '', phoneNumber: '',
  addressLine1: '', addressLine2: '', state: '', city: '', zipCode: '', country: '', isDefault: false,
};

/** Same required fields as the checkout's "new address" form. Returns '' when valid. */
export function validateAddressForm(f: AddressPayload): string {
  if (!f.recipientName.trim() || !f.phoneNumber.trim() || !f.addressLine1.trim()
    || !f.city.trim() || !f.state.trim() || !f.zipCode.trim() || !f.country) {
    return ts('pg.please_fill_in_every_field', 'Please fill in every field.');
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

export function reviewStatusLabel(s: ReviewStatus): string | undefined {
  const labels: Record<ReviewStatus, string> = {
    published: ts('pg.word_published', 'Published'),
    pending: ts('pg.pending_approval', 'Pending approval'),
    rejected: ts('pg.word_rejected', 'Rejected'),
  };
  return labels[s];
}

export function reviewText(r: MyReviewEntry): string {
  const last = r.comments?.[r.comments.length - 1];
  return last?.text ?? '';
}

export function formatAccountDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(activeLocale(), { year: 'numeric', month: 'short', day: 'numeric' });
}
