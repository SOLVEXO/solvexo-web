import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BundleIncludes } from './BundleIncludes';

describe('BundleIncludes', () => {
  it('renders nothing without components', () => {
    expect(render(<BundleIncludes bundle={null} ink="#000" inkMuted="#555" />).container.innerHTML).toBe('');
    expect(render(<BundleIncludes bundle={{ components: [] }} ink="#000" inkMuted="#555" />).container.innerHTML).toBe('');
  });
  it('lists components with quantity', () => {
    render(<BundleIncludes bundle={{ components: [{ name: 'Case', image: null, quantity: 2 }] }} ink="#000" inkMuted="#555" />);
    expect(screen.getByText('Case × 2')).toBeTruthy();
    expect(screen.getByText('This bundle includes')).toBeTruthy();
  });
});
