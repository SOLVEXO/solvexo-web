import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mockUseParams = vi.fn();
vi.mock('react-router-dom', () => ({ useParams: () => mockUseParams() }));

const mockApiListInstalledThemes = vi.fn();
vi.mock('@/api/services/storeTheme', () => ({
  apiListInstalledThemes: (...args: unknown[]) => mockApiListInstalledThemes(...args),
}));

// Regression coverage for the P0 fix: Customize/Header-Footer/Edit-Code must
// resolve the URL's `:themeId` to THIS store's own installed row, never
// silently fall back to whichever theme is active, and must safely reject
// an id with no match (invalid, uninstalled, or belonging to another store).
import { useResolvedThemeInstance } from './useResolvedThemeInstance';

describe('useResolvedThemeInstance', () => {
  beforeEach(() => { mockUseParams.mockReset(); mockApiListInstalledThemes.mockReset(); });

  it('resolves to the installed row matching the URL themeId, even when a different row is active', async () => {
    mockUseParams.mockReturnValue({ themeId: 'theme-02-nova' });
    mockApiListInstalledThemes.mockResolvedValue({
      data: [
        { _id: 'row-atelier', themeDefinitionId: 'theme-01-atelier', status: 'active' },
        { _id: 'row-nova', themeDefinitionId: 'theme-02-nova', status: 'installed' },
      ],
    });
    const { result } = renderHook(() => useResolvedThemeInstance('store-1'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current).toEqual({ status: 'ready', installedThemeId: 'row-nova', themeDefinitionId: 'theme-02-nova' });
  });

  it('rejects safely (not-found) when the themeId has no installed row on this store', async () => {
    mockUseParams.mockReturnValue({ themeId: 'theme-99-doesnotexist' });
    mockApiListInstalledThemes.mockResolvedValue({
      data: [{ _id: 'row-atelier', themeDefinitionId: 'theme-01-atelier', status: 'active' }],
    });
    const { result } = renderHook(() => useResolvedThemeInstance('store-1'));
    await waitFor(() => expect(result.current.status).toBe('not-found'));
    expect(result.current.installedThemeId).toBeUndefined();
  });

  it('rejects safely (not-found) rather than throwing when the list call fails', async () => {
    mockUseParams.mockReturnValue({ themeId: 'theme-01-atelier' });
    mockApiListInstalledThemes.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useResolvedThemeInstance('store-1'));
    await waitFor(() => expect(result.current.status).toBe('not-found'));
  });

  it('starts in loading state before the list resolves', () => {
    mockUseParams.mockReturnValue({ themeId: 'theme-01-atelier' });
    mockApiListInstalledThemes.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useResolvedThemeInstance('store-1'));
    expect(result.current.status).toBe('loading');
  });
});
