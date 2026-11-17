import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Input } from './Input';

// jsdom has no layout, so give the prefix a width that depends on its text (8px per character), like a real font would.
beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const w = (this.textContent ?? '').length * 8;
    return { width: w, height: 16, top: 0, left: 0, right: w, bottom: 16, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const padStart = (el: HTMLElement) => parseInt(el.style.paddingInlineStart, 10);

describe('Input prefix (leftAddon)', () => {
  it('pushes the typed text past the prefix, however wide it is', () => {
    const { rerender } = render(<Input aria-label="v" leftAddon="Rs" />);
    const narrow = padStart(screen.getByLabelText('v'));
    expect(narrow).toBe(12 + 16 + 8); // inset + "Rs" width + gap — NOT the old fixed 24px that "Rs" overlapped
    rerender(<Input aria-label="v" leftAddon="PKR" />);
    expect(padStart(screen.getByLabelText('v'))).toBeGreaterThan(narrow);
    rerender(<Input aria-label="v" leftAddon="د.إ" />);
    expect(padStart(screen.getByLabelText('v'))).toBe(12 + 3 * 8 + 8);
  });

  it('puts the prefix on the START side so right-to-left languages mirror it', () => {
    render(<Input aria-label="v" leftAddon="Rs" />);
    const prefix = screen.getByText('Rs');
    expect(prefix.className).toContain('start-3');
    expect(prefix.className).not.toContain('left-3');
    expect(prefix.className).toContain('whitespace-nowrap');
  });

  it('leaves a plain input alone and still honours a caller style', () => {
    const { rerender } = render(<Input aria-label="v" />);
    expect(screen.getByLabelText('v').style.paddingInlineStart).toBe('');
    rerender(<Input aria-label="v" leftAddon="$" style={{ color: 'red' }} />);
    const el = screen.getByLabelText('v');
    expect(el.style.color).toBe('red');
    expect(padStart(el)).toBeGreaterThan(0);
  });

  it('icons and the password-style right icon use logical sides too', () => {
    render(<Input aria-label="v" leftIcon={<i data-testid="l" />} rightIcon={<i data-testid="r" />} />);
    expect(screen.getByTestId('l').parentElement!.className).toContain('start-3.5');
    expect(screen.getByTestId('r').parentElement!.className).toContain('end-3');
    expect(screen.getByLabelText('v').className).toContain('ps-11');
    expect(screen.getByLabelText('v').className).toContain('pe-9');
  });
});
