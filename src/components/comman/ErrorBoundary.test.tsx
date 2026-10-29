import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never { throw new Error('profile.name is undefined'); }

afterEach(() => cleanup());

describe('ErrorBoundary with a section', () => {
  it('contains a crash to that section and names it, leaving its siblings rendered', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <div>
        <ErrorBoundary section="My Account"><Boom /></ErrorBoundary>
        <ErrorBoundary section="Two-factor sign-in"><p>2FA pane works</p></ErrorBoundary>
      </div>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent("My Account couldn't be shown");
    expect(screen.getByRole('alert')).toHaveTextContent('profile.name is undefined');
    expect(screen.getByText('2FA pane works')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });
});
