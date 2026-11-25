import { fireEvent, screen, within } from '@testing-library/react';

/*
 * Test helpers for the shared dropdown (`Select`, `MultiSelect`, `FilterDropdown`).
 * It is not a native <select> any more, so tests open it and click an option instead of `fireEvent.change` /
 * `getByDisplayValue` / `.options`.
 */

/** The dropdown trigger (role "combobox"), found by its accessible name (label / aria-label) or, failing that, by the text it currently shows. */
export function dropdown(nameOrShownText: string | RegExp, scope: HTMLElement = document.body): HTMLElement {
  const all = within(scope).getAllByRole('combobox');
  const byName = all.filter(el => {
    const name = el.getAttribute('aria-label') ?? '';
    const labelledBy = el.getAttribute('aria-labelledby');
    const labelText = labelledBy ? (document.getElementById(labelledBy)?.textContent ?? '') : '';
    const id = el.getAttribute('id');
    const forLabel = id ? (document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent ?? '') : '';
    return [name, labelText, forLabel].some(t => (typeof nameOrShownText === 'string' ? t === nameOrShownText : nameOrShownText.test(t)));
  });
  if (byName.length === 1) return byName[0];
  const byText = all.filter(el => (typeof nameOrShownText === 'string' ? (el.textContent ?? '').trim() === nameOrShownText : nameOrShownText.test(el.textContent ?? '')));
  if (byText.length === 1) return byText[0];
  throw new Error(`Expected exactly one dropdown matching ${String(nameOrShownText)}, found ${byName.length || byText.length}`);
}

/** What the dropdown shows right now (the old `toHaveValue` / `getByDisplayValue`). */
export function shownText(trigger: HTMLElement): string {
  return (trigger.textContent ?? '').trim();
}

/** Opens the dropdown and returns its options as `{ value, label, disabled }` (the old `select.options`), then closes it again. */
export function optionsOf(trigger: HTMLElement): { value: string; label: string; disabled: boolean }[] {
  const wasOpen = trigger.getAttribute('aria-expanded') === 'true';
  if (!wasOpen) fireEvent.click(trigger);
  const list = screen.getAllByRole('option').map(o => ({
    value: o.getAttribute('data-value') ?? '',
    label: (o.textContent ?? '').trim(),
    disabled: o.getAttribute('aria-disabled') === 'true',
  }));
  if (!wasOpen) fireEvent.keyDown(window, { key: 'Escape' });
  return list;
}

/** Opens the dropdown and picks the option with this value (the old `fireEvent.change(select, { target: { value } })`). */
export function chooseValue(trigger: HTMLElement, value: string) {
  if (trigger.getAttribute('aria-expanded') !== 'true') fireEvent.click(trigger);
  const option = screen.getAllByRole('option').find(o => o.getAttribute('data-value') === value);
  if (!option) throw new Error(`No option with value "${value}" in the open dropdown`);
  fireEvent.click(option);
}

/** Same, by the option's visible text. */
export function chooseLabel(trigger: HTMLElement, label: string | RegExp) {
  if (trigger.getAttribute('aria-expanded') !== 'true') fireEvent.click(trigger);
  fireEvent.click(screen.getByRole('option', { name: label }));
}
