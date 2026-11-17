import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { BlockFields } from './BlockFields';
import { BLOCK_SCHEMAS } from './sectionRegistry';

afterEach(cleanup);
const mount = (type: string, settings: Record<string, unknown>) => {
  const onChange = vi.fn();
  render(<BlockFields type={type} settings={settings} onChange={onChange} pageOptions={[]} storeId="S1" />);
  return onChange;
};

describe('Main Product > Trust badges block settings', () => {
  const items = [{ icon: 'truck', title: 'Free shipping', text: '' }];
  it('edits a badge title, icon and adds / removes badges', () => {
    const onChange = mount('product_trust_badges', { items });
    fireEvent.change(screen.getByLabelText('Badge title'), { target: { value: 'Free delivery' } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ items: [expect.objectContaining({ title: 'Free delivery', icon: 'truck' })] }));
    fireEvent.change(screen.getByLabelText('Badge icon'), { target: { value: 'gift' } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ items: [expect.objectContaining({ icon: 'gift' })] }));
    fireEvent.click(screen.getByText('+ Add badge'));
    expect((onChange.mock.calls.at(-1)?.[0] as { items: unknown[] }).items).toHaveLength(2);
    fireEvent.click(screen.getByText('Remove'));
    expect((onChange.mock.calls.at(-1)?.[0] as { items: unknown[] }).items).toHaveLength(0);
  });
  it('stops at six badges', () => {
    mount('product_trust_badges', { items: Array.from({ length: 6 }, () => ({ icon: 'check', title: 'x' })) });
    expect(screen.queryByText('+ Add badge')).toBeNull();
  });
});

describe('Main Product > Photos block settings', () => {
  it('offers four layouts, a photo shape and the zoom switch', () => {
    const schema = BLOCK_SCHEMAS.product_media;
    expect(schema.map(f => f.key)).toEqual(['layout', 'aspect', 'zoom']);
    const layout = schema[0] as { options: { value: string }[] };
    expect(layout.options.map(o => o.value)).toEqual(['thumbs_left', 'thumbs_bottom', 'grid', 'stacked']);
  });
  it('renders in the block editor', () => {
    mount('product_media', {});
    expect(screen.getByText('Photo layout')).toBeTruthy();
    expect(screen.getByText('Photo shape')).toBeTruthy();
  });
});
