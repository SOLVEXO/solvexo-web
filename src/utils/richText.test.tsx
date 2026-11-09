import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { RichContent } from './richText';
import { cleanPastedHtml } from '@/features/seller/store/Dashboard/StoreSection/products/ProductContentFields';

describe('RichContent', () => {
  it('draws editor HTML: paragraphs, headings, lists and links', () => {
    const { container } = render(<RichContent text={'<h2>Our story</h2><p>First.</p><p>Second <strong>bold</strong> <a href="https://a.com">link</a></p><ul><li>One</li></ul>'} />);
    expect(container.querySelectorAll('p')).toHaveLength(2);
    expect(container.querySelector('h2')?.textContent).toBe('Our story');
    expect(container.querySelector('li')?.textContent).toBe('One');
    expect(container.querySelector('a')?.getAttribute('href')).toBe('https://a.com');
  });

  it('removes scripts, event handlers and javascript: links', () => {
    const { container } = render(<RichContent text={'<p onclick="x()">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a><img src=x onerror=alert(1)>'} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.innerHTML).not.toMatch(/onclick|onerror|javascript:/i);
  });

  it('older plain text: blank line = new paragraph, single new line = line break', () => {
    const { container } = render(<RichContent text={'Line one\nLine two\n\nSecond paragraph with **bold**'} />);
    const ps = container.querySelectorAll('p');
    expect(ps).toHaveLength(2);
    expect(ps[0].querySelectorAll('br')).toHaveLength(1);
    expect(ps[1].querySelector('strong')?.textContent).toBe('bold');
  });

  it('draws nothing for empty text', () => {
    expect(render(<RichContent text="  " />).container.innerHTML).toBe('');
  });
});

describe('cleanPastedHtml', () => {
  it('keeps structure, drops colours/fonts/scripts and unsafe links', () => {
    const out = cleanPastedHtml('<div style="color:red"><h1 class="x">Title</h1><p><span style="font-size:30px">Hello <b>there</b></span></p><script>bad()</script><a href="javascript:alert(1)">x</a><a href="https://ok.com">ok</a></div>');
    expect(out).toContain('<h2>Title</h2>');
    expect(out).toContain('<p>Hello <strong>there</strong></p>');
    expect(out).not.toMatch(/style=|script|javascript:/i);
    expect(out).toContain('<a href="https://ok.com"');
  });
});
