import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProductRichEditor, ProductTabsEditor, toEditorHtml, type ProductTabInput } from './ProductContentFields';
import { healEntities } from '@/utils/healEntities';

afterEach(cleanup);

function Harness({ initial = '', seen }: { initial?: string; seen: string[] }) {
  const [v, setV] = useState(initial);
  return <ProductRichEditor label="Body" value={v} onChange={h => { seen.push(h); setV(h); }} />;
}
const field = () => screen.getByRole('textbox', { name: 'Body' });
/** What typing does in a browser: the field's own HTML changes, then an input event fires. */
const type = (el: HTMLElement, html: string) => { el.innerHTML = html; fireEvent.input(el); };

describe('rich text editor: typing', () => {
  it('a typed space (the browser writes &nbsp;) is NOT escaped again into &amp;nbsp;', () => {
    const seen: string[] = [];
    render(<Harness seen={seen} />);
    type(field(), 'Somthing&nbsp;');
    expect(field().innerHTML).toBe('Somthing&nbsp;');
    type(field(), 'Somthing&nbsp;more&nbsp;');
    type(field(), 'Somthing&nbsp;more&nbsp;text');
    expect(field().innerHTML).toBe('Somthing&nbsp;more&nbsp;text');
    expect(seen.every(h => !h.includes('&amp;'))).toBe(true);
  });

  it('keeps what was typed through many keystrokes without growing (&amp;amp;amp;…)', () => {
    const seen: string[] = [];
    render(<Harness seen={seen} />);
    let html = '';
    for (const word of ['ngo', ' ', 'si', ' ', 'This', ' ']) { html += word === ' ' ? '&nbsp;' : word; type(field(), html); }
    expect(field().innerHTML).toBe('ngo&nbsp;si&nbsp;This&nbsp;');
    expect(seen[seen.length - 1]).toBe('ngo&nbsp;si&nbsp;This&nbsp;');
  });

  it('text pasted or typed with tags still works', () => {
    const seen: string[] = [];
    render(<Harness seen={seen} />);
    type(field(), '<p>Hello <strong>world</strong></p>');
    expect(field().innerHTML).toBe('<p>Hello <strong>world</strong></p>');
  });
});

describe('rich text editor: loading saved text', () => {
  it('heals text that an older version escaped again and again', () => {
    render(<Harness initial="Somthing&amp;nbsp;&amp;amp;nbsp;&amp;amp;amp;amp;nbsp;" seen={[]} />);
    expect(field().textContent).toBe('Somthing   ');
    expect(field().innerHTML).not.toContain('&amp;');
  });

  it('plain old text keeps its ampersands and line breaks', () => {
    render(<Harness initial={'Tom & Jerry\nsecond line'} seen={[]} />);
    expect(field().textContent).toBe('Tom & Jerrysecond line');
    expect(field().innerHTML).toContain('<br>');
    expect(toEditorHtml('a < b')).toBe('a &lt; b');
  });

  it('a value that arrives from outside replaces the field (switching to another tab/product)', () => {
    const { rerender } = render(<ProductRichEditor label="Body" value="<p>One</p>" onChange={() => undefined} />);
    expect(field().innerHTML).toBe('<p>One</p>');
    rerender(<ProductRichEditor label="Body" value="<p>Two</p>" onChange={() => undefined} />);
    expect(field().innerHTML).toBe('<p>Two</p>');
  });
});

describe('Add tab', () => {
  function Tabs({ seen }: { seen: ProductTabInput[][] }) {
    const [tabs, setTabs] = useState<ProductTabInput[]>([]);
    return <ProductTabsEditor tabs={tabs} onChange={t => { seen.push(t); setTabs(t); }} />;
  }
  it('adds a tab and keeps the content typed into it, spaces included', () => {
    const seen: ProductTabInput[][] = [];
    render(<Tabs seen={seen} />);
    fireEvent.click(screen.getByRole('button', { name: /Add tab/ }));
    fireEvent.change(screen.getByLabelText('Tab 1 title'), { target: { value: 'Features' } });
    const body = screen.getByRole('textbox', { name: 'Tab 1 content' });
    type(body, 'Fast&nbsp;');
    type(body, 'Fast&nbsp;and&nbsp;quiet');
    expect(body.innerHTML).toBe('Fast&nbsp;and&nbsp;quiet');
    expect(seen[seen.length - 1]).toEqual([{ title: 'Features', content: 'Fast&nbsp;and&nbsp;quiet' }]);
  });
});

describe('healEntities', () => {
  it('repairs repeated escaping and leaves healthy text alone', () => {
    expect(healEntities('a&amp;nbsp;')).toBe('a&nbsp;');
    expect(healEntities('a&amp;amp;amp;nbsp;b')).toBe('a&nbsp;b');
    expect(healEntities('x&amp;amp;amp;')).toBe('x&amp;');
    expect(healEntities('Tom &amp; Jerry')).toBe('Tom &amp; Jerry');
    expect(healEntities('<p>a&nbsp;b</p>')).toBe('<p>a&nbsp;b</p>');
    expect(healEntities('')).toBe('');
  });
});
