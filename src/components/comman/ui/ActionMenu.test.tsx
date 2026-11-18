import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ActionMenu } from './ActionMenu';

const items = ['View Detail', 'Edit Product', 'Duplicate', 'Archive', 'Delete'].map(label => ({ label, onClick: () => undefined }));

/** jsdom has no layout, so the button and the table card around it are given fixed boxes. */
function place(button: { top: number; bottom: number }, card: { top: number; bottom: number }, viewportH: number) {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: viewportH });
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1366 });
  const box = (t: number, b: number) => ({ top: t, bottom: b, left: 1270, right: 1303, width: 33, height: b - t, x: 1270, y: t, toJSON: () => ({}) }) as DOMRect;
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    if (this.getAttribute('aria-haspopup') === 'menu' || this.id.includes('trigger') || this.tagName === 'BUTTON') return box(button.top, button.bottom);
    if (this.dataset.card) return box(card.top, card.bottom);
    return box(0, 0);
  };
}

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
});
afterEach(cleanup);

const open = () => {
  render(<div data-card="1" style={{ overflow: 'hidden' }}><ActionMenu items={items} ariaLabel="Row actions" /></div>);
  fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
  return screen.getByRole('menu');
};

describe('ActionMenu placement', () => {
  it('opens UPWARD for the last row of a table near the bottom of the screen (nothing is cut off)', () => {
    // button at y 500-525 on a 612px screen, table card ends right below the row, 5 items need ~228px
    place({ top: 500, bottom: 525 }, { top: 300, bottom: 545 }, 612);
    const menu = open();
    expect(menu.style.bottom).not.toBe('');
    expect(menu.style.top).toBe('');
    expect(parseInt(menu.style.bottom)).toBe(612 - 500 + 4);
  });

  it('opens downward when there is room under the button', () => {
    place({ top: 100, bottom: 125 }, { top: 60, bottom: 590 }, 612);
    const menu = open();
    expect(menu.style.top).not.toBe('');
    expect(menu.style.bottom).toBe('');
  });

  it('when neither side fits, it takes the side with more screen room and scrolls inside, never off the screen', () => {
    place({ top: 120, bottom: 145 }, { top: 60, bottom: 200 }, 260); // 5 items cannot fit above (112px) or below (107px)
    const menu = open();
    const room = parseInt(menu.style.maxHeight);
    expect(room).toBeLessThanOrEqual(260);
    expect(room).toBeGreaterThanOrEqual(100);
    expect(menu.style.top === '' ? parseInt(menu.style.bottom) : parseInt(menu.style.top)).toBeGreaterThan(0);
  });

  it('opens upward when the short table card, not the screen, is what ends below the button', () => {
    // plenty of screen below, but the card (and so the visible table) ends right under the row
    place({ top: 400, bottom: 425 }, { top: 150, bottom: 440 }, 900);
    const menu = open();
    expect(menu.style.bottom).not.toBe('');
  });
});
