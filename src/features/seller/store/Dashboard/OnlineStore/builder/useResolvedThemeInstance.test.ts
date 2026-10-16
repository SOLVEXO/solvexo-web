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
    mockUseParams.mockReturnValue({ themeId: 'theme-04-beauty' });
    mockApiListInstalledThemes.mockResolvedValue({
      data: [
        { _id: 'row-fashion', themeDefinitionId: 'theme-03-fashion', status: 'active' },
        { _id: 'row-beauty', themeDefinitionId: 'theme-04-beauty', status: 'installed' },
      ],
    });
    const { result } = renderHook(() => useResolvedThemeInstance('store-1'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current).toEqual({ status: 'ready', installedThemeId: 'row-beauty', themeDefinitionId: 'theme-04-beauty' });
  });

  it('resolves duplicate copies independently by installed row id', async () => {
    mockUseParams.mockReturnValue({ themeId: 'row-fashion-copy' });
    mockApiListInstalledThemes.mockResolvedValue({
      data: [
        { _id: 'row-fashion', themeDefinitionId: 'theme-03-fashion', status: 'active' },
        { _id: 'row-fashion-copy', themeDefinitionId: 'theme-03-fashion', status: 'installed' },
      ],
    });
    const { result } = renderHook(() => useResolvedThemeInstance('store-1'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current).toEqual({ status: 'ready', installedThemeId: 'row-fashion-copy', themeDefinitionId: 'theme-03-fashion' });
  });

  it('keeps older definition-id editor links pointed at the active duplicate', async () => {
    mockUseParams.mockReturnValue({ themeId: 'theme-03-fashion' });
    mockApiListInstalledThemes.mockResolvedValue({
      data: [
        { _id: 'row-fashion-copy', themeDefinitionId: 'theme-03-fashion', status: 'installed' },
        { _id: 'row-fashion', themeDefinitionId: 'theme-03-fashion', status: 'active' },
      ],
    });
    const { result } = renderHook(() => useResolvedThemeInstance('store-1'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current).toEqual({ status: 'ready', installedThemeId: 'row-fashion', themeDefinitionId: 'theme-03-fashion' });
  });

  it('rejects safely (not-found) when the themeId has no installed row on this store', async () => {
    mockUseParams.mockReturnValue({ themeId: 'theme-99-doesnotexist' });
    mockApiListInstalledThemes.mockResolvedValue({
      data: [{ _id: 'row-fashion', themeDefinitionId: 'theme-03-fashion', status: 'active' }],
    });
    const { result } = renderHook(() => useResolvedThemeInstance('store-1'));
    await waitFor(() => expect(result.current.status).toBe('not-found'));
    expect(result.current.installedThemeId).toBeUndefined();
  });

  it('rejects safely (not-found) rather than throwing when the list call fails', async () => {
    mockUseParams.mockReturnValue({ themeId: 'theme-03-fashion' });
    mockApiListInstalledThemes.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useResolvedThemeInstance('store-1'));
    await waitFor(() => expect(result.current.status).toBe('not-found'));
  });

  it('starts in loading state before the list resolves', () => {
    mockUseParams.mockReturnValue({ themeId: 'theme-03-fashion' });
    mockApiListInstalledThemes.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useResolvedThemeInstance('store-1'));
    expect(result.current.status).toBe('loading');
  });
});
