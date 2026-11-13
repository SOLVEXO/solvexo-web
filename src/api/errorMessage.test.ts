import { describe, it, expect } from 'vitest';
import { errorMessage } from './errorMessage';

describe('errorMessage', () => {
  it('keeps a message that is already text (hooks store errors as strings)', () => {
    expect(errorMessage('Messaging campaigns are not available yet.')).toBe('Messaging campaigns are not available yet.');
  });
  it('prefers the server message, then the error message, then the fallback', () => {
    expect(errorMessage({ response: { data: { message: 'From server' } }, message: 'x' })).toBe('From server');
    expect(errorMessage({ response: { data: { message: ['First', 'Second'] } } })).toBe('First');
    expect(errorMessage(new Error('Network Error'))).toBe('Network Error');
    expect(errorMessage(null)).toBe('Something went wrong');
    expect(errorMessage('', 'Custom fallback')).toBe('Custom fallback');
  });
});
