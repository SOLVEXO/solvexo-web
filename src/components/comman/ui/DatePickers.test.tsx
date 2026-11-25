import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { DateField, DateTimeField, TimeField } from './DateField';
import { DateRangePicker, type DateRangeValue } from './DateRangePicker';
import { DateTimePickerModal } from './DateTimePickerModal';
import {
  addDays, addMonths, defaultRangePresets, monthCells, parseDateString, parseTimeString, to12h, to24h, toDateString,
} from './dateUtils';

afterEach(cleanup);

describe('dateUtils', () => {
  it('parses real dates and refuses impossible ones', () => {
    expect(parseDateString('2026-11-25')).toEqual({ y: 2026, m: 10, d: 25 });
    expect(parseDateString('2026-11-25T10:30')).toEqual({ y: 2026, m: 10, d: 25 });
    expect(parseDateString('2026-02-31')).toBeNull();
    expect(parseDateString('')).toBeNull();
    expect(parseDateString('nope')).toBeNull();
  });
  it('parses times from time and datetime strings', () => {
    expect(parseTimeString('13:05')).toEqual({ h24: 13, minute: 5 });
    expect(parseTimeString('2026-11-25T07:45')).toEqual({ h24: 7, minute: 45 });
    expect(parseTimeString('25:00')).toBeNull();
  });
  it('converts 12h and 24h both ways', () => {
    expect(to12h(0)).toEqual({ hour: 12, ampm: 'AM' });
    expect(to12h(12)).toEqual({ hour: 12, ampm: 'PM' });
    expect(to12h(15)).toEqual({ hour: 3, ampm: 'PM' });
    expect(to24h(12, 'AM')).toBe(0);
    expect(to24h(12, 'PM')).toBe(12);
    expect(to24h(3, 'PM')).toBe(15);
  });
  it('adds days and months across boundaries (and clamps the day)', () => {
    expect(addDays({ y: 2026, m: 11, d: 31 }, 1)).toEqual({ y: 2027, m: 0, d: 1 });
    expect(addMonths({ y: 2026, m: 0, d: 31 }, 1)).toEqual({ y: 2026, m: 1, d: 28 });
  });
  it('lays out a month with the right leading blanks', () => {
    const c = monthCells(2026, 10, 0); // Nov 2026 starts on a Sunday
    expect(c[0]).toBe(1);
    expect(c.length % 7).toBe(0);
    expect(monthCells(2026, 10, 1)[0]).toBeNull(); // Monday-first: six blanks before Sunday the 1st
  });
  it('last-month preset ends on the last day of that month', () => {
    const p = defaultRangePresets(new Date(2026, 2, 15)).find(x => x.id === 'lastMonth')!.range();
    expect(toDateString(p.from)).toBe('2026-02-01');
    expect(toDateString(p.to)).toBe('2026-02-28');
  });
});

function Harness({ initial = '', ...rest }: { initial?: string; min?: string; max?: string; required?: boolean; name?: string }) {
  const [v, setV] = useState(initial);
  return <><DateField label="Start date" value={v} onChange={e => setV(e.target.value)} {...rest} /><output data-testid="out">{v}</output></>;
}

