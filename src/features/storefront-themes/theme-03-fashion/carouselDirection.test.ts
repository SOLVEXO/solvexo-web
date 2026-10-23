import { describe, expect, it } from 'vitest';
import { keyStep, swipeStep, trackOffsetPct } from './carouselDirection';

describe('carouselDirection', () => {
  it('maps arrow keys to visual direction', () => {
    expect(keyStep('ArrowRight', false)).toBe(1);
    expect(keyStep('ArrowLeft', false)).toBe(-1);
    expect(keyStep('ArrowLeft', true)).toBe(1);
    expect(keyStep('ArrowRight', true)).toBe(-1);
    expect(keyStep('Enter', true)).toBe(0);
  });
  it('maps swipes', () => {
    expect(swipeStep(-80, false)).toBe(1);
    expect(swipeStep(80, false)).toBe(-1);
    expect(swipeStep(80, true)).toBe(1);
    expect(swipeStep(-80, true)).toBe(-1);
    expect(swipeStep(30, true)).toBe(0);
  });
  it('flips the track offset sign in RTL', () => {
    expect(trackOffsetPct(2, false)).toBe(-200);
    expect(trackOffsetPct(2, true)).toBe(200);
    expect(trackOffsetPct(0, false) + 0).toBe(0);
  });
});
