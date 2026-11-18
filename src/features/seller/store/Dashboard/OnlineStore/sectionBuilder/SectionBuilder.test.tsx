import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { StoreSectionDef } from '@/api/services/storeSectionDefs';
import { SectionDesigner } from './SectionDesigner';
import { SectionBuilderPage } from './SectionBuilderPage';
import { STARTERS } from './layoutTree';

const list = vi.fn();
const create = vi.fn();
const update = vi.fn();
const remove = vi.fn();
const invalidate = vi.fn();
const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

vi.mock('@/api/services/storeSectionDefs', () => ({
  apiListStoreSectionDefs: (...a: unknown[]) => list(...a),
  apiCreateStoreSectionDef: (...a: unknown[]) => create(...a),
  apiUpdateStoreSectionDef: (...a: unknown[]) => update(...a),
  apiDeleteStoreSectionDef: (...a: unknown[]) => remove(...a),
  apiListPublicStoreSectionDefs: () => Promise.resolve({ data: [] }),
}));
vi.mock('@/features/storefront-themes/storeSections/useStoreSectionDefs', () => ({ invalidateStoreSectionDefs: (...a: unknown[]) => invalidate(...a) }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));
vi.mock('@/components/layouts/StoreLayout', () => ({
  useStoreWorkspace: () => ({ storeId: 'S1' }),
  StorePageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => <header><h1>{title}</h1>{actions}</header>,
}));

const featureCards = STARTERS.find(s => s.id === 'feature-cards')!;
const existing: StoreSectionDef = {
  _id: 'd1', key: 'my.banner', name: 'Banner', description: 'Top banner', color: null, layout: STARTERS[0].layout,
  fields: [{ key: 'title', label: 'Heading', kind: 'text' }], block: null, defaults: { title: 'Your heading' }, initialBlocks: 0, usedOn: 2,
};

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
  [list, create, update, remove, invalidate, toast.success, toast.error, toast.info].forEach(f => f.mockReset());
  list.mockResolvedValue({ data: [existing] });
});
afterEach(cleanup);

describe('SectionDesigner', () => {
  const mount = (onSave = vi.fn(), name = '') => {
    render(<SectionDesigner value={{ name, description: '', layout: featureCards.layout }} onSave={onSave} onCancel={vi.fn()} />);
    return onSave;
  };

  it('shows the layout tree and a live preview with the starting texts', () => {
    mount();
    expect(screen.getByText(/Layout · \d+ elements/)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Why shop with us' }).textContent).toBe('Why shop with us');
    // three starting cards in the preview
    expect(screen.getAllByText('Fast delivery')).toHaveLength(3);
  });

  it('Save needs a name, then sends the name and the whole layout', () => {
    const onSave = mount();
    const save = screen.getByText('Save section').closest('button') as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Section name'), { target: { value: '  Feature cards  ' } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledTimes(1);
    const input = onSave.mock.calls[0][0];
    expect(input.name).toBe('Feature cards');
    expect(input.layout.t).toBe('stack');
    expect(JSON.stringify(input.layout)).toContain('cardTitle');
  });

  it('selecting an element shows its settings; changing its starting text changes the preview and the saved layout', () => {
    const onSave = mount(vi.fn(), 'X');
    fireEvent.click(screen.getByText('Heading: Heading'));
    const field = screen.getByLabelText('Starting text') as HTMLInputElement;
    expect(field.value).toBe('Why shop with us');
    fireEvent.change(field, { target: { value: 'Brand new heading' } });
    expect(screen.getByRole('heading', { level: 2, name: 'Brand new heading' })).toBeTruthy();
    fireEvent.click(screen.getByText('Save section'));
    expect(JSON.stringify(onSave.mock.calls[0][0].layout)).toContain('Brand new heading');
  });

  it('adds an element inside the selected group, with its own new field name', async () => {
    const onSave = mount(vi.fn(), 'X');
    fireEvent.click(screen.getAllByText('Add element').at(-1)!); // the root group's own menu (it is listed after its children's)
    fireEvent.click(within(await screen.findByRole('menu')).getByText('Text'));
    fireEvent.click(screen.getByText('Save section'));
    const layout = onSave.mock.calls[0][0].layout;
    const added = layout.children[layout.children.length - 1];
    expect(added.t).toBe('text');
    expect(added.key).toBe('text'); // free name, not the starter's own "cardText"/"text" clash
  });

  it('a section can have only one repeating group: the menu refuses a second', async () => {
    mount();
    fireEvent.click(screen.getAllByText('Add element')[0]);
    const menu = await screen.findByRole('menu');
    const item = within(menu).getByText('Repeating items').closest('button, [role="menuitem"]') as HTMLElement;
    expect(item.hasAttribute('disabled') || item.getAttribute('aria-disabled') === 'true').toBe(true);
  });

  it('removes the selected element (and its field with it)', () => {
    const onSave = mount(vi.fn(), 'X');
    fireEvent.click(screen.getByText('Heading: Heading'));
    fireEvent.click(screen.getByLabelText('Remove'));
    fireEvent.click(screen.getByText('Save section'));
    expect(JSON.stringify(onSave.mock.calls[0][0].layout)).not.toContain('"key":"title"');
  });

  it('warns when saving changes a section that pages already use, and shows a server error', () => {
    render(<SectionDesigner value={{ name: 'X', description: '', layout: featureCards.layout }} usedOn={3} error="Name taken" onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/used on 3 pages/)).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Name taken');
  });
});

