import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ToastProvider } from '@/contexts/ToastContext';
import * as api from '@/api/services/dashboardLayout';
import { DashboardCanvas } from './DashboardCanvas';
import { CustomizeButton, CustomizeToolbar } from './CustomizeToolbar';
import { useDashboardLayout } from './useDashboardLayout';
import type { DashboardPreset, DashboardWidgetDef, LayoutWidget } from './dashboardTypes';

vi.mock('@/api/services/dashboardLayout', async (orig) => ({
  ...(await orig<typeof import('@/api/services/dashboardLayout')>()),
  apiGetDashboardLayout: vi.fn(),
  apiSaveDashboardLayout: vi.fn(),
  apiResetDashboardLayout: vi.fn(),
}));

const DEFS: DashboardWidgetDef[] = [
  { id: 'a', title: 'Alpha', description: 'first', category: 'One', sizes: ['small', 'medium'], defaultSize: 'small' },
  { id: 'b', title: 'Beta', description: 'second', category: 'One', sizes: ['small', 'medium'], defaultSize: 'small' },
  { id: 'c', title: 'Gamma', description: 'third', category: 'Two', sizes: ['medium'], defaultSize: 'medium',
    settings: [{ key: 'limit', label: 'Rows', options: [{ value: 3, label: '3 rows' }, { value: 5, label: '5 rows' }] }], defaultSettings: { limit: 5 } },
  { id: 'crit', title: 'Critical', description: 'always on', category: 'Two', sizes: ['small'], defaultSize: 'small', locked: true },
];
const DEFAULT: LayoutWidget[] = [
  { id: 'a', visible: true, size: 'small', settings: {} },
  { id: 'b', visible: true, size: 'small', settings: {} },
  { id: 'c', visible: true, size: 'medium', settings: { limit: 5 } },
];
const PRESETS: DashboardPreset[] = [{ id: 'mini', label: 'Mini', description: 'Only Beta.', widgets: ['b'] }];
const SCOPE = { kind: 'admin' as const };

function Harness() {
  const layout = useDashboardLayout({ scope: SCOPE, defs: DEFS, defaultWidgets: DEFAULT });
  if (layout.loading) return <p>loading</p>;
  return (
    <div>
      {layout.editing ? <CustomizeToolbar layout={layout} defs={DEFS} presets={PRESETS} /> : <CustomizeButton layout={layout} />}
      <DashboardCanvas defs={DEFS} layout={layout} renderWidget={(d, w) => <p>{`content-${d.id}-${JSON.stringify(w.settings)}`}</p>} />
    </div>
  );
}
const wrap = (ui: ReactNode) => render(<ToastProvider>{ui}</ToastProvider>);
const order = () => screen.getAllByText(/^content-/).map(n => n.textContent!.split('-')[1]);

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.apiGetDashboardLayout).mockResolvedValue({ success: true, data: { layout: null } });
  vi.mocked(api.apiSaveDashboardLayout).mockImplementation(async (_s, layout) => ({ success: true, data: { layout } }));
  vi.mocked(api.apiResetDashboardLayout).mockResolvedValue({ success: true, data: { layout: null } });
});

