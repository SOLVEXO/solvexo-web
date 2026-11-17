import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Section } from '@/api/services/storefrontTypes';
import type { StoreSectionDef } from '@/api/services/storeSectionDefs';
import { ToastProvider } from '@/contexts/ToastContext';
import { resetStoreSectionDefsCache } from '@/features/storefront-themes/storeSections/useStoreSectionDefs';
import { PageSectionsEditor } from './PageSectionsEditor';

const listPublic = vi.fn();
vi.mock('@/api/services/storeSectionDefs', () => ({ apiListPublicStoreSectionDefs: (...a: unknown[]) => listPublic(...a) }));
vi.mock('@/api/services/savedSections', () => ({
  apiListSavedSections: () => Promise.resolve({ data: [] }),
  apiListPublicSavedSections: () => Promise.resolve({ data: [] }),
  apiCreateSavedSection: vi.fn(), apiUpdateSavedSection: vi.fn(), apiDeleteSavedSection: vi.fn(),
}));

const def: StoreSectionDef = {
  _id: 'd1', key: 'my.feature-cards', name: 'Feature cards', description: 'Three cards in a row', color: null,
  layout: { t: 'stack', children: [] },
  fields: [{ key: 'title', label: 'Section title', kind: 'text' }],
  block: { key: 'item', label: 'Card', fields: [{ key: 'cardTitle', label: 'Card title', kind: 'text' }], defaults: { cardTitle: 'Fast' } },
  defaults: { title: 'Why us' }, initialBlocks: 2,
};

function Harness({ initial, spy }: { initial: Section[]; spy?: (s: Section[]) => void }) {
  const [sections, setSections] = useState(initial);
  return (
    <MemoryRouter initialEntries={['/store/S1/online-store/customize']}>
      <ToastProvider>
        <Routes>
          <Route path="/store/:storeId/*" element={<PageSectionsEditor sections={sections} onChange={n => { setSections(n); spy?.(n); }} onPersist={setSections} pageOptions={[]} storeId="S1" />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
  localStorage.clear();
  resetStoreSectionDefsCache();
  listPublic.mockReset();
  listPublic.mockResolvedValue({ data: [def] });
});
afterEach(cleanup);

describe('PageSectionsEditor + seller-built sections', () => {
  it('Add section -> "My sections" lists the design and adds a ready section with its starting values and cards', async () => {
    const spy = vi.fn();
    render(<Harness initial={[]} spy={spy} />);
    fireEvent.click(await screen.findByText('Add Your First Section'));
    fireEvent.click(await screen.findByRole('tab', { name: 'My sections' }));
    expect(await screen.findByText('Three cards in a row')).toBeTruthy();
    fireEvent.click(screen.getByText('Feature cards'));
    await waitFor(() => expect(spy).toHaveBeenCalled());
    const added = (spy.mock.calls.at(-1)![0] as Section[])[0];
    expect(added.type).toBe('theme_section');
    expect(added.settings).toMatchObject({ sectionKey: 'my.feature-cards', title: 'Why us' });
    expect(added.blocks).toHaveLength(2);
    expect(added.blocks[0]).toMatchObject({ type: 'theme_block', settings: { blockKey: 'my.feature-cards.item', cardTitle: 'Fast' } });
  });

  it('with none designed yet, the tab points to the Section builder', async () => {
    listPublic.mockResolvedValue({ data: [] });
    render(<Harness initial={[]} />);
    fireEvent.click(await screen.findByText('Add Your First Section'));
    fireEvent.click(await screen.findByRole('tab', { name: 'My sections' }));
    const link = await screen.findByRole('link', { name: 'Section builder' });
    expect(link.getAttribute('href')).toBe('/store/S1/online-store/section-builder');
  });

  it('a page section built by the seller shows its name, its form fields and its cards in the editor', async () => {
    const section: Section = {
      _id: 's1', type: 'theme_section', settings: { sectionKey: 'my.feature-cards', title: 'Hello' },
      blocks: [{ _id: 'b1', type: 'theme_block', settings: { blockKey: 'my.feature-cards.item', cardTitle: 'One' } } as never],
    };
    render(<Harness initial={[section]} />);
    const title = await screen.findByText('Feature cards');
    fireEvent.click(title);
    // (the editor's field labels are plain text, not <label for>)
    expect(await screen.findByText('Section title')).toBeTruthy();
    expect(screen.getByDisplayValue('Hello')).toBeTruthy();
    expect(screen.getByText('Cards')).toBeTruthy(); // the repeating group's label
  });

  it('a section whose design was deleted still shows a card (it can be removed)', async () => {
    listPublic.mockResolvedValue({ data: [] });
    const orphan: Section = { _id: 's2', type: 'theme_section', settings: { sectionKey: 'my.gone' }, blocks: [] };
    render(<Harness initial={[orphan]} />);
    await waitFor(() => expect(listPublic).toHaveBeenCalled());
    expect(screen.getAllByLabelText('More section actions').length).toBe(1);
  });
});