describe('SectionBuilderPage', () => {
  it('lists the seller\'s sections with where they are used', async () => {
    render(<MemoryRouter><SectionBuilderPage /></MemoryRouter>);
    expect(await screen.findByText('Banner')).toBeTruthy();
    expect(screen.getByText(/Used on 2 pages/)).toBeTruthy();
  });

  it('an empty store gets a helpful start', async () => {
    list.mockResolvedValue({ data: [] });
    render(<MemoryRouter><SectionBuilderPage /></MemoryRouter>);
    expect(await screen.findByText('No sections of your own yet')).toBeTruthy();
  });

  it('a load error can be retried', async () => {
    list.mockRejectedValueOnce(new Error('offline'));
    render(<MemoryRouter><SectionBuilderPage /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByText('Try again'));
    expect(await screen.findByText('Banner')).toBeTruthy();
  });

  it('New section: pick a starter, name it, save; the storefront cache is refreshed', async () => {
    create.mockResolvedValue({ data: { ...existing, _id: 'd2', name: 'Cards' } });
    render(<MemoryRouter><SectionBuilderPage /></MemoryRouter>);
    await screen.findByText('Banner');
    fireEvent.click(screen.getAllByText('New section')[0]);
    fireEvent.click(await screen.findByText('Feature cards'));
    fireEvent.change(await screen.findByLabelText('Section name'), { target: { value: 'Cards' } });
    fireEvent.click(screen.getByText('Save section'));
    await waitFor(() => expect(create).toHaveBeenCalled());
    const [storeId, input] = create.mock.calls[0];
    expect(storeId).toBe('S1');
    expect(input.name).toBe('Cards');
    expect(input.layout.t).toBe('stack');
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith('S1'));
    expect(toast.success).toHaveBeenCalled();
  });

  it('Edit saves to the same section', async () => {
    update.mockResolvedValue({ data: existing });
    render(<MemoryRouter><SectionBuilderPage /></MemoryRouter>);
    fireEvent.click(await screen.findByText('Edit'));
    fireEvent.change(await screen.findByLabelText('Section name'), { target: { value: 'Banner 2' } });
    fireEvent.click(screen.getByText('Save section'));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0][0]).toBe('S1');
    expect(update.mock.calls[0][1]).toBe('d1');
    expect(update.mock.calls[0][2].name).toBe('Banner 2');
  });

  it('shows the server\'s reason when saving fails and stays in the designer', async () => {
    create.mockRejectedValue(new Error('A section with this name already exists'));
    render(<MemoryRouter><SectionBuilderPage /></MemoryRouter>);
    await screen.findByText('Banner');
    fireEvent.click(screen.getAllByText('New section')[0]);
    fireEvent.click(await screen.findByText('Blank'));
    fireEvent.change(await screen.findByLabelText('Section name'), { target: { value: 'Banner' } });
    fireEvent.click(screen.getByText('Save section'));
    expect(await screen.findByText(/already exists/)).toBeTruthy();
    expect(screen.getByLabelText('Section name')).toBeTruthy();
  });

  it('Cancel asks before throwing changes away', async () => {
    render(<MemoryRouter><SectionBuilderPage /></MemoryRouter>);
    fireEvent.click(await screen.findByText('Edit'));
    await screen.findByLabelText('Section name');
    fireEvent.click(screen.getByText('Cancel'));
    expect(await screen.findByText('Leave without saving?')).toBeTruthy();
    fireEvent.click(screen.getByText('Leave'));
    expect(await screen.findByText('Banner')).toBeTruthy();
  });

  it('Delete confirms, deletes and refreshes; a section in use explains why it can not be deleted', async () => {
    remove.mockResolvedValueOnce({ success: true });
    render(<MemoryRouter><SectionBuilderPage /></MemoryRouter>);
    fireEvent.click(await screen.findByText('Delete'));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('S1', 'd1'));
    expect(invalidate).toHaveBeenCalled();

    remove.mockRejectedValueOnce(new Error('This section is used on 2 pages.'));
    fireEvent.click(await screen.findByText('Delete'));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('used on 2 pages')));
  });
});
