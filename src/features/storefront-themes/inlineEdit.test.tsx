import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditableText, InlineEditProvider } from './inlineEdit';

afterEach(cleanup);

describe('EditableText', () => {
  it('renders just the text on the live store (no editor around it)', () => {
    const { container } = render(<h2><EditableText value="New arrivals" settingKey="heading" /></h2>);
    expect(container.innerHTML).toBe('<h2>New arrivals</h2>');
  });

  it('saves the edited text when the merchant clicks away', () => {
    const onEdit = vi.fn();
    render(<InlineEditProvider sectionId="s1" onEdit={onEdit}><EditableText value="New arrivals" settingKey="heading" blockId="b1" /></InlineEditProvider>);
    const box = screen.getByRole('textbox');
    box.textContent = '  Summer   edit ';
    fireEvent.blur(box);
    expect(onEdit).toHaveBeenCalledWith('s1', 'b1', 'heading', 'Summer edit');
  });

  it('does not save unchanged or empty text, and Escape cancels', () => {
    const onEdit = vi.fn();
    render(<InlineEditProvider sectionId="s1" onEdit={onEdit}><EditableText value="Shop" settingKey="heading" /></InlineEditProvider>);
    const box = screen.getByRole('textbox');
    fireEvent.blur(box);
    box.textContent = '   ';
    fireEvent.blur(box);
    expect(box.textContent).toBe('Shop');
    box.textContent = 'Something else';
    fireEvent.keyDown(box, { key: 'Escape' });
    expect(box.textContent).toBe('Shop');
    expect(onEdit).not.toHaveBeenCalled();
  });
});
