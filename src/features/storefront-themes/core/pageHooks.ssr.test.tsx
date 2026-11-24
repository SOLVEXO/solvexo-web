import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { dropSsr, putSsr } from '@/utils/ssrData';
import { useLoad } from './pageHooks';

function Probe({ load, ssrKey }: { load: () => Promise<string>; ssrKey?: string }) {
  const { data, loading } = useLoad(load, [ssrKey ?? 'k'], ssrKey);
  return <div data-testid="out">{loading ? 'loading' : data}</div>;
}

describe('useLoad with server-rendered data', () => {
  afterEach(() => { cleanup(); dropSsr(); });

  it('without a seed it starts loading and then shows the loaded value', async () => {
    const load = vi.fn(() => Promise.resolve('fresh'));
    render(<Probe load={load} ssrKey="p:1" />);
    expect(screen.getByTestId('out').textContent).toBe('loading');
    await waitFor(() => expect(screen.getByTestId('out').textContent).toBe('fresh'));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('with a seed the very first render has the data and no request is made', async () => {
    putSsr('p:2', 'from-server');
    const load = vi.fn(() => Promise.resolve('fresh'));
    render(<Probe load={load} ssrKey="p:2" />);
    expect(screen.getByTestId('out').textContent).toBe('from-server');
    await new Promise(r => setTimeout(r, 20));
    expect(load).not.toHaveBeenCalled();
    expect(screen.getByTestId('out').textContent).toBe('from-server');
  });

  it('uses a seed only once: the next mount loads again', async () => {
    putSsr('p:3', 'from-server');
    const load = vi.fn(() => Promise.resolve('fresh'));
    const first = render(<Probe load={load} ssrKey="p:3" />);
    await new Promise(r => setTimeout(r, 20));
    first.unmount();
    render(<Probe load={load} ssrKey="p:3" />);
    await waitFor(() => expect(screen.getByTestId('out').textContent).toBe('fresh'));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('a null seed means "nothing there" and is shown as such, not as loading', () => {
    putSsr('p:4', null);
    const load = vi.fn(() => Promise.resolve('fresh'));
    render(<Probe load={load} ssrKey="p:4" />);
    expect(screen.getByTestId('out').textContent).toBe('');
  });
});
