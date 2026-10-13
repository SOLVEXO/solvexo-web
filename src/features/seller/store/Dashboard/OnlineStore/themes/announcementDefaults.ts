import type { StoreAnnouncementBar, StoreAnnouncementType } from '@/api/services/store';

export const ANNOUNCEMENT_TYPE_LABEL: Record<StoreAnnouncementType, string> = {
  info: 'Info', sale: 'Sale', coupon: 'Coupon', warning: 'Warning', shipping: 'Shipping', holiday: 'Holiday',
};

export const DEFAULT_ANNOUNCEMENT: StoreAnnouncementBar = {
  message: null, type: 'info', ctaLabel: null, ctaLink: null, isActive: false, startAt: null, endAt: null,
};
