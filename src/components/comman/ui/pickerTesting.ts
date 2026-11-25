import { fireEvent, screen } from '@testing-library/react';

/*
 * Test helpers for the shared date / time / colour pickers (`DateField`, `DateTimeField`, `TimeField`, `ColorField`).
 * They are not native inputs any more, so tests open the picker and click instead of `fireEvent.change(input)`.
 */

/** Types a colour into a ColorField's hex box and commits it (blur), like a person would. */
export function typeColor(hexBox: HTMLElement, value: string) {
  fireEvent.change(hexBox, { target: { value } });
  fireEvent.blur(hexBox);
}

/** Opens a compact ColorField (swatch only) and commits a colour through its panel's hex box. */
export function chooseColor(swatchButton: HTMLElement, value: string) {
  fireEvent.click(swatchButton);
  const box = screen.getByLabelText('Hex colour');
  fireEvent.change(box, { target: { value } });
  fireEvent.keyDown(box, { key: 'Enter' });
  fireEvent.keyDown(window, { key: 'Escape' });
}

function shownMonthStart(): Date {
  const label = screen.getByRole('grid').getAttribute('aria-label') ?? '';
  return new Date(`1 ${label}`);
}

function goToMonth(y: number, m: number) {
  for (let i = 0; i < 60; i++) {
    const shown = shownMonthStart();
    const diff = (y - shown.getFullYear()) * 12 + (m - shown.getMonth());
    if (diff === 0) return;
    fireEvent.click(screen.getByRole('button', { name: diff > 0 ? 'Next month' : 'Previous month' }));
  }
  throw new Error('calendar did not reach the wanted month');
}

/** Opens a DateField and picks "YYYY-MM-DD". */
export function chooseDate(trigger: HTMLElement, ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  fireEvent.click(trigger);
  goToMonth(y, m - 1);
  fireEvent.click(document.querySelector(`[data-day="${y}-${m}-${d}"]`) as HTMLElement);
}

/** Opens a DateTimeField and picks "YYYY-MM-DDTHH:mm" (minutes must be a multiple of 5), then confirms. */
export function chooseDateTime(trigger: HTMLElement, iso: string, confirmName: string | RegExp = 'Confirm') {
  const [date, time] = iso.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [h24, minute] = time.split(':').map(Number);
  fireEvent.click(trigger);
  goToMonth(y, m - 1);
  fireEvent.click(document.querySelector(`[data-day="${y}-${m}-${d}"]`) as HTMLElement);
  const hour = h24 % 12 || 12;
  fireEvent.click(screen.getByLabelText(`${hour} o'clock`));
  fireEvent.click(screen.getByLabelText(`${minute} minutes`));
  fireEvent.click(screen.getByRole('button', { name: h24 >= 12 ? /^PM$/ : /^AM$/ }));
  fireEvent.click(screen.getByRole('button', { name: confirmName }));
}
