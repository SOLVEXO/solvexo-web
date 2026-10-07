import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PreviewBlock, PreviewInspectorProvider } from './previewInspector';

describe('preview block inspector', () => {
  it('selects the matching block from a preview click and prevents storefront navigation', () => {
    const onSelectBlock = vi.fn();
    render(
      <PreviewInspectorProvider value={{ sectionId: 'section-a', onSelectBlock }}>
        <PreviewBlock blockId="block-b"><a href="/customer-page">Block content</a></PreviewBlock>
      </PreviewInspectorProvider>,
    );

    const click = fireEvent.click(screen.getByText('Block content'));

    expect(click).toBe(false);
    expect(onSelectBlock).toHaveBeenCalledWith('section-a', 'block-b');
  });

  it('leaves storefront markup unwrapped when the preview inspector is not active', () => {
    const { container } = render(<PreviewBlock blockId="block-b"><span>Storefront content</span></PreviewBlock>);
    expect(container.querySelector('[data-editor-block-id]')).toBeNull();
  });
});
