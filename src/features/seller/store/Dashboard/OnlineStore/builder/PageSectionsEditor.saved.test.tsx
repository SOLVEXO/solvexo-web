import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { useState } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import type { SavedSectionEntry } from '@/api/services/savedSections';
import { ToastProvider } from '@/contexts/ToastContext';
import { PageSectionsEditor } from './PageSectionsEditor';

const listSeller = vi.fn();
const createSaved = vi.fn();
const updateSaved = vi.fn();
vi.mock('@/api/services/savedSections', () => ({
  apiListSavedSections: (...a: unknown[]) => listSeller(...a),
  apiListPublicSavedSections: () => Promise.resolve({ data: [] }),
  apiCreateSavedSection: (...a: unknown[]) => createSaved(...a),
  apiUpdateSavedSection: (...a: unknown[]) => updateSaved(...a),
  apiDeleteSavedSection: vi.fn(),
}));

const entry: SavedSectionEntry = {
  _id: 'e1', name: 'Free shipping bar', type: 'rich_text', settings: { heading: 'Free shipping over $50' }, blocks: [], colorSchemeId: null, usedOn: 2,
};
const rich = (id: string, heading: string): Section => ({ _id: id, type: 'rich_text', settings: { heading }, blocks: [] });

function Harness({ initial, spy }: { initial: Section[]; spy?: (s: Section[]) => void }) {
  const [sections, setSections] = useState(initial);
  return (
    <ToastProvider>
      <PageSectionsEditor
        sections={sections}
        onChange={next => { setSections(next); spy?.(next); }}
        onPersist={next => setSections(next)}
        pageOptions={[]}
        storeId="S1"
      />
    </ToastProvider>
  );
}

const openMenu = async (index = 0) => {
  const triggers = await screen.findAllByLabelText('More section actions');
  fireEvent.click(triggers[index]);
  return screen.findByRole('menu');
};
const clickItem = async (name: RegExp, index = 0) => {
  const menu = await openMenu(index);
  fireEvent.click(within(menu).getByText(name));
};

beforeEach(() => {
  // jsdom has no matchMedia (the action menu asks it whether to open as a phone sheet)
  window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
  localStorage.clear();
  listSeller.mockReset();
  createSaved.mockReset();
  updateSaved.mockReset();
  listSeller.mockResolvedValue({ data: [entry] });
});
afterEach(cleanup);