describe('dashboard customize mode', () => {
  it('shows the default layout without any editing controls', async () => {
    wrap(<Harness />);
    await screen.findByRole('button', { name: 'Customize dashboard' });
    expect(order()).toEqual(['crit', 'a', 'b', 'c']); // the locked widget is always added, first
    expect(screen.queryByLabelText(/Hide Alpha/)).toBeNull();
    expect(screen.queryByText('Save layout')).toBeNull();
  });

  it('hides, reorders, removes, flags unsaved changes, and Cancel restores the saved layout', async () => {
    wrap(<Harness />);
    fireEvent.click(await screen.findByRole('button', { name: 'Customize dashboard' }));
    expect(screen.getByText('Save layout')).toHaveProperty('disabled', true); // nothing changed yet

    fireEvent.click(screen.getByLabelText('Move Alpha later'));
    expect(order().slice(1, 3)).toEqual(['b', 'a']);
    expect(screen.getByText('Unsaved changes')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Hide Beta'));
    fireEvent.click(screen.getByLabelText('Remove Gamma from the dashboard'));
    expect(screen.queryByText(/content-c-/)).toBeNull();
    expect(screen.queryByLabelText('Hide Critical')).toBeNull(); // locked: no hide / remove controls

    fireEvent.click(screen.getByText('Cancel'));
    expect(order()).toEqual(['crit', 'a', 'b', 'c']);
    expect(api.apiSaveDashboardLayout).not.toHaveBeenCalled();
  });

  it('changes size and settings, and Save sends exactly the edited layout', async () => {
    wrap(<Harness />);
    fireEvent.click(await screen.findByRole('button', { name: 'Customize dashboard' }));
    fireEvent.change(screen.getByLabelText('Size of Alpha'), { target: { value: 'medium' } });
    fireEvent.click(screen.getByLabelText('Settings for Gamma'));
    fireEvent.change(screen.getByLabelText('Rows'), { target: { value: '3' } });
    fireEvent.click(screen.getByLabelText('Hide Beta'));
    fireEvent.click(screen.getByText('Save layout'));
    await waitFor(() => expect(api.apiSaveDashboardLayout).toHaveBeenCalledTimes(1));
    const sent = vi.mocked(api.apiSaveDashboardLayout).mock.calls[0][1];
    expect(sent.widgets.find(w => w.id === 'a')?.size).toBe('medium');
    expect(sent.widgets.find(w => w.id === 'b')?.visible).toBe(false);
    expect(sent.widgets.find(w => w.id === 'c')?.settings).toEqual({ limit: 3 });
    await screen.findByRole('button', { name: 'Customize dashboard' }); // back to normal mode
    expect(screen.queryByText('Save layout')).toBeNull();
    expect(screen.queryByText(/content-b-/)).toBeNull(); // hidden widgets are not rendered in normal mode
  });

  it('adds a removed widget back from the searchable library', async () => {
    wrap(<Harness />);
    fireEvent.click(await screen.findByRole('button', { name: 'Customize dashboard' }));
    fireEvent.click(screen.getByLabelText('Remove Alpha from the dashboard'));
    expect(screen.queryByText(/content-a-/)).toBeNull();
    fireEvent.click(screen.getByText('Add widget'));
    const library = within(screen.getByRole('dialog'));
    fireEvent.change(library.getByPlaceholderText('Search widgets…'), { target: { value: 'alph' } });
    expect(library.queryByText('Beta')).toBeNull();
    fireEvent.click(library.getByText('Add'));
    expect(screen.getByText(/content-a-/)).toBeTruthy();
  });

  it('a preset replaces the working copy only, and the locked widget stays', async () => {
    wrap(<Harness />);
    fireEvent.click(await screen.findByRole('button', { name: 'Customize dashboard' }));
    fireEvent.change(screen.getByLabelText('Layout preset'), { target: { value: 'mini' } });
    expect(order()).toEqual(['crit', 'b']);
    expect(api.apiSaveDashboardLayout).not.toHaveBeenCalled();
  });

  it('keeps editing and shows the error when saving fails', async () => {
    vi.mocked(api.apiSaveDashboardLayout).mockRejectedValue(new Error('boom'));
    wrap(<Harness />);
    fireEvent.click(await screen.findByRole('button', { name: 'Customize dashboard' }));
    fireEvent.click(screen.getByLabelText('Hide Beta'));
    fireEvent.click(screen.getByText('Save layout'));
    expect(await screen.findByText('boom')).toBeTruthy();
    expect(screen.getByText('Save layout')).toBeTruthy();
  });

  it('Reset asks first, then deletes the saved layout', async () => {
    wrap(<Harness />);
    fireEvent.click(await screen.findByRole('button', { name: 'Customize dashboard' }));
    fireEvent.click(screen.getByText('Reset'));
    expect(api.apiResetDashboardLayout).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Reset to default'));
    await waitFor(() => expect(api.apiResetDashboardLayout).toHaveBeenCalledTimes(1));
  });

  it('uses the saved layout, dropping widgets the person may not see', async () => {
    vi.mocked(api.apiGetDashboardLayout).mockResolvedValue({ success: true, data: { layout: { preset: null, columns: 3, widgets: [{ id: 'c', visible: true, size: 'medium', settings: { limit: 3 } }, { id: 'a', visible: false, size: 'small', settings: {} }] } } });
    wrap(<Harness />);
    await screen.findByRole('button', { name: 'Customize dashboard' });
    expect(order()).toEqual(['crit', 'c']);
  });
});
