import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasswordField } from './PasswordField';

describe('PasswordField', () => {
  it('hides by default and toggles each field independently', () => {
    render(<><PasswordField aria-label="one" defaultValue="a" /><PasswordField aria-label="two" defaultValue="b" /></>);
    const [one, two] = [screen.getByLabelText('one') as HTMLInputElement, screen.getByLabelText('two') as HTMLInputElement];
    expect(one.type).toBe('password');
    fireEvent.click(screen.getAllByRole('button', { name: 'Show password' })[0]);
    expect(one.type).toBe('text');
    expect(two.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(one.type).toBe('password');
  });
});
