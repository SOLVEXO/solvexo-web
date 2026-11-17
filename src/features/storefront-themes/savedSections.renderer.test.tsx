import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import type { Section } from '@/api/services/storefrontTypes';
import { resetSavedSectionsCache } from './useSavedSections';

const listPublic = vi.fn();
vi.mock('@/api/services/savedSections', () => ({ apiListPublicSavedSections: (...a: unknown[]) => listPublic(...a) }));
vi.mock('@/features/storefront/StorefrontContext', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/storefront/StorefrontContext')>();
  return { ...actual, useStorefront: () => ({ theme: null, store: { storeId: 'S1' } }) };
});

// the index registers every Maison section renderer
import { FashionSectionRenderer } from './theme-03-fashion/sections';

const ref = (over: Partial<Section> = {}): Section => ({ _id: 'p1', type: 'saved_section', settings: { savedSectionId: 'e1' }, blocks: [], ...over });
const rich = (id: string, heading: string): Section => ({ _id: id, type: 'rich_text', settings: { heading }, blocks: [] });

beforeEach(() => {
  resetSavedSectionsCache();
  listPublic.mockReset();
  listPublic.mockResolvedValue({ data: [{ _id: 'e1', name: 'Bar', type: 'rich_text', settings: { heading: 'FROM THE LIBRARY', paddingTop: 12 }, blocks: [], colorSchemeId: null }] });
});
afterEach(cleanup);

describe('Maison renderer + saved sections', () => {
  it('draws the library content where a page holds a reference', async () => {
    render(<FashionSectionRenderer sections={[rich('a', 'Page text'), ref()]} />);
    expect(screen.getByText('Page text')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('FROM THE LIBRARY')).toBeTruthy());
    expect(listPublic).toHaveBeenCalledWith('S1');
  });

  it('a hidden reference stays hidden', async () => {
    render(<FashionSectionRenderer sections={[ref({ enabled: false })]} />);
    await waitFor(() => expect(listPublic).toHaveBeenCalled());
    expect(screen.queryByText('FROM THE LIBRARY')).toBeNull();
  });

  it('the same entry can appear twice on one page', async () => {
    render(<FashionSectionRenderer sections={[ref({ _id: 'x' }), ref({ _id: 'y' })]} />);
    await waitFor(() => expect(screen.getAllByText('FROM THE LIBRARY')).toHaveLength(2));
    expect(listPublic).toHaveBeenCalledTimes(1);
  });

  it('the entry\'s own page-design settings travel with it (here: its inner padding)', async () => {
    const { container } = render(<FashionSectionRenderer sections={[ref()]} />);
    await waitFor(() => expect(screen.getByText('FROM THE LIBRARY')).toBeTruthy());
    expect(container.querySelector('.sx-pad-t')).not.toBeNull();
  });

  it('a reference to a deleted entry draws nothing and does not crash the page', async () => {
    listPublic.mockResolvedValue({ data: [] });
    render(<FashionSectionRenderer sections={[rich('a', 'Page text'), ref({ settings: { savedSectionId: 'gone' } })]} />);
    await waitFor(() => expect(listPublic).toHaveBeenCalled());
    expect(screen.getByText('Page text')).toBeTruthy();
  });
});
