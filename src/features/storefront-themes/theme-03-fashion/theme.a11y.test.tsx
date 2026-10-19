import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { FashionProductCardView } from './components/FashionProductCardView';
import { FashionButton } from './components/FashionButton';
import { Dialog } from './ui/Dialog';

// Automated accessibility checks (axe-core) on Maison's building blocks. This is not a full-page browser audit.
describe('Maison accessibility', () => {
  afterEach(cleanup);
  it('product card has no violations (normal, on sale, sold out)', async () => {
    const { container } = render(
      <MemoryRouter>
        <ul style={{ listStyle: 'none' }}>
          <li><FashionProductCardView to="/product/coat" name="Belted coat" image="/a.jpg" tag="outerwear" rating={4.5} price="$189" onAdd={() => undefined} wished={false} onWish={() => undefined} /></li>
          <li><FashionProductCardView to="/product/bag" name="Tote bag" image="/b.jpg" price="$98" comparePrice="$120" percentOff={18} onAdd={() => undefined} wished /></li>
          <li><FashionProductCardView to="/product/watch" name="Watch" image="/c.jpg" price="$280" soldOut /></li>
        </ul>
      </MemoryRouter>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('buttons have no violations', async () => {
    const { container } = render(
      <div>
        <FashionButton>Add to cart</FashionButton>
        <FashionButton variant="outline" disabled>Sold out</FashionButton>
        <FashionButton arrow loading>Checkout</FashionButton>
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('dialog has no violations', async () => {
    const { baseElement } = render(<Dialog title="Size chart" onClose={() => undefined}><p>Chest 90 cm</p></Dialog>);
    expect(await axe(baseElement)).toHaveNoViolations();
  });
});