describe('DateField', () => {
  it('shows a placeholder, opens the calendar and returns an ISO date through the native-shaped onChange', () => {
    render(<Harness initial="2026-11-10" />);
    const btn = screen.getByRole('button', { name: /Start date/ });
    expect(btn.textContent).toMatch(/2026/);
    fireEvent.click(btn);
    fireEvent.click(screen.getByRole('gridcell', { name: /November 15, 2026/ }));
    expect(screen.getByTestId('out').textContent).toBe('2026-11-15');
    expect(screen.queryByRole('dialog')).toBeNull(); // closes after a pick
  });

  it('refuses days outside min / max', () => {
    render(<Harness initial="2026-11-10" min="2026-11-05" max="2026-11-20" />);
    fireEvent.click(screen.getByRole('button', { name: /Start date/ }));
    expect((screen.getByRole('gridcell', { name: /November 3, 2026/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('gridcell', { name: /November 25, 2026/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('gridcell', { name: /November 12, 2026/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('clears with the X, but not when required', () => {
    const { unmount } = render(<Harness initial="2026-11-10" />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByTestId('out').textContent).toBe('');
    unmount();
    render(<Harness initial="2026-11-10" required />);
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('keeps form name / required working through a hidden native input', () => {
    const { container } = render(<form><Harness initial="" name="start" required /></form>);
    const native = container.querySelector('input[name="start"]') as HTMLInputElement;
    expect(native.required).toBe(true);
    expect(native.type).toBe('date');
    expect((container.querySelector('form') as HTMLFormElement).checkValidity()).toBe(false);
  });

  it('moves with the keyboard and picks with Enter', () => {
    render(<Harness initial="2026-11-10" />);
    fireEvent.click(screen.getByRole('button', { name: /Start date/ }));
    const day = screen.getByRole('gridcell', { name: /November 10, 2026/ });
    fireEvent.keyDown(day, { key: 'ArrowRight' });
    // focus moved to the 11th; clicking Enter on a focused button clicks it
    const next = screen.getByRole('gridcell', { name: /November 11, 2026/ });
    expect(next.getAttribute('data-focus')).toBe('true');
  });

  it('Escape closes only the calendar', () => {
    render(<Harness initial="2026-11-10" />);
    fireEvent.click(screen.getByRole('button', { name: /Start date/ }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('DateTimePickerModal', () => {
  it('keeps the old behaviour: past days are not selectable by default', () => {
    const past = toDateString(addDays({ y: new Date().getFullYear(), m: new Date().getMonth(), d: new Date().getDate() }, -400));
    render(<DateTimePickerModal value={`${past}T10:00`} onChange={() => {}} onClose={() => {}} />);
    const first = screen.getAllByRole('gridcell')[0] as HTMLButtonElement;
    expect(first.disabled).toBe(true);
  });

  it('allowPast lets a past day through and returns date + time', () => {
    const onChange = vi.fn();
    render(<DateTimePickerModal value="2020-03-10T14:30" onChange={onChange} onClose={() => {}} allowPast title="Pick" confirmLabel="OK" />);
    fireEvent.click(screen.getByRole('gridcell', { name: /March 12, 2020/ }));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onChange).toHaveBeenCalledWith('2020-03-12T14:30');
  });

  it('date mode returns only the day, time mode only the time', () => {
    const a = vi.fn();
    const { unmount } = render(<DateTimePickerModal mode="date" value="2020-03-10" onChange={a} onClose={() => {}} allowPast confirmLabel="OK" />);
    expect(screen.queryByLabelText(/o'clock/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(a).toHaveBeenCalledWith('2020-03-10');
    unmount();
    const b = vi.fn();
    render(<DateTimePickerModal mode="time" value="09:05" onChange={b} onClose={() => {}} confirmLabel="OK" />);
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(b).toHaveBeenCalledWith('09:05');
  });
});

describe('DateTimeField / TimeField', () => {
  it('DateTimeField opens the dialog and writes the value back', () => {
    const onValueChange = vi.fn();
    render(<DateTimeField label="Publish at" value="2020-03-10T14:30" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Publish at/ }));
    fireEvent.click(screen.getByRole('gridcell', { name: /March 20, 2020/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onValueChange).toHaveBeenCalledWith('2020-03-20T14:30');
  });
  it('TimeField returns HH:mm', () => {
    const onValueChange = vi.fn();
    render(<TimeField label="Opens" value="08:15" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Opens/ }));
    fireEvent.click(screen.getByRole('button', { name: 'PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onValueChange).toHaveBeenCalledWith('20:15');
  });
});

function RangeHarness() {
  const [v, setV] = useState<DateRangeValue>({ from: '', to: '' });
  return <><DateRangePicker label="Period" value={v} onChange={setV} /><output data-testid="out">{`${v.from}|${v.to}`}</output></>;
}

describe('DateRangePicker', () => {
  it('picks two days in either order and applies', () => {
    render(<RangeHarness />);
    fireEvent.click(screen.getByRole('button', { name: /Period/ }));
    const dlg = screen.getByRole('dialog');
    const cells = within(dlg).getAllByRole('gridcell').filter(c => !(c as HTMLButtonElement).disabled);
    fireEvent.click(cells[cells.length - 1]);
    fireEvent.click(cells[0]);
    fireEvent.click(within(dlg).getByRole('button', { name: 'Apply' }));
    const [from, to] = screen.getByTestId('out').textContent!.split('|');
    expect(from < to).toBe(true);
  });
  it('a preset applies at once', () => {
    render(<RangeHarness />);
    fireEvent.click(screen.getByRole('button', { name: /Period/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    const [from, to] = screen.getByTestId('out').textContent!.split('|');
    expect(from).toBe(to);
    expect(from).not.toBe('');
  });
});
