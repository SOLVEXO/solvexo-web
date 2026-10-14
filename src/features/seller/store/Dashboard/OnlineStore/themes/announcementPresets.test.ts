import { describe, it, expect } from 'vitest';
import { ANNOUNCEMENT_PRESETS, applyAnnouncementPreset } from './announcementPresets';
import type { StoreAnnouncementBar } from '@/api/services/store';

const empty: StoreAnnouncementBar = { message: null, type: 'info', ctaLabel: null, ctaLink: null, isActive: true, startAt: null, endAt: null };
const byId = (id: string) => ANNOUNCEMENT_PRESETS.find(p => p.id === id)!;

describe('applyAnnouncementPreset', () => {
  it('fills sample text only for an empty bar', () => {
    expect(applyAnnouncementPreset(empty, byId('promo_code'))).toMatchObject({ message: expect.any(String), couponCode: 'WELCOME10', preset: 'promo_code' });
    const mine = applyAnnouncementPreset({ ...empty, message: 'My own text' }, byId('luxury'));
    expect(mine.message).toBe('My own text');
    expect(mine).toMatchObject({ bgColor: '#0b0b0b', uppercase: true, preset: 'luxury' });
  });
  it('switching designs resets the look fully (no gradient left over)', () => {
    const gradient = applyAnnouncementPreset(empty, byId('gradient'));
    expect(applyAnnouncementPreset(gradient, byId('minimal'))).toMatchObject({ bgColor2: null, animation: 'slide', showIcon: false });
  });
  it('adds a countdown only when there is none', () => {
    const withTimer = applyAnnouncementPreset(empty, byId('sale_countdown'));
    expect(new Date(withTimer.countdownEndAt!).getTime()).toBeGreaterThan(Date.now());
    const kept = applyAnnouncementPreset({ ...empty, countdownEndAt: '2031-01-01T00:00:00.000Z' }, byId('sale_countdown'));
    expect(kept.countdownEndAt).toBe('2031-01-01T00:00:00.000Z');
  });
});