describe('PageSectionsEditor: lock, copy / paste, saved sections', () => {
  it('locking a section removes its remove / duplicate / hide actions and shows an unlock control', async () => {
    render(<Harness initial={[rich('a', 'First'), rich('b', 'Second')]} />);
    await clickItem(/Lock section/);
    expect(screen.getByLabelText('Unlock section')).toBeTruthy();
    // its own menu now says Unlock and refuses Remove
    const menu = await openMenu(0);
    expect(within(menu).getByText('Unlock section')).toBeTruthy();
    const remove = within(menu).getByText('Remove section').closest('button, [role="menuitem"]') as HTMLElement;
    expect(remove.hasAttribute('disabled') || remove.getAttribute('aria-disabled') === 'true').toBe(true);
    // the section after it is not affected
    expect(screen.getAllByLabelText('Hide section').length).toBeGreaterThan(0);
  });

  it('unlocking puts everything back', async () => {
    render(<Harness initial={[{ ...rich('a', 'First'), locked: true }]} />);
    fireEvent.click(screen.getByLabelText('Unlock section'));
    await waitFor(() => expect(screen.queryByLabelText('Unlock section')).toBeNull());
    expect((screen.getByLabelText('Hide section') as HTMLButtonElement).disabled).toBe(false);
  });

  it('a locked section shows a notice instead of its fields when opened', async () => {
    render(<Harness initial={[{ ...rich('a', 'First'), locked: true }]} />);
    fireEvent.click(screen.getByText('Rich Text', { exact: false }));
    expect(await screen.findByText(/This section is locked/)).toBeTruthy();
  });

  it('copy then paste adds a new section with the same content and no id', async () => {
    const spy = vi.fn();
    render(<Harness initial={[rich('a', 'Copy me')]} spy={spy} />);
    expect((screen.getByText('Paste').closest('button') as HTMLButtonElement).disabled).toBe(true); // nothing copied yet
    await clickItem(/Copy section/);
    await waitFor(() => expect(localStorage.getItem('solvexo:section-clipboard')).toContain('Copy me'));
    await waitFor(() => expect((screen.getByText('Paste').closest('button') as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByText('Paste'));
    const last = spy.mock.calls.at(-1)![0] as Section[];
    expect(last).toHaveLength(2);
    expect(last[1].settings.heading).toBe('Copy me');
    expect(last[1]._id).toBeUndefined();
  });

  it('"Save to library" stores a copy and swaps the page\'s section for a reference to it', async () => {
    createSaved.mockResolvedValue({ data: { ...entry, _id: 'new1', name: 'Hero text' } });
    const spy = vi.fn();
    render(<Harness initial={[rich('a', 'Hello')]} spy={spy} />);
    await clickItem(/Save to library/);
    const name = await screen.findByLabelText('Name');
    fireEvent.change(name, { target: { value: 'Hero text' } });
    fireEvent.click(screen.getByText('Save section'));
    await waitFor(() => expect(createSaved).toHaveBeenCalled());
    const [storeId, input] = createSaved.mock.calls[0];
    expect(storeId).toBe('S1');
    expect(input).toMatchObject({ name: 'Hero text', type: 'rich_text', settings: { heading: 'Hello' } });
    expect(input.blocks).toEqual([]);
    await waitFor(() => {
      const last = spy.mock.calls.at(-1)![0] as Section[];
      expect(last[0]).toMatchObject({ _id: 'a', type: 'saved_section', settings: { savedSectionId: 'new1' } });
    });
  });

  it('"Save to library" can keep the page\'s own section when the box is unticked', async () => {
    createSaved.mockResolvedValue({ data: { ...entry, _id: 'new2' } });
    const spy = vi.fn();
    render(<Harness initial={[rich('a', 'Hello')]} spy={spy} />);
    await clickItem(/Save to library/);
    fireEvent.click(await screen.findByLabelText(/Use the saved section on this page too/));
    fireEvent.click(screen.getByText('Save section'));
    await waitFor(() => expect(createSaved).toHaveBeenCalled());
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows a name error from the server and keeps the dialog open', async () => {
    createSaved.mockRejectedValue(new Error('A saved section with this name already exists'));
    render(<Harness initial={[rich('a', 'Hello')]} />);
    await clickItem(/Save to library/);
    await screen.findByLabelText('Name');
    fireEvent.click(screen.getByText('Save section'));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(/already exists/)).toBeTruthy();
  });

  it('a saved-section card shows the library name, where it is used, and Edit / Detach', async () => {
    render(<Harness initial={[{ _id: 'p1', type: 'saved_section', settings: { savedSectionId: 'e1' }, blocks: [] }]} />);
    expect(await screen.findByText('Free shipping bar')).toBeTruthy();
    expect(await screen.findByText(/used on 2 pages/)).toBeTruthy();
    fireEvent.click(screen.getByText('Free shipping bar'));
    expect(await screen.findByText('Edit saved section')).toBeTruthy();
    expect(screen.getByText(/Detach/)).toBeTruthy();
  });

  it('editing the saved section saves the shared content (not just this page)', async () => {
    updateSaved.mockResolvedValue({ data: entry });
    render(<Harness initial={[{ _id: 'p1', type: 'saved_section', settings: { savedSectionId: 'e1' }, blocks: [] }]} />);
    fireEvent.click(await screen.findByText('Free shipping bar'));
    fireEvent.click(await screen.findByText('Edit saved section'));
    fireEvent.change(await screen.findByLabelText('Name in the library'), { target: { value: 'Shipping banner' } });
    fireEvent.click(screen.getByText('Save changes'));
    await waitFor(() => expect(updateSaved).toHaveBeenCalled());
    const [storeId, id, patch] = updateSaved.mock.calls[0];
    expect([storeId, id]).toEqual(['S1', 'e1']);
    expect(patch).toMatchObject({ name: 'Shipping banner', settings: { heading: 'Free shipping over $50' } });
  });

  it('a reference to a deleted entry says so instead of showing an empty card', async () => {
    listSeller.mockResolvedValue({ data: [] });
    render(<Harness initial={[{ _id: 'p1', type: 'saved_section', settings: { savedSectionId: 'gone' }, blocks: [] }]} />);
    fireEvent.click((await screen.findAllByText('Saved section', { selector: 'span' }))[0]);
    expect(await screen.findByText(/was deleted/)).toBeTruthy();
  });

  it('Add section -> Saved sections lists the library and places a reference', async () => {
    const spy = vi.fn();
    render(<Harness initial={[rich('a', 'Hello')]} spy={spy} />);
    fireEvent.click(screen.getByText('Add Section'));
    fireEvent.click(await screen.findByRole('tab', { name: 'Saved sections' }));
    fireEvent.click(await screen.findByText('Free shipping bar'));
    await waitFor(() => {
      const last = spy.mock.calls.at(-1)![0] as Section[];
      expect(last).toHaveLength(2);
      expect(last[1]).toMatchObject({ type: 'saved_section', settings: { savedSectionId: 'e1' } });
    });
  });

  it('an empty library explains how to fill it', async () => {
    listSeller.mockResolvedValue({ data: [] });
    render(<Harness initial={[rich('a', 'Hello')]} />);
    fireEvent.click(screen.getByText('Add Section'));
    fireEvent.click(await screen.findByRole('tab', { name: 'Saved sections' }));
    expect(await screen.findByText(/Nothing saved yet/)).toBeTruthy();
  });
});
