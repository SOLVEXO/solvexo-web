import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { ColorField } from './ColorField';
import { contrastRatio, hexToHsv, hsvToHex, normalizeHex, rememberColor, readRecentColors } from './colorUtils';

beforeEach(() => { try { localStorage.clear(); } catch { /* ignore */ } });
afterEach(cleanup);

describe('colorUtils', () => {
  it('normalises hex in every common shape', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc');
    expect(normalizeHex('d97757')).toBe('#d97757');
    expect(normalizeHex(' #D97757 ')).toBe('#d97757');
    expect(normalizeHex('#12')).toBeNull();
    expect(normalizeHex('zzzzzz')).toBeNull();
    expect(normalizeHex('')).toBeNull();
  });
  it('round-trips hex through hsv', () => {
    for (const c of ['#d97757', '#000000', '#ffffff', '#2563eb', '#16a34a']) expect(hsvToHex(hexToHsv(c))).toBe(c);
  });
  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 1);
  });
  it('remembers recent colours, newest first, no duplicates', () => {
    rememberColor('#111111'); rememberColor('#222222'); rememberColor('#111111');
    expect(readRecentColors()).toEqual(['#111111', '#222222']);
  });
});

function Harness({ initial = '#d97757', ...rest }: { initial?: string; allowEmpty?: boolean; contrastAgainst?: string; swatches?: string[] }) {
  const [v, setV] = useState(initial);
  return <><ColorField label="Button colour" value={v} onChange={e => setV(e.target.value)} {...rest} /><output data-testid="out">{v}</output></>;
}

describe('ColorField', () => {
  it('accepts a typed hex (with or without #, short form) on blur', () => {
    render(<Harness />);
    const box = screen.getByLabelText('Button colour') as HTMLInputElement;
    fireEvent.change(box, { target: { value: '2563EB' } });
    fireEvent.blur(box);
    expect(screen.getByTestId('out').textContent).toBe('#2563eb');
    fireEvent.change(box, { target: { value: '#f0a' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(screen.getByTestId('out').textContent).toBe('#ff00aa');
  });

  it('refuses a bad value and says so, keeping the old colour', () => {
    render(<Harness />);
    const box = screen.getByLabelText('Button colour') as HTMLInputElement;
    fireEvent.change(box, { target: { value: 'banana' } });
    fireEvent.blur(box);
    expect(screen.getByRole('alert').textContent).toMatch(/#D97757/);
    expect(screen.getByTestId('out').textContent).toBe('#d97757');
  });

  it('picks from the store brand colours first, and remembers it', () => {
    render(<Harness swatches={['#123456']} />);
    fireEvent.click(screen.getByRole('button', { name: /pick a colour/i }));
    fireEvent.click(screen.getByRole('button', { name: '#123456' }));
    expect(screen.getByTestId('out').textContent).toBe('#123456');
    expect(readRecentColors()[0]).toBe('#123456');
  });

  it('can be emptied when allowEmpty is on', () => {
    render(<Harness allowEmpty />);
    fireEvent.click(screen.getByRole('button', { name: /reset to automatic/i }));
    expect(screen.getByTestId('out').textContent).toBe('');
  });

  it('warns about unreadable contrast', () => {
    render(<Harness initial="#fafafa" contrastAgainst="#ffffff" />);
    expect(screen.getByText(/Hard to read/)).toBeTruthy();
  });

  it('keeps the shade area reachable by keyboard', () => {
    render(<Harness initial="#ff0000" />);
    fireEvent.click(screen.getByRole('button', { name: /pick a colour/i }));
    const area = screen.getByRole('slider', { name: /Shade/ });
    fireEvent.keyDown(area, { key: 'ArrowLeft' });
    expect(screen.getByTestId('out').textContent).not.toBe('#ff0000');
  });
});
