import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useJsonLd } from './useJsonLd';

describe('useJsonLd', () => {
  it('adds a JSON-LD script to <head> and removes it on unmount', () => {
    const { unmount } = renderHook(() => useJsonLd('t1', { '@type': 'Product', name: 'Coat' }));
    const el = document.head.querySelector('script#ld-t1');
    expect(el?.getAttribute('type')).toBe('application/ld+json');
    expect(JSON.parse(el!.textContent!)).toEqual({ '@type': 'Product', name: 'Coat' });
    unmount();
    expect(document.head.querySelector('script#ld-t1')).toBeNull();
  });

  it('never lets product text close the script tag', () => {
    renderHook(() => useJsonLd('t2', { name: '</script><b>x' }));
    const el = document.head.querySelector('script#ld-t2')!;
    expect(el.textContent).not.toContain('</script>');
    expect(JSON.parse(el.textContent!).name).toBe('</script><b>x');
  });

  it('adds nothing while there is no data yet', () => {
    renderHook(() => useJsonLd('t3', null));
    expect(document.head.querySelector('script#ld-t3')).toBeNull();
  });
});
