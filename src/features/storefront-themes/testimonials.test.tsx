import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Block } from '@/api/services/storefrontTypes';
import { TestimonialsSection } from './TestimonialsSection';

afterEach(cleanup);

const tokens = {
  ink: '#111111', inkMuted: '#777777', bg: '#ffffff', bgAlt: '#f5f5f5',
  accent: '#d97757', displayFont: 'Display', bodyFont: 'Body',
};

const block = (id: string, settings: Record<string, unknown>): Block => ({
  _id: id,
  type: 'testimonial',
  settings,
} as Block);

const section = (settings: Record<string, unknown>) => ({ settings }) as never;

describe('TestimonialsSection', () => {
  it('draws nothing when the section has no testimonials', () => {
    const { container } = render(<TestimonialsSection section={section({})} blocks={[]} tokens={tokens} />);
    expect(container.innerHTML).toBe('');
  });

  it('lays the cards out in the chosen column count (responsive classes)', () => {
    const blocks = [
      block('a', { quote: 'One', authorName: 'A' }),
      block('b', { quote: 'Two', authorName: 'B' }),
    ];
    const { container } = render(<TestimonialsSection section={section({ columns: 2 })} blocks={blocks} tokens={tokens} />);
    const list = container.querySelector('ul')!;
    expect(list.className).toContain('grid-cols-1');
    expect(list.className).toContain('sm:grid-cols-2');
    expect(list.className).not.toContain('lg:grid-cols-3');
    expect(container.querySelectorAll('figure')).toHaveLength(2);
  });

  it('shows the extra title, description and subtitle fields', () => {
    const blocks = [block('a', { quote: 'Great', authorName: 'A', authorRole: 'Buyer', title: 'Loved it', description: 'Long text', subtitle: 'Tagline' })];
    const { container } = render(<TestimonialsSection section={section({})} blocks={blocks} tokens={tokens} />);
    expect(container.textContent).toContain('Loved it');
    expect(container.textContent).toContain('Long text');
    expect(container.textContent).toContain('Tagline');
    expect(container.textContent).toContain('A · Buyer');
  });

  it('puts the photo on the left when that is the chosen position', () => {
    const blocks = [block('a', { quote: 'Great', authorName: 'A', avatarUrl: 'https://x.test/a.jpg' })];
    const { container } = render(<TestimonialsSection section={section({ imagePosition: 'left' })} blocks={blocks} tokens={tokens} />);
    const figure = container.querySelector('figure') as HTMLElement;
    expect(figure.style.flexDirection).toBe('row');
    expect(figure.querySelector('img')).toBeTruthy();
  });

  it('hides the photo entirely when the position is none', () => {
    const blocks = [block('a', { quote: 'Great', authorName: 'A', avatarUrl: 'https://x.test/a.jpg' })];
    const { container } = render(<TestimonialsSection section={section({ imagePosition: 'none' })} blocks={blocks} tokens={tokens} />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('rotates slides in a carousel: arrows, dots and the active slide', () => {
    const blocks = [
      block('a', { quote: 'One', authorName: 'A' }),
      block('b', { quote: 'Two', authorName: 'B' }),
      block('c', { quote: 'Three', authorName: 'C' }),
    ];
    const { container, getByLabelText } = render(
      <TestimonialsSection section={section({ layout: 'carousel', autoplay: false, pagination: 'dots' })} blocks={blocks} tokens={tokens} />,
    );
    // No autoplay in tests: the first slide is the active one.
    expect(container.querySelector('ul')!.style.transform).toContain('-0%');
    fireEvent.click(getByLabelText('Next testimonial'));
    expect(container.querySelector('ul')!.style.transform).toContain('-100%');
    expect(getByLabelText('Go to testimonial 2').getAttribute('aria-current')).toBe('true');
    fireEvent.click(getByLabelText('Previous testimonial'));
    expect(container.querySelector('ul')!.style.transform).toContain('-0%');
  });

  it('renders a fade carousel with every slide stacked in one grid cell', () => {
    const blocks = [block('a', { quote: 'One', authorName: 'A' }), block('b', { quote: 'Two', authorName: 'B' })];
    const { container } = render(
      <TestimonialsSection section={section({ layout: 'carousel', transition: 'fade', autoplay: false })} blocks={blocks} tokens={tokens} />,
    );
    const slides = Array.from(container.querySelectorAll('div[style*="grid-area"]')) as HTMLElement[];
    expect(slides).toHaveLength(2);
    expect(slides[0].style.opacity).toBe('1');
    expect(slides[1].style.opacity).toBe('0');
  });

  it('accepts a theme translator for the star label', () => {
    const blocks = [block('a', { quote: 'Great', authorName: 'A', rating: 4 })];
    const t = (key: string, fallback: string, vars?: Record<string, unknown>) => (key === 'reviews.outOf5' ? `${vars?.value}/${fallback}` : fallback);
    const { container } = render(<TestimonialsSection section={section({})} blocks={[blocks[0]]} tokens={{ ...tokens, t }} />);
    expect(container.querySelector('[aria-label]')!.getAttribute('aria-label')).toContain('4/');
  });
});