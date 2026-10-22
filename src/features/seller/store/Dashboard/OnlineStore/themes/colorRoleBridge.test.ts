import { describe, expect, it, vi } from 'vitest';
import { COLOR_KEY_ROLE, ROLE_PRIMARY_KEY, pickColorRole, roleFromElement, setHoveredColorRole, subscribeHoveredColorRole, subscribePickedColorRole } from './colorRoleBridge';

function dom(html: string) {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

describe('roleFromElement (click on the live preview → which colour does this part use?)', () => {
  const host = dom(`
    <header id="hdr"><a id="logo" href="#">Logo</a></header>
    <main>
      <h2 id="h">Heading</h2>
      <p id="plain">Body text</p>
      <article data-fx-card id="card">
        <h3 id="name">Shirt</h3>
        <span data-color-role="price" id="price">$20</span>
        <span data-color-role="sale" id="sale">-20%</span>
        <button id="add" class="fx-pill">Add to cart</button>
        <a id="link" href="#">View</a>
      </article>
      <div class="product-price" id="classPrice">$9</div>
      <a class="fx-cta" href="#" id="cta"><span id="ctaText">Shop now</span></a>
    </main>
    <footer id="ftr"><p id="fp">© store</p></footer>`);
  const el = (id: string) => host.querySelector('#' + id);

  it('a price inside a card is "price", not "card"', () => expect(roleFromElement(el('price'))).toBe('price'));
  it('a sale badge inside a card is "sale"', () => expect(roleFromElement(el('sale'))).toBe('sale'));
  it('a button inside a card is "button", not "card"', () => expect(roleFromElement(el('add'))).toBe('button'));
  it('a hero call-to-action link styled as a button (real Maison markup: <a class="fx-cta">) is "button", not "link"', () => {
    expect(roleFromElement(el('cta'))).toBe('button');
    expect(roleFromElement(el('ctaText'))).toBe('button');
  });
  it('a heading inside a card is "heading"', () => expect(roleFromElement(el('name'))).toBe('heading'));
  it('a link inside a card is "link"', () => expect(roleFromElement(el('link'))).toBe('link'));
  it('empty card area is "card"', () => expect(roleFromElement(el('card'))).toBe('card'));
  it('falls back to a class-name match for themes that do not mark their elements', () => expect(roleFromElement(el('classPrice'))).toBe('price'));
  it('header and footer text resolve to their chrome role (a link in the header is still a link)', () => {
    expect(roleFromElement(el('hdr'))).toBe('header');
    expect(roleFromElement(el('logo'))).toBe('link');
    expect(roleFromElement(el('fp'))).toBe('footer');
  });
  it('plain page text is "page"; null is "page"', () => {
    expect(roleFromElement(el('plain'))).toBe('page');
    expect(roleFromElement(null)).toBe('page');
  });
});

describe('colour field ↔ role mapping', () => {
  it('every role that can be clicked and has a colour field points at a field that maps back to that same role', () => {
    for (const [role, key] of Object.entries(ROLE_PRIMARY_KEY)) expect(COLOR_KEY_ROLE[key as string]).toBe(role);
  });
});

describe('hover / pick channels', () => {
  it('delivers hover events to subscribers and stops after unsubscribe', () => {
    const fn = vi.fn();
    const off = subscribeHoveredColorRole(fn);
    setHoveredColorRole('button');
    setHoveredColorRole(null);
    off();
    setHoveredColorRole('price');
    expect(fn.mock.calls).toEqual([['button'], [null]]);
  });
  it('delivers picked roles', () => {
    const fn = vi.fn();
    const off = subscribePickedColorRole(fn);
    pickColorRole('sale');
    off();
    expect(fn).toHaveBeenCalledWith('sale');
  });
});
