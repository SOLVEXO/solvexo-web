import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/layouts/StoreLayout', () => ({
  useStoreWorkspace: () => ({ storeId: 'S1' }),
  StorePageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => <div><h1>{title}</h1>{actions}</div>,
}));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock('@/api/services/storeSectionDefs', () => ({
  apiListStoreSectionDefs: () => Promise.resolve({ data: [] }),
  apiCreateStoreSectionDef: vi.fn(), apiDeleteStoreSectionDef: vi.fn(), apiUpdateStoreSectionDef: vi.fn(),
  apiListPublicStoreSectionDefs: () => Promise.resolve({ data: [] }),
}));

import { SectionBuilderPage, safeReturnPath } from './SectionBuilderPage';

afterEach(cleanup);

function Where() { const l = useLocation(); return <p data-testid="where">{l.pathname}{l.search}</p>; }
const open = (url: string) => render(
  <MemoryRouter initialEntries={[url]}>
    <Routes>
      <Route path="/store/:storeId/online-store/section-builder" element={<SectionBuilderPage />} />
      <Route path="*" element={<Where />} />
    </Routes>
  </MemoryRouter>,
);

describe('safeReturnPath', () => {
  it('accepts a page of this dashboard only', () => {
    expect(safeReturnPath('/store/S1/online-store/themes/x/customize?page=home')).toBe('/store/S1/online-store/themes/x/customize?page=home');
    for (const bad of [null, '', 'https://evil.example/store/x', '//evil.example/store/x', '/store/../admin', '/other/path', '/store/S1\\evil','javascript:alert(1)', `/store/${'a'.repeat(400)}`]) {
      expect(safeReturnPath(bad as string | null), String(bad)).toBeNull();
    }
  });
});

describe('Section builder opened from the editor', () => {
  it('opened with ?new=1 it goes straight to "Start from" (no extra click)', async () => {
    open('/store/S1/online-store/section-builder?new=1');
    expect(await screen.findByText('Start from')).toBeTruthy();
  });

  it('opened normally it shows the list first', async () => {
    open('/store/S1/online-store/section-builder');
    expect(await screen.findByText('No sections of your own yet')).toBeTruthy();
    expect(screen.queryByText('Start from')).toBeNull();
  });

  it('"Back to editor" returns to the editor it came from', async () => {
    open(`/store/S1/online-store/section-builder?return=${encodeURIComponent('/store/S1/online-store/themes/t1/customize')}`);
    fireEvent.click(await screen.findByRole('button', { name: /Back to editor/ }));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/store/S1/online-store/themes/t1/customize'));
  });

  it('no "Back to editor" without a return path, or with an address of another site', async () => {
    open('/store/S1/online-store/section-builder');
    await screen.findByText('No sections of your own yet');
    expect(screen.queryByRole('button', { name: /Back to editor/ })).toBeNull();
    cleanup();
    open(`/store/S1/online-store/section-builder?return=${encodeURIComponent('https://evil.example/x')}`);
    await screen.findByText('No sections of your own yet');
    expect(screen.queryByRole('button', { name: /Back to editor/ })).toBeNull();
  });
});
