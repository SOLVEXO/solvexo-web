import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutosave } from './useAutosave';

describe('useAutosave', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('saves once, a few seconds after the last edit', () => {
    const save = vi.fn();
    const { rerender } = renderHook(({ v }) => useAutosave({ active: true, version: v, save, delayMs: 3000 }), { initialProps: { v: 1 } });
    act(() => { vi.advanceTimersByTime(2000); });
    rerender({ v: 2 }); // still typing: the timer restarts
    act(() => { vi.advanceTimersByTime(2000); });
    expect(save).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1500); });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('does nothing while inactive (nothing to save, or a save is running)', () => {
    const save = vi.fn();
    renderHook(() => useAutosave({ active: false, version: 1, save }));
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(save).not.toHaveBeenCalled();
  });

  it('cancels the pending save when it becomes inactive', () => {
    const save = vi.fn();
    const { rerender } = renderHook(({ a }) => useAutosave({ active: a, version: 1, save, delayMs: 3000 }), { initialProps: { a: true } });
    rerender({ a: false });
    act(() => { vi.advanceTimersByTime(5000); });
    expect(save).not.toHaveBeenCalled();
  });
});
